from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sentence_transformers import SentenceTransformer, util
import torch
import face_recognition
import numpy as np
import base64
import cv2
import os
import random

app = Flask(__name__)
CORS(app) # 모든 도메인에서의 요청 허용

# ==========================================
# 1. 챗봇 모델 및 데이터 로드 (SBERT)
# ==========================================
print("⏳ AI 모델 및 데이터 로딩 중...")
model = SentenceTransformer('jhgan/ko-sroberta-multitask')

try:
    # 현재 파일 위치 기준으로 csv 파일 찾기
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'company_docs.csv')
    df = pd.read_csv(csv_path, encoding='utf-8')
    question_embeddings = model.encode(df['Question'].tolist(), convert_to_tensor=True)
    print(f"✅ 챗봇 데이터 {len(df)}개 로드 완료")
except Exception as e:
    print(f"❌ 챗봇 데이터 로드 실패: {e}")
    df = pd.DataFrame(columns=['Question', 'Answer'])
    question_embeddings = None

# ==========================================
# 2. 관리자 얼굴 데이터 로드 (Face Recognition)
# ==========================================
known_face_encodings = []
known_face_names = []

def load_admin_faces():
    # 관리자 사진 폴더 경로 (상황에 맞게 수정 가능)
    admin_path = "../../admins"
    if not os.path.exists(admin_path):
        if os.path.exists("admins"): admin_path = "admins"
        else: return

    files = os.listdir(admin_path)
    count = 0
    for file in files:
        if file.endswith((".jpg", ".png", ".jpeg")):
            try:
                img_path = os.path.join(admin_path, file)
                image = face_recognition.load_image_file(img_path)
                encodings = face_recognition.face_encodings(image)
                if encodings:
                    known_face_encodings.append(encodings[0])
                    name = os.path.splitext(file)[0]
                    known_face_names.append(name)
                    count += 1
            except Exception: pass
    print(f"✅ 관리자 얼굴 {count}명 로드 완료")

try:
    load_admin_faces()
except Exception as e:
    print(f"❌ 얼굴 인식 초기화 실패: {e}")


# ==========================================
# 3. [핵심] 상품 이미지 특징점 로드 (Image Search Engine) 👁️
#    - chapter14_local_features.py 의 ORB 개념 적용
# ==========================================
product_features = [] # [{ "filename": "mouse.jpg", "descriptors": des }, ...]

# ORB 검출기 생성 (특징점 1000개 추출)
orb = cv2.ORB_create(nfeatures=1000)

def load_product_features():
    # ⭐ [중요] 실제 이미지가 저장된 경로 (WebConfig와 일치시킴)
    upload_path = "C:/uploads"

    if not os.path.exists(upload_path):
        print(f"⚠️ 경고: 상품 이미지 폴더('{upload_path}')가 없습니다. 이미지 검색 기능을 사용할 수 없습니다.")
        return

    files = os.listdir(upload_path)
    print(f"🔄 상품 이미지 특징점 추출 중... (대상 폴더: {upload_path})")

    count = 0
    for file in files:
        if file.lower().endswith((".jpg", ".png", ".jpeg", ".bmp")):
            try:
                img_path = os.path.join(upload_path, file)

                # 1. 이미지 읽기 (Grayscale)
                # 특징점 추출은 흑백 이미지에서 수행하는 것이 정석입니다.
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

                if img is None: continue

                # 2. ORB 특징점 및 기술자 계산
                # detectAndCompute는 키포인트(위치)와 기술자(지문 데이터)를 반환합니다.
                kp, des = orb.detectAndCompute(img, None)

                if des is not None:
                    product_features.append({
                        "filename": file,
                        "descriptors": des
                    })
                    count += 1
            except Exception as e:
                print(f"  - ❌ 특징점 추출 실패 ({file}): {e}")

    print(f"✅ 총 {count}개 상품의 시각적 특징(Visual Features) 학습 완료!")

# 서버 시작 시 상품 특징점 로드 실행
try:
    load_product_features()
except Exception as e:
    print(f"❌ 이미지 검색 엔진 초기화 실패: {e}")


# ==========================================
# API 1: 챗봇 질문 답변 (/chat)
# ==========================================
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_query = data.get('message')
    if not user_query: return jsonify({"response": "질문을 입력해주세요."})

    query_embedding = model.encode(user_query, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_embedding, question_embeddings)[0]
    best_match_idx = torch.argmax(cos_scores).item()
    best_score = cos_scores[best_match_idx].item()

    if best_score < 0.55:
        return jsonify({"response": "죄송합니다, 학습되지 않은 내용입니다."})
    return jsonify({"response": df.iloc[best_match_idx]['Answer']})


# ==========================================
# API 2: 얼굴 인식 로그인 (/verify-face)
# ==========================================
@app.route('/verify-face', methods=['POST'])
def verify_face():
    try:
        data = request.json
        image_data = data.get('image')
        if not image_data: return jsonify({"status": "fail", "msg": "이미지 데이터 없음"})

        encoded_data = image_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        if not face_encodings: return jsonify({"status": "fail", "msg": "얼굴 감지 실패"})

        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.45)
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    return jsonify({"status": "success", "msg": f"환영합니다 {known_face_names[best_match_index]}님!"})
        return jsonify({"status": "fail", "msg": "등록되지 않은 관리자"})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})


# ==========================================
# API 3: AI 상품 추천 (/recommend)
# ==========================================
@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        target_name = data.get('targetName')
        target_category = data.get('targetCategory')
        target_usage = data.get('targetUsage')
        candidates = data.get('candidates')

        recommendations = []
        valid_candidates = [c for c in candidates if c['category'] != target_category]
        if not valid_candidates: return jsonify({"status": "fail", "recommendations": []})

        selected_items = random.sample(valid_candidates, min(3, len(valid_candidates)))

        for item in selected_items:
            reason = f"🚀 {target_name}와(과) 함께 사용하면 최적의 효율을 내는 {target_usage} 장비입니다."
            recommendations.append({
                "targetProductId": item['id'],
                "targetProductName": item['name'],
                "reason": reason
            })
        return jsonify({"status": "success", "recommendations": recommendations})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})


# ==========================================
# [NEW] API 4: 이미지 검색 & 짝퉁 감지 (/search-image) 🔍
#    - chapter14의 Feature Matching 기술 활용
# ==========================================
@app.route('/search-image', methods=['POST'])
def search_image():
    try:
        # 1. 프론트엔드에서 보낸 파일 받기
        if 'image' not in request.files:
            return jsonify({"status": "error", "msg": "이미지 파일이 없습니다."})

        file = request.files['image']
        img_bytes = file.read()

        # 2. 이미지 디코딩 (Grayscale)
        nparr = np.frombuffer(img_bytes, np.uint8)
        query_img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

        if query_img is None:
            return jsonify({"status": "error", "msg": "이미지 변환 실패"})

        # 3. 업로드된 이미지의 특징점 추출 (ORB)
        kp_query, des_query = orb.detectAndCompute(query_img, None)

        if des_query is None:
            return jsonify({"status": "fail", "msg": "이미지에서 특징을 찾을 수 없습니다."})

        # 4. 매칭 시작 (BFMatcher - Hamming 거리 사용)
        # crossCheck=True를 사용하면 양방향으로 매칭되는 신뢰도 높은 점들만 남깁니다.
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

        results = []

        # 미리 로드해둔 상품들과 비교
        for prod in product_features:
            if prod['descriptors'] is None: continue

            try:
                # 두 이미지의 특징점 매칭
                matches = bf.match(des_query, prod['descriptors'])

                # 매칭된 점의 개수가 곧 유사도 점수 (Score)
                score = len(matches)

                # 점수가 0점이면 제외
                if score > 0:
                    results.append({
                        "filename": prod['filename'],
                        "score": score
                    })
            except Exception:
                continue

        # 5. 점수 높은 순으로 정렬 (내림차순)
        results.sort(key=lambda x: x['score'], reverse=True)

        # 상위 5개만 자르기
        top_results = results[:5]

        # 6. 유사도 판단 (짝퉁 방지용 로직)
        # 매칭 점수가 150점 이상이면 매우 유사하다고 판단 (이 값은 테스트하면서 조정 가능)
        is_duplicate = False
        duplicate_msg = ""

        # 1등이 있고, 그 점수가 150점 이상이면 '중복'으로 판정
        if top_results and top_results[0]['score'] > 150:
            is_duplicate = True
            duplicate_msg = f"기존 상품('{top_results[0]['filename']}')과 이미지가 {top_results[0]['score']}점 만큼 유사합니다."

        return jsonify({
            "status": "success",
            "results": top_results,
            "is_duplicate": is_duplicate,
            "duplicate_msg": duplicate_msg,
            "msg": "이미지 분석 완료"
        })

    except Exception as e:
        print(f"Image Search Error: {e}")
        return jsonify({"status": "error", "msg": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)