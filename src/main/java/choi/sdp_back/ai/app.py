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
import requests
import re
import io

# ⭐ 딥러닝 이미지 분류를 위한 라이브러리 (MobileNetV2)
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image as keras_image
from PIL import Image

app = Flask(__name__)
CORS(app)

# ⭐ 스프링 부트 서버 주소 (로컬 환경)
SPRING_URL = "http://localhost:8080/api"

# ==========================================
# 0. AI 모델 로드 (서버 시작 시 1회 실행)
# ==========================================
print("⏳ AI 모델 및 데이터 로딩 중...")

# 1) 챗봇 모델 (SBERT)
print("🧠 챗봇 모델(SBERT) 로딩 중...")
model = SentenceTransformer('jhgan/ko-sroberta-multitask')

# 2) ⭐ 이미지 분류 모델 (MobileNetV2 - 미리 학습된 모델)
print("🧠 이미지 분류 모델(MobileNetV2) 로딩 중...")
classifier_model = MobileNetV2(weights='imagenet')

# 3) 챗봇 데이터 로드 (CSV)
try:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'company_docs.csv')
    df = pd.read_csv(csv_path, encoding='utf-8')
    question_embeddings = model.encode(df['Question'].tolist(), convert_to_tensor=True)
    print(f"✅ 챗봇 데이터 {len(df)}개 로드 완료")
except Exception as e:
    print(f"❌ 챗봇 데이터 로드 실패: {e}")
    df = pd.DataFrame(columns=['Question', 'Answer'])
    question_embeddings = None

# 4) 관리자 얼굴 데이터 로드
known_face_encodings = []
known_face_names = []

def load_admin_faces():
    # 경로 설정 (상황에 맞게 수정 가능)
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
                    known_face_names.append(os.path.splitext(file)[0])
                    count += 1
            except Exception: pass
    print(f"✅ 관리자 얼굴 {count}명 로드 완료")

load_admin_faces()

# 5) 상품 이미지 특징점 로드 (ORB) - 짝퉁 감지 및 유사도 검색용
product_features = []
orb = cv2.ORB_create(nfeatures=1000)

def imread_korean(filepath):
    """ 한글 경로의 이미지를 읽기 위한 함수 """
    try:
        # 파일을 바이너리로 읽어서 디코딩 (한글 경로 해결)
        img_array = np.fromfile(filepath, np.uint8)
        return cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)
    except Exception:
        return None

def load_product_features():
    global product_features
    product_features = []

    # 1. 이미지 폴더 찾기
    possible_paths = [
        "C:/uploads",
        os.path.join(os.getcwd(), 'uploads'),
        "./static/images"
    ]

    upload_path = None
    for path in possible_paths:
        if os.path.exists(path) and len(os.listdir(path)) > 0:
            upload_path = path
            break

    if not upload_path:
        print("❌ 실패: 이미지 폴더를 못 찾음")
        return

    print(f"\n📂 분석 시작 (폴더: {upload_path})")
    files = os.listdir(upload_path)

    success_count = 0

    for file in files:
        if not file.lower().endswith((".jpg", ".png", ".jpeg", ".bmp", ".webp")):
            continue

        img_path = os.path.join(upload_path, file)

        # 1. 파일 크기 체크 (0바이트면 스킵)
        if os.path.getsize(img_path) == 0:
            # print(f"❌ [0Byte/빈파일] {file}") # 로그 너무 길어지면 주석 처리
            continue

        # 2. 이미지 읽기
        img = imread_korean(img_path)

        # 읽기 실패 시, 일반 opencv로 한 번 더 시도
        if img is None:
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

        if img is None:
            # print(f"❌ [손상됨] {file}") # 로그 너무 길어지면 주석 처리
            continue

        # 3. 특징점 추출
        kp, des = orb.detectAndCompute(img, None)

        if des is not None:
            product_features.append({"filename": file, "descriptors": des})
            success_count += 1
            # ⭐ 성공한 파일명 출력 (이걸로 테스트하세요!)
            print(f"✅ [사용 가능] {file}")

    print("-" * 30)
    print(f"🎉 총 {success_count}개의 이미지가 준비되었습니다.")
    print("👉 위 목록에 있는 '사용 가능' 파일 중 하나를 업로드하면 중복 감지가 됩니다!")
    print("-" * 30)

# 실행
load_product_features()


# =========================================================
# API 1: 챗봇 질문 답변 (개인화 + 하이브리드) 🚀
# =========================================================
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_query = data.get('message', '')
    user_id = data.get('user_id', 'guest') # 프론트에서 보낸 ID 받기

    if not user_query: return jsonify({"response": "질문을 입력해주세요."})

    # ⭐ [1] 개인화된 주문/배송 조회 (Context-Aware)
    personal_keywords = ["내 주문", "내 배송", "배송 언제", "어디쯤", "주문 상태", "주문 내역"]
    if any(k in user_query for k in personal_keywords) and user_id != 'guest' and user_id != 'null':
        try:
            # Spring API 호출
            res = requests.get(f"{SPRING_URL}/shop-orders?memberId={user_id}")

            if res.status_code == 200:
                orders = res.json()
                if orders and len(orders) > 0:
                    last_order = orders[0]

                    # 🚨 [디버깅] 터미널에 키 값들을 싹 다 출력해봅니다 (범인 색출)
                    print(f"🔍 Spring에서 받은 데이터 키 목록: {list(last_order.keys())}")
                    print(f"🔍 전체 데이터: {last_order}")

                    status = last_order.get('status', '확인불가')
                    product_name = last_order.get('productName', '상품')


                    real_order_id = (last_order.get('trackingCode') or
                                     last_order.get('merchantUid') or
                                     last_order.get('orderId') or
                                     last_order.get('id') or
                                     "번호없음")

                    # 상태별 멘트
                    status_msg = f"현재 **[{status}]** 단계입니다."
                    if status == 'ORDERED': status_msg = "주문이 접수되어 제작 대기 중입니다."
                    elif status == 'MANUFACTURING': status_msg = "엔지니어가 열심히 조립 중입니다! 🛠️"
                    elif status == 'QUALITY_CHECK': status_msg = "꼼꼼하게 검수 중입니다. 👀"
                    elif status == 'SHIPPING': status_msg = "배송이 시작되었습니다! 🚚"

                    return jsonify({
                        "response": f"최근 주문하신 **'{product_name}'** 건 말씀이신가요?\n{status_msg}\n(주문번호: {real_order_id})"
                    })
                else:
                    return jsonify({"response": "고객님의 최근 주문 내역을 찾을 수 없습니다. 😅"})
        except Exception as e:
            print(f"Spring 통신 오류: {e}")

    # ⭐ [2] 특정 주문번호 조회 (기존 로직)
    search_keywords = ["ord-", "mid_", "cart_", "주문번호"]
    if any(k in user_query for k in search_keywords):
        words = user_query.split()
        order_id = None
        for w in words:
            if "ord-" in w or "mid_" in w or "cart_" in w:
                order_id = w
                break
        if order_id:
            try:
                res = requests.get(f"{SPRING_URL}/shop-orders/status/{order_id}")
                if res.status_code == 200:
                    info = res.json()
                    if info['status'] == 'NOT_FOUND':
                        return jsonify({"response": f"주문번호 '{order_id}'를 찾을 수 없습니다."})
                    return jsonify({"response": f"📦 주문({order_id}) 상태: **[{info['status']}]**\n({info['msg']})"})
            except: return jsonify({"response": "서버 통신 오류가 발생했습니다."})

    # ⭐ [3] 리뷰 요약/평가 조회
    if any(keyword in user_query for keyword in ["어때", "평가", "리뷰", "반응"]):
        # 조사 제거 후 상품명 추출
        target_product = re.sub(r'[은는이가요\?]', '', user_query.replace("어때", "").replace("평가", "").replace("리뷰", "")).strip()
        if target_product:
            try:
                res = requests.get(f"{SPRING_URL}/reviews/summary-by-name?productName={target_product}")
                if res.status_code == 200:
                    stats = res.json()
                    if stats.get("status") != "NOT_FOUND":
                        total = stats.get('totalReviews', 0)
                        if total > 0:
                            tags = ", ".join([f"#{t['tag']}" for t in stats.get('topTags', [])[:3]])
                            return jsonify({"response": f"🔍 '{target_product}' 분석 결과:\n총 {total}개의 리뷰가 있으며, 주로 **{tags}** 의견이 많습니다!"})
                        else:
                            return jsonify({"response": f"'{target_product}'는 아직 리뷰가 없습니다."})
            except: pass

    # ⭐ [4] 일반 질문 (SBERT 유사도 검색)
    if question_embeddings is None:
        return jsonify({"response": "죄송합니다, 현재 상담 시스템 점검 중입니다."})

    query_embedding = model.encode(user_query, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_embedding, question_embeddings)[0]
    best_match_idx = torch.argmax(cos_scores).item()
    best_score = cos_scores[best_match_idx].item()

    if best_score < 0.55:
        return jsonify({"response": "죄송합니다, 이해하지 못했습니다. 😅\n정확한 상품명이나 주문번호를 말씀해 주세요."})

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
            if True in matches:
                return jsonify({"status": "success", "msg": "인증 성공! 환영합니다."})
        return jsonify({"status": "fail", "msg": "등록되지 않은 관리자입니다."})
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
        candidates = data.get('candidates')

        recommendations = []
        valid_candidates = [c for c in candidates if c['category'] != target_category]
        if not valid_candidates: valid_candidates = candidates

        selected_items = random.sample(valid_candidates, min(3, len(valid_candidates)))

        for item in selected_items:
            reason = f"🚀 {target_name} 사용 시 시너지가 좋은 {item['category']} 장비입니다."
            recommendations.append({
                "targetProductId": item['id'],
                "targetProductName": item['name'],
                "reason": reason
            })
        return jsonify({"status": "success", "recommendations": recommendations})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})


# ==========================================
# API 4: 이미지 검색 & 짝퉁 감지 (ORB) - 수정버전
# ==========================================
@app.route('/search-image', methods=['POST'])
def search_image():
    try:
        if 'image' not in request.files:
            return jsonify({"status": "error", "msg": "이미지 파일이 없습니다."})

        file = request.files['image']
        img_bytes = file.read()
        file.seek(0) # 파일 포인터 초기화

        nparr = np.frombuffer(img_bytes, np.uint8)
        query_img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

        if query_img is None:
            return jsonify({"status": "error", "msg": "이미지 변환 실패"})

        kp_query, des_query = orb.detectAndCompute(query_img, None)

        if des_query is None:
            return jsonify({"status": "fail", "msg": "이미지에서 특징을 찾을 수 없습니다."})

        # 🚨 디버깅용 로그: 비교 대상이 몇 개인지 확인
        print(f"🔍 현재 비교 대상 이미지 수: {len(product_features)}개")

        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        results = []

        for prod in product_features:
            if prod['descriptors'] is None: continue
            try:
                matches = bf.match(des_query, prod['descriptors'])
                score = len(matches)
                # 매칭 점수가 20점 이상인 것만 결과에 포함
                if score > 20:
                    results.append({"filename": prod['filename'], "score": score})
            except Exception: continue

        results.sort(key=lambda x: x['score'], reverse=True)
        top_results = results[:5]

        is_duplicate = False
        duplicate_msg = ""

        # ⭐ [수정] 기준 점수를 150 -> 80으로 낮춤 (민감도 증가)
        # 같은 사진이면 보통 300~500점 나오지만, 해상도가 다르면 점수가 낮을 수 있음
        if top_results and top_results[0]['score'] > 80:
            is_duplicate = True
            matched_filename = top_results[0]['filename']
            duplicate_msg = f"기존 상품('{matched_filename}')과 이미지가 매우 유사합니다. (일치도: {top_results[0]['score']})"
            print(f"🚫 중복 감지됨! ({matched_filename}, 점수: {top_results[0]['score']})")

        return jsonify({
            "status": "success",
            "results": top_results,
            "is_duplicate": is_duplicate,
            "duplicate_msg": duplicate_msg
        })
    except Exception as e:
        print(f"에러 발생: {e}")
        return jsonify({"status": "error", "msg": str(e)})


# ==========================================
# API 5: ⭐ [NEW] 카테고리 자동 분류 (MobileNetV2)
# ==========================================
@app.route('/predict-category', methods=['POST'])
def predict_category():
    try:
        if 'image' not in request.files:
            return jsonify({"status": "error", "msg": "이미지 파일이 없습니다."})

        file = request.files['image']

        # 1. PIL 이미지로 로드 및 전처리 (224x224 리사이징)
        img = Image.open(file)
        if img.mode != 'RGB': img = img.convert('RGB')
        img = img.resize((224, 224))

        # 2. 배열 변환 및 MobileNetV2 입력 규격화
        x = keras_image.img_to_array(img)
        x = np.expand_dims(x, axis=0)
        x = preprocess_input(x)

        # 3. 예측 실행
        preds = classifier_model.predict(x)
        decoded = decode_predictions(preds, top=3)[0] # 상위 3개 확률

        print(f"🔍 AI 예측 결과: {decoded}") # 디버깅용 로그

        # 4. ImageNet 라벨 -> 쇼핑몰 카테고리 매핑
        top_label = decoded[0][1].lower() # 가장 높은 확률의 라벨
        detected_category = "ETC"

        # 매핑 규칙 (키보드, 마우스, 모니터 등)
        if 'keyboard' in top_label or 'typewriter' in top_label or 'space_bar' in top_label:
            detected_category = "KEYBOARD"
        elif 'mouse' in top_label or 'trackball' in top_label:
            detected_category = "MOUSE"
        elif 'monitor' in top_label or 'screen' in top_label or 'television' in top_label or 'desktop' in top_label:
            detected_category = "MONITOR"
        elif 'loudspeaker' in top_label or 'speaker' in top_label or 'woofer' in top_label:
            detected_category = "SPEAKER"
        elif 'computer' in top_label or 'notebook' in top_label or 'laptop' in top_label:
            detected_category = "PC_SET"

        return jsonify({
            "status": "success",
            "category": detected_category,
            "raw_prediction": top_label
        })

    except Exception as e:
        print(f"예측 오류: {e}")
        return jsonify({"status": "error", "msg": str(e)})


# ==========================================
# API 6: 과소비 방지 (지갑 지킴이)
# ==========================================
@app.route('/check-consumption', methods=['POST'])
def check_consumption():
    data = request.json
    current_input = data.get('current', [])
    past_orders = data.get('past_orders', [])

    if not past_orders:
        return jsonify({'status': 'safe', 'msg': '첫 구매이시군요! 안심하고 구매하세요.'})

    if isinstance(current_input, str): current_list = [current_input]
    else: current_list = current_input

    for new_item in current_list:
        new_emb = model.encode(new_item)
        for past_item in past_orders:
            past_emb = model.encode(past_item)
            score = util.cos_sim(new_emb, past_emb).item()
            if score >= 0.7:
                return jsonify({
                    'status': 'warning',
                    'isOverConsumption': True,
                    'reason': f"⚠️ 경고: 장바구니에 있는 '{new_item}' 제품이\n과거에 구매한 '{past_item}'과 용도가 중복됩니다."
                })

    return jsonify({'status': 'safe', 'isOverConsumption': False, 'msg': '합리적인 소비입니다!'})


# ==========================================
# API 7: 리뷰 감정 분석 및 자동 태그 생성
# ==========================================
# 1. 감지할 키워드 사전 정의
REVIEW_CATEGORIES = {
    "배송": {
        "배송빠름": ["빨라요", "총알", "바로", "다음날", "일찍"],
        "배송느림": ["늦어요", "지연", "안와요", "느려요"],
        "포장꼼꼼": ["포장", "박스", "뽁뽁이", "안전"]
    },
    "품질": {
        "품질좋음": ["튼튼", "마감", "깔끔", "예뻐요", "좋아요"],
        "가성비": ["가성비", "가격", "저렴", "싸게"],
        "마감아쉽": ["기스", "불량", "상처", "별로"]
    }
}

@app.route('/analyze-review', methods=['POST'])
def analyze_review():
    data = request.json
    content = data.get('content', '')
    if not content: return jsonify({"status": "fail"})

    # 1. 긍정/부정 분석 (SBERT)
    pos = model.encode("좋아요 추천 만족 최고").tolist()
    neg = model.encode("별로 최악 실망 환불").tolist()
    target = model.encode(content).tolist()

    pos_score = util.cos_sim(target, pos).item()
    neg_score = util.cos_sim(target, neg).item()

    sentiment = "POSITIVE" if pos_score > neg_score else "NEGATIVE"
    if abs(pos_score - neg_score) < 0.1: sentiment = "NEUTRAL"

    # 2. 태그 자동 생성 로직
    generated_tags = []

    # 사전을 돌면서 단어가 포함되어 있는지 확인
    for category, sub_cats in REVIEW_CATEGORIES.items():
        for tag, keywords in sub_cats.items():
            # 댓글 내용에 키워드가 하나라도 있으면 태그 추가
            if any(k in content for k in keywords):
                generated_tags.append(f"#{tag}")

    # 태그가 하나도 없으면 감정 태그라도 붙임
    if not generated_tags:
        if sentiment == "POSITIVE": generated_tags.append("#만족해요")
        elif sentiment == "NEGATIVE": generated_tags.append("#아쉬워요")
        else: generated_tags.append("#AI분석완료")

    # 결과 반환 (태그 리스트를 문자열로 합쳐서 전송)
    return jsonify({
        "status": "success",
        "sentiment": sentiment,
        "tags": " ".join(generated_tags)
    })

# ==========================================
# API 8: 민원 분석
# ==========================================
@app.route('/analyze-contact', methods=['POST'])
def analyze_contact():
    data = request.json
    full_text = f"{data.get('title', '')} {data.get('content', '')}"

    urgent_words = ["신고", "고발", "사기", "당장", "화가"]
    priority = "NORMAL"
    if any(w in full_text for w in urgent_words): priority = "CRITICAL"

    return jsonify({
        "status": "success",
        "category": "일반 문의",
        "priority": priority,
        "ai_memo": f"AI 분석 결과: {priority} 건입니다."
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)