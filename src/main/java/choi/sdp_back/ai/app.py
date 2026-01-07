import pandas as pd
from flask import Flask, request, jsonify, render_template, render_template_string
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from konlpy.tag import Okt
import requests
import face_recognition # ⭐ 딥러닝 라이브러리 (dlib 기반)
import numpy as np
import base64
import cv2
import os

app = Flask(__name__)
CORS(app)

# ==========================================
# [설정] 챗봇 데이터 로드 (기존 유지)
# ==========================================
OLLAMA_MODEL = "gemma3:4b"
SIMILARITY_THRESHOLD = 0.4

try:
    df = pd.read_csv(r"C:\KDT Project\KDT-Project\src\main\java\choi\sdp_back\ai\company_docs.csv")
    df.columns = ['Question', 'Answer']
    print(f"✅ 챗봇 데이터 {len(df)}개 로드 완료")

    okt = Okt()
    tfidf_vectorizer = TfidfVectorizer(tokenizer=okt.morphs)
    tfidf_matrix = tfidf_vectorizer.fit_transform(df['Question'].astype(str))
# 수정 후 (어떤 에러인지 정확히 출력해줍니다)
except Exception as e:
    print(f"❌ 진짜 에러 원인: {e}")
    df = pd.DataFrame()

# ==========================================
# [설정] 얼굴 인식 모델 로드 (딥러닝 버전) ⭐
# ==========================================
admin_encoding = None

def load_admin_face():
    global admin_encoding
    image_path = "admin.jpg"

    if not os.path.exists(image_path):
        print("⚠️ 'admin.jpg' 파일이 없습니다. (딥러닝 버전)")
        return

    try:
        print("관리자 얼굴(Deep Learning) 분석 중... (시간이 좀 걸립니다)")
        # 1. 이미지 로드
        image = face_recognition.load_image_file(image_path)

        # 2. 얼굴 특징 추출 (128개 벡터)
        encodings = face_recognition.face_encodings(image)

        if len(encodings) > 0:
            admin_encoding = encodings[0]
            print("✅ 관리자 얼굴 학습 완료! (Face Recognition)")
        else:
            print("❌ 사진에서 얼굴을 못 찾았습니다. 더 선명한 정면 사진을 써주세요.")

    except Exception as e:
        print(f"❌ 얼굴 학습 중 오류 발생: {e}")

load_admin_face()


# ==========================================
# [기능 1] 챗봇 API (기존 유지)
# ==========================================
def refine_answer_with_ai(user_query, fact_answer):
    url = "http://localhost:11434/api/generate"
    prompt = f"질문: {user_query}\n팩트: {fact_answer}\n위 팩트를 바탕으로 친절하게 답변해줘."
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    try:
        return requests.post(url, json=payload).json()['response']
    except:
        return fact_answer

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_query = data.get('message', '')
    if df.empty: return jsonify({"response": "데이터가 없습니다."})

    user_vec = tfidf_vectorizer.transform([user_query])
    score = cosine_similarity(user_vec, tfidf_matrix).flatten().max()

    if score < SIMILARITY_THRESHOLD:
        return jsonify({"response": "죄송합니다. 잘 모르는 내용입니다."})
    else:
        ans = df.loc[cosine_similarity(user_vec, tfidf_matrix).flatten().argmax(), 'Answer']
        return jsonify({"response": refine_answer_with_ai(user_query, ans)})


# ==========================================
# [기능 2] 얼굴 로그인 API (딥러닝 버전) ⭐
# ==========================================

# 1. 테스트 페이지
@app.route('/face-test')
def face_test_page():
    return render_template('face_test.html')

# 2. 얼굴 검증 로직
@app.route('/verify-face', methods=['POST'])
def verify_face():
    if admin_encoding is None:
        return jsonify({"status": "error", "msg": "서버에 관리자 얼굴이 등록되지 않았습니다."})

    try:
        # 프론트에서 보낸 이미지 받기
        data = request.json
        image_data = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)

        # OpenCV 포맷으로 변환 (face_recognition은 RGB를 씀)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) # BGR -> RGB 필수!

        # 1. 사진에서 얼굴 위치 찾기
        face_locations = face_recognition.face_locations(rgb_frame)
        # 👇 [새로 추가] 얼굴이 없거나, 2명 이상이면 거절!
        if len(face_locations) == 0:
            return jsonify({"status": "fail", "msg": "얼굴을 찾을 수 없습니다."})

        if len(face_locations) > 1:
            return jsonify({"status": "fail", "msg": "🚫 2명 이상 감지되었습니다. 혼자만 나와주세요!"})

        if not face_locations:
            return jsonify({"status": "fail", "msg": "얼굴을 찾을 수 없습니다."})

        # 2. 얼굴 특징 추출 (인코딩)
        unknown_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        # 3. 비교 (Compare)
        # tolerance=0.5 (낮을수록 엄격함. 보통 0.4~0.5가 적당)
        for unknown_face in unknown_encodings:
            # 거리 계산 (0.0 ~ 1.0)
            distance = face_recognition.face_distance([admin_encoding], unknown_face)[0]
            print(f"얼굴 거리(오차): {distance:.4f}") # 로그로 확인해보기

            # 0.4보다 작으면 같은 사람
            if distance < 0.4:
                return jsonify({"status": "success", "msg": f"인증 성공! (오차: {distance:.2f})"})

        return jsonify({"status": "fail", "msg": "등록된 관리자가 아닙니다."})

    except Exception as e:
        print(e)
        return jsonify({"status": "error", "msg": "서버 오류 발생"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)