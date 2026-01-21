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

# ==========================================
# [기능 5] 과소비/중복 구매 방지 (지갑 지킴이)
# ==========================================
@app.route('/check-consumption', methods=['POST'])
def check_consumption():
    data = request.json
    current_input = data.get('current', [])       # 장바구니에 담긴 물건들 (문자열 또는 리스트)
    past_orders = data.get('past_orders', [])     # 과거에 샀던 물건들

    if not past_orders:
        return jsonify({'status': 'safe', 'msg': '첫 구매이시군요! 안심하고 구매하세요.'})

    # 1. 입력값이 하나(문자열)면 리스트로 감싸서 처리 (호환성 유지)
    if isinstance(current_input, str):
        current_list = [current_input]
    else:
        current_list = current_input

    # 2. 장바구니 물건 하나하나 꺼내서 검사
    for new_item in current_list:
        new_emb = model.encode(new_item)

        for past_item in past_orders:
            past_emb = model.encode(past_item)
            score = util.cos_sim(new_emb, past_emb).item()

            # 유사도가 70% 넘으면 즉시 경고 (하나라도 걸리면 잡는다)
            if score >= 0.7:
                return jsonify({
                    'status': 'warning',
                    'isOverConsumption': True,
                    'reason': f"장바구니에 있는 '{new_item}' 제품이\n과거에 구매한 '{past_item}'과 {int(score*100)}% 유사합니다.\n\n중복 투자가 아닌지 확인해보세요!"
                })

    # 3. 전부 통과하면 안전
    return jsonify({
        'status': 'safe',
        'isOverConsumption': False,
        'msg': '합리적인 소비입니다!'
    })

# ==========================================
# [기능 6] AI 리뷰 분석기 (Smart Review System)
# ==========================================
# 분석할 태그 후보군 (SBERT가 문맥을 읽어서 가장 가까운 걸 고름)
# 1. 태그 정의 (띄어쓰기 제거함 & 카테고리화)
# 구조: "카테고리": {"태그명": [예시문장들...]}
REVIEW_CATEGORIES = {
    "delivery": {
        "배송빠름": ["배송이 빨라요", "하루만에 왔어요", "총알 배송", "일찍 도착"],
        "배송느림": ["배송이 늦어요", "택배가 안와요", "일주일 걸림", "지연"]
    },
    "price": {
        "가성비굿": ["가격이 착해요", "이 가격에 미쳤다", "가성비 최고", "저렴"],
        "가격비쌈": ["비싸요", "가격 값을 못해요", "너무 비쌈", "바가지"]
    },
    "quality": {
        "품질좋음": ["마감이 좋아요", "튼튼해요", "고급스러워요", "퀄리티"],
        "마감아쉽": ["기스가 있어요", "마감이 별로", "유격이 있네요", "불량"]
    },
    "design": {
        "디자인예쁨": ["실물이 더 예뻐요", "디자인 깔끔함", "색감이 좋아요", "이뻐요"]
    }
}

@app.route('/analyze-review', methods=['POST'])
def analyze_review():
    data = request.json
    content = data.get('content', '')

    if not content:
        return jsonify({"status": "fail", "msg": "내용 없음"})

    # 1. 감정 분석 (기존 로직 유지)
    pos_anchor = model.encode("정말 좋아요 만족합니다 최고의 제품 추천합니다")
    neg_anchor = model.encode("별로에요 실망입니다 환불하고 싶어요 최악")
    target_emb = model.encode(content)

    pos_score = util.cos_sim(target_emb, pos_anchor).item()
    neg_score = util.cos_sim(target_emb, neg_anchor).item()

    sentiment = "NEUTRAL"
    if pos_score > neg_score + 0.05:
        sentiment = "POSITIVE"
    elif neg_score > pos_score + 0.05:
        sentiment = "NEGATIVE"

    # 2. 태그 추출 (경쟁 로직 적용 🥊)
    final_tags = []

    for category, tags_map in REVIEW_CATEGORIES.items():
        best_tag = None
        # ⭐ [수정] 임계값을 0.4 -> 0.65 로 대폭 상향!
        # SBERT 모델 특성상 0.4는 "글의 분위기가 비슷함" 정도고,
        # 0.6 이상이어야 "내용이 일치함"으로 볼 수 있습니다.
        best_score = 0.65

        for tag_name, examples in tags_map.items():
            example_embs = model.encode(examples)
            sim_score = util.cos_sim(target_emb, example_embs).max().item()

            if sim_score > best_score:
                best_score = sim_score
                best_tag = tag_name

        if best_tag:
            final_tags.append(best_tag)

    # 결과 포장
    formatted_tags = " ".join([f"#{tag}" for tag in final_tags])

    return jsonify({
        "status": "success",
        "sentiment": sentiment,
        "tags": formatted_tags
    })

# ==========================================
# [기능 7] AI 스마트 민원 분류 (Smart Inquiry) 🚨
# ==========================================

# 1. 민원 카테고리 정의 (SBERT가 문맥을 읽어서 가장 비슷한 걸 찾음)
INQUIRY_CATEGORIES = {
    "배송 문의": ["배송이 언제 오나요?", "택배가 안 움직여요", "송장 번호 조회", "배송 지연", "아직도 상품 준비중인가요"],
    "환불/교환": ["환불해 주세요", "물건이 깨져서 왔어요", "반품 신청하고 싶어요", "다른 상품이 왔어요", "파손"],
    "제품 문의": ["이거 재고 있나요?", "스펙이 어떻게 되나요?", "AS 가능한가요?", "호환성 질문"],
    "기타 문의": ["회원 탈퇴 방법", "로그인이 안 돼요", "사이트 오류", "포인트 적립"]
}

# 2. 긴급 키워드 (이 단어가 포함되면 관리자에게 비상벨을 울림)
URGENT_KEYWORDS = ["화가", "신고", "사기", "당장", "소비자원", "경찰", "법적", "고발", "최악", "쓰레기"]

@app.route('/analyze-contact', methods=['POST'])
def analyze_contact():
    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')

    # 제목과 내용을 합쳐서 분석 (정보량이 많을수록 정확함)
    full_text = f"{title} {content}"

    if not full_text.strip():
        return jsonify({"status": "fail", "msg": "내용 없음"})

    # 1. 응급도 분석 (키워드 매칭 방식)
    # 화난 고객의 키워드가 하나라도 있으면 'CRITICAL'로 격상
    priority = "NORMAL"
    detected_urgent_words = []

    for keyword in URGENT_KEYWORDS:
        if keyword in full_text:
            priority = "CRITICAL"
            detected_urgent_words.append(keyword)
            # 하나만 발견돼도 긴급이므로 break 가능하지만, 분석 리포트를 위해 다 찾음

    # 2. 카테고리 자동 분류 (SBERT 유사도 대결)
    best_category = "일반 문의"
    max_score = 0
    target_emb = model.encode(full_text)

    for category, examples in INQUIRY_CATEGORIES.items():
        example_embs = model.encode(examples)
        # 입력된 민원과 카테고리 예시들 간의 유사도 중 최대값
        score = util.cos_sim(target_emb, example_embs).max().item()

        if score > max_score:
            max_score = score
            best_category = category

    # 유사도가 너무 낮으면(0.35 미만) 억지로 분류하지 않고 '기타'로 둠
    if max_score < 0.35:
        best_category = "기타 문의"

    # 관리자에게 보여줄 AI 한줄 요약
    ai_memo_text = f"[{best_category}] 관련 문의입니다."
    if priority == "CRITICAL":
        ai_memo_text = f"🚨 [긴급] '{detected_urgent_words}' 언급됨! 즉시 대응 필요."

    return jsonify({
        "status": "success",
        "category": best_category,
        "priority": priority,
        "ai_memo": ai_memo_text
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)