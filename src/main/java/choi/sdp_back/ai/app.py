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

app = Flask(__name__)
CORS(app)

# ⭐ 스프링 부트 서버 주소 (로컬 환경)
SPRING_URL = "http://localhost:8080/api"

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
# 3. 상품 이미지 특징점 로드 (Image Search Engine) 👁️
# ==========================================
product_features = []
orb = cv2.ORB_create(nfeatures=1000)

def load_product_features():
    # ⭐ [중요] 실제 이미지가 저장된 경로
    upload_path = "C:/uploads"

    if not os.path.exists(upload_path):
        print(f"⚠️ 경고: 상품 이미지 폴더('{upload_path}')가 없습니다.")
        return

    files = os.listdir(upload_path)
    count = 0
    for file in files:
        if file.lower().endswith((".jpg", ".png", ".jpeg", ".bmp")):
            try:
                img_path = os.path.join(upload_path, file)
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                if img is None: continue

                kp, des = orb.detectAndCompute(img, None)
                if des is not None:
                    product_features.append({
                        "filename": file,
                        "descriptors": des
                    })
                    count += 1
            except Exception: pass

    print(f"✅ 총 {count}개 상품 특징점 로드 완료")

try:
    load_product_features()
except Exception as e:
    print(f"❌ 이미지 검색 엔진 초기화 실패: {e}")


# =========================================================
# API 1: 챗봇 질문 답변 (DB 연동 + CSV 하이브리드) 🚀
# =========================================================
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_query = data.get('message', '')
    if not user_query: return jsonify({"response": "질문을 입력해주세요."})

    # 1. [배송 조회] (키워드: ord-, mid_, cart_, 주문번호)
    search_keywords = ["ord-", "mid_", "cart_", "주문번호"]

    if any(k in user_query for k in search_keywords):
        words = user_query.split()
        order_id = None
        for w in words:
            # 사용자가 입력한 단어 중 cart_, ord_, mid_ 가 포함된 것을 주문번호로 인식
            if "ord-" in w or "mid_" in w or "cart_" in w:
                order_id = w
                break

        if order_id:
            try:
                # Spring API 호출 (주문 상태 조회)
                res = requests.get(f"{SPRING_URL}/shop-orders/status/{order_id}")
                if res.status_code == 200:
                    info = res.json()
                    if info['status'] == 'NOT_FOUND':
                        return jsonify({"response": f"죄송합니다. 주문번호 '{order_id}'를 찾을 수 없습니다."})
                    else:
                        return jsonify({"response": f"📦 고객님의 주문({order_id})은 현재 **[{info['status']}]** 상태입니다.\n({info['msg']})"})
            except Exception:
                return jsonify({"response": "배송 정보를 조회하는 중 서버 통신 오류가 발생했습니다."})
        else:
            return jsonify({"response": "배송 조회를 위해 'cart_' 또는 'mid_'로 시작하는 정확한 주문번호를 입력해주세요."})

    # 2. [제품 평가 조회] (키워드: 어때, 평가, 리뷰)
    if any(keyword in user_query for keyword in ["어때", "평가", "리뷰", "반응"]):
        # 상품명 추출 (간단하게 조사를 지워서 상품명만 남기기)
        target_product = user_query.replace("어때", "").replace("평가", "").replace("리뷰", "").replace("는", "").replace("가", "").replace("요", "").replace("?", "").strip()

        if target_product:
            try:
                # Spring API 호출 (상품명으로 리뷰 통계 조회)
                res = requests.get(f"{SPRING_URL}/reviews/summary-by-name?productName={target_product}")
                if res.status_code == 200:
                    stats = res.json()
                    if "status" in stats and stats["status"] == "NOT_FOUND":
                        pass # 상품 없으면 아래 CSV 검색으로 넘김
                    else:
                        total = stats.get('totalReviews', 0)
                        if total == 0:
                            return jsonify({"response": f"'{target_product}'는 아직 리뷰가 없어요. 첫 번째 리뷰어가 되어보세요!"})

                        top_tags = stats.get('topTags', [])
                        if top_tags:
                            tag_text = ", ".join([f"#{t['tag']}" for t in top_tags[:3]])
                            return jsonify({"response": f"🔍 '{target_product}' 분석 결과입니다.\n총 {total}개의 리뷰가 있으며, 주로 **{tag_text}** 등의 평가가 많습니다!"})
            except Exception: pass

            # 3. [일반 FAQ] (기존 CSV 검색)
    if question_embeddings is None:
        return jsonify({"response": "죄송합니다, 현재 상담이 어렵습니다."})

    query_embedding = model.encode(user_query, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_embedding, question_embeddings)[0]
    best_match_idx = torch.argmax(cos_scores).item()
    best_score = cos_scores[best_match_idx].item()

    if best_score < 0.55:
        return jsonify({"response": "죄송합니다, 무슨 말씀인지 잘 모르겠어요. 상품명이나 주문번호(cart_...)를 정확히 말씀해 주시겠어요?"})

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
                return jsonify({"status": "success", "msg": "환영합니다!"})
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
# API 4: 이미지 검색 & 짝퉁 감지 (/search-image)
# ==========================================
@app.route('/search-image', methods=['POST'])
def search_image():
    try:
        if 'image' not in request.files:
            return jsonify({"status": "error", "msg": "이미지 파일이 없습니다."})

        file = request.files['image']
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        query_img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

        if query_img is None:
            return jsonify({"status": "error", "msg": "이미지 변환 실패"})

        kp_query, des_query = orb.detectAndCompute(query_img, None)

        if des_query is None:
            return jsonify({"status": "fail", "msg": "이미지에서 특징을 찾을 수 없습니다."})

        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        results = []

        for prod in product_features:
            if prod['descriptors'] is None: continue
            try:
                matches = bf.match(des_query, prod['descriptors'])
                score = len(matches)
                if score > 0:
                    results.append({"filename": prod['filename'], "score": score})
            except Exception: continue

        results.sort(key=lambda x: x['score'], reverse=True)
        top_results = results[:5]

        is_duplicate = False
        duplicate_msg = ""
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
        return jsonify({"status": "error", "msg": str(e)})


# ==========================================
# API 5: 과소비 방지 (지갑 지킴이)
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
                    'reason': f"장바구니에 있는 '{new_item}' 제품이\n과거에 구매한 '{past_item}'과 {int(score*100)}% 유사합니다.\n\n중복 투자가 아닌지 확인해보세요!"
                })

    return jsonify({'status': 'safe', 'isOverConsumption': False, 'msg': '합리적인 소비입니다!'})


# ==========================================
# API 6: 리뷰 분석 (AI Sentiment & Tagging)
# ==========================================
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

    pos_anchor = model.encode("정말 좋아요 만족합니다 최고의 제품 추천합니다")
    neg_anchor = model.encode("별로에요 실망입니다 환불하고 싶어요 최악")
    target_emb = model.encode(content)

    pos_score = util.cos_sim(target_emb, pos_anchor).item()
    neg_score = util.cos_sim(target_emb, neg_anchor).item()

    sentiment = "NEUTRAL"
    if pos_score > neg_score + 0.05: sentiment = "POSITIVE"
    elif neg_score > pos_score + 0.05: sentiment = "NEGATIVE"

    final_tags = []
    for category, tags_map in REVIEW_CATEGORIES.items():
        best_tag = None
        best_score = 0.65 # 임계값 상향 조정됨
        for tag_name, examples in tags_map.items():
            example_embs = model.encode(examples)
            sim_score = util.cos_sim(target_emb, example_embs).max().item()
            if sim_score > best_score:
                best_score = sim_score
                best_tag = tag_name
        if best_tag: final_tags.append(best_tag)

    formatted_tags = " ".join([f"#{tag}" for tag in final_tags])
    return jsonify({"status": "success", "sentiment": sentiment, "tags": formatted_tags})


# ==========================================
# API 7: 스마트 민원 분석 (AI Inquiry Classifier)
# ==========================================
INQUIRY_CATEGORIES = {
    "배송 문의": ["배송이 언제 오나요?", "택배가 안 움직여요", "송장 번호 조회", "배송 지연", "아직도 상품 준비중인가요"],
    "환불/교환": ["환불해 주세요", "물건이 깨져서 왔어요", "반품 신청하고 싶어요", "다른 상품이 왔어요", "파손"],
    "제품 문의": ["이거 재고 있나요?", "스펙이 어떻게 되나요?", "AS 가능한가요?", "호환성 질문"],
    "기타 문의": ["회원 탈퇴 방법", "로그인이 안 돼요", "사이트 오류", "포인트 적립"]
}
URGENT_KEYWORDS = ["화가", "신고", "사기", "당장", "소비자원", "경찰", "법적", "고발", "최악", "쓰레기"]

@app.route('/analyze-contact', methods=['POST'])
def analyze_contact():
    data = request.json
    title = data.get('title', '')
    content = data.get('content', '')
    full_text = f"{title} {content}"

    if not full_text.strip():
        return jsonify({"status": "fail", "msg": "내용 없음"})

    priority = "NORMAL"
    detected_urgent_words = []
    for keyword in URGENT_KEYWORDS:
        if keyword in full_text:
            priority = "CRITICAL"
            detected_urgent_words.append(keyword)

    best_category = "일반 문의"
    max_score = 0
    target_emb = model.encode(full_text)

    for category, examples in INQUIRY_CATEGORIES.items():
        example_embs = model.encode(examples)
        score = util.cos_sim(target_emb, example_embs).max().item()
        if score > max_score:
            max_score = score
            best_category = category

    if max_score < 0.35: best_category = "기타 문의"

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