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
CORS(app) # 모든 도메인에서의 요청 허용 (Spring Boot와의 통신을 위해 필수)

# ==========================================
# 1. 챗봇 모델 및 데이터 로드 (SBERT)
# ==========================================
print("⏳ AI 모델 및 데이터 로딩 중...")
model = SentenceTransformer('jhgan/ko-sroberta-multitask')

try:
    # 👇 [수정할 부분 시작] 이 부분을 복사해서 덮어씌우세요!

    # 1. 현재 이 파일(app.py)이 있는 진짜 경로를 찾아냅니다.
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # 2. 그 경로에 있는 company_docs.csv 파일을 지목합니다.
    csv_path = os.path.join(base_dir, 'company_docs.csv')

    print(f"📂 파일 찾는 위치: {csv_path}") # 로그로 확인 가능

    # 3. 절대 경로로 파일을 읽어옵니다.
    df = pd.read_csv(csv_path, encoding='utf-8')

    # 👆 [수정할 부분 끝]
    question_embeddings = model.encode(df['Question'].tolist(), convert_to_tensor=True)
    print(f"✅ 챗봇 데이터 {len(df)}개 로드 완료")
except Exception as e:
    print(f"❌ 챗봇 데이터 로드 실패: {e}")
    # 실패해도 서버가 죽지 않도록 빈 데이터프레임 생성
    df = pd.DataFrame(columns=['Question', 'Answer'])
    question_embeddings = None

# ==========================================
# 2. 관리자 얼굴 데이터 로드 (Face Recognition)
# ==========================================
known_face_encodings = []
known_face_names = []

def load_admin_faces():
    # 관리자 사진이 저장된 폴더 경로 (프로젝트 구조에 따라 수정 필요)
    # 기본적으로 sdp-back 루트의 admins 폴더를 찾습니다.
    admin_path = "../../admins"

    if not os.path.exists(admin_path):
        if os.path.exists("admins"):
            admin_path = "admins"
        else:
            print(f"⚠️ 경고: 관리자 사진 폴더('{admin_path}')를 찾을 수 없습니다.")
            return

    files = os.listdir(admin_path)
    print(f"🔄 관리자 얼굴 학습 중... (총 {len(files)}장)")

    count = 0
    for file in files:
        if file.endswith((".jpg", ".png", ".jpeg")):
            try:
                img_path = os.path.join(admin_path, file)
                image = face_recognition.load_image_file(img_path)

                # 이미지에서 얼굴 특징점 추출
                encodings = face_recognition.face_encodings(image)

                if encodings:
                    known_face_encodings.append(encodings[0])
                    # 파일명에서 확장자 제거 후 이름으로 사용 (예: admin.jpg -> admin)
                    name = os.path.splitext(file)[0]
                    known_face_names.append(name)
                    print(f"  - 학습 완료: {name}")
                    count += 1
                else:
                    print(f"  - ❌ 얼굴 감지 실패 (사람이 없거나 너무 작음): {file}")
            except Exception as e:
                print(f"  - ❌ 파일 로드 에러 ({file}): {e}")
    print(f"✅ 총 {count}명의 관리자 얼굴 학습 완료!")

# 서버 시작 시 얼굴 로드 함수 실행
try:
    load_admin_faces()
except Exception as e:
    print(f"❌ 얼굴 인식 모듈 초기화 실패: {e}")


# ==========================================
# API 1: 챗봇 질문 답변 (/chat)
# ==========================================
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_query = data.get('message')

    if not user_query:
        return jsonify({"response": "질문을 입력해주세요."})

    # 사용자 질문을 벡터로 변환
    query_embedding = model.encode(user_query, convert_to_tensor=True)

    # 코사인 유사도 계산
    cos_scores = util.cos_sim(query_embedding, question_embeddings)[0]
    best_match_idx = torch.argmax(cos_scores).item()
    best_score = cos_scores[best_match_idx].item()

    # 터미널에 로그 출력 (디버깅용)
    print(f"[Chat] 질문: {user_query} | 유사도: {best_score:.4f} | 매칭: {df.iloc[best_match_idx]['Question']}")

    # 유사도 기준점 (Threshold) 설정 (0.55 미만이면 모르는 질문 취급)
    if best_score < 0.55:
        return jsonify({"response": "죄송합니다, 아직 학습되지 않은 내용입니다. 😓\n고객센터로 문의 부탁드립니다."})

    answer = df.iloc[best_match_idx]['Answer']
    return jsonify({"response": answer})


# ==========================================
# API 2: 얼굴 인식 로그인 (/verify-face)
# ==========================================
@app.route('/verify-face', methods=['POST'])
def verify_face():
    try:
        data = request.json
        image_data = data.get('image') # React에서 보낸 Base64 이미지

        if not image_data:
            return jsonify({"status": "fail", "msg": "이미지 데이터가 없습니다."})

        # Base64 디코딩 -> OpenCV 포맷으로 변환
        encoded_data = image_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # 얼굴 인식 라이브러리는 RGB를 사용하므로 BGR -> RGB 변환
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # 화면에서 얼굴 위치 찾기
        face_locations = face_recognition.face_locations(rgb_frame)
        # 찾은 위치의 얼굴 특징 추출
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        if not face_encodings:
            return jsonify({"status": "fail", "msg": "얼굴을 찾을 수 없습니다."})

        # 등록된 관리자 얼굴들과 비교
        for face_encoding in face_encodings:
            # tolerance: 낮을수록 엄격함 (0.4 ~ 0.5 추천)
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.45)
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)

            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    name = known_face_names[best_match_index]
                    return jsonify({"status": "success", "msg": f"환영합니다, {name} 관리자님!"})

        return jsonify({"status": "fail", "msg": "등록되지 않은 관리자입니다."})

    except Exception as e:
        print(f"Face Error: {e}")
        return jsonify({"status": "error", "msg": "서버 오류가 발생했습니다."})


# ==========================================
# API 3: AI 상품 추천 (/recommend) - NEW! 🌟
# ==========================================
@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        # Spring Boot에서 보내준 데이터
        target_name = data.get('targetName')       # 예: 로지텍 G Pro
        target_category = data.get('targetCategory')  # 예: MOUSE
        target_usage = data.get('targetUsage')        # 예: GAMING
        candidates = data.get('candidates')        # 같은 용도(GAMING)의 전체 상품 리스트

        print(f"🔍 [추천 요청] 상품: {target_name} ({target_category}/{target_usage}) | 후보군: {len(candidates)}개")

        recommendations = []

        # 1. 교차 판매(Cross-Selling) 로직:
        # "같은 카테고리"는 추천에서 제외합니다. (마우스 사는데 마우스 추천 X)
        valid_candidates = [c for c in candidates if c['category'] != target_category]

        # 2. 후보가 없으면 빈 리스트 반환
        if not valid_candidates:
            print("   -> 추천할 적합한 후보가 없음 (모두 같은 카테고리거나 데이터 부족)")
            return jsonify({"status": "fail", "recommendations": []})

        # 3. 랜덤으로 3개 선택 (데이터가 많아지면 여기서 SBERT 유사도 등을 활용 가능)
        selected_count = min(3, len(valid_candidates))
        selected_items = random.sample(valid_candidates, selected_count)

        # 4. 추천 멘트 생성 (용도별 템플릿 적용)
        for item in selected_items:
            reason = ""

            # 용도(Usage)에 따른 감성 멘트 생성
            if target_usage == 'GAMING':
                reason = f"🚀 {target_name}의 퍼포먼스를 극대화할 수 있는 최고의 게이밍 파트너입니다."
            elif target_usage == 'OFFICE':
                reason = f"💼 {target_name}와(과) 함께라면 업무 효율이 배가 되는 최적의 조합입니다."
            elif target_usage == 'WORKSTATION':
                reason = f"⚡ 전문가의 작업 환경을 완성하는 완벽한 호환성을 자랑합니다."
            else:
                reason = f"✨ {target_name}와(과) 함께 사용하면 더욱 만족스러운 {item['name']}입니다."

            recommendations.append({
                "targetProductId": item['id'],
                "targetProductName": item['name'],
                "reason": reason
            })

        print(f"   -> ✅ 추천 완료: {len(recommendations)}개 생성")
        return jsonify({"status": "success", "recommendations": recommendations})

    except Exception as e:
        print(f"Recommend Error: {e}")
        return jsonify({"status": "error", "msg": str(e)})

# ==========================================
# 서버 실행
# ==========================================
if __name__ == '__main__':
    # 5002번 포트에서 실행
    app.run(host='0.0.0.0', port=5002)