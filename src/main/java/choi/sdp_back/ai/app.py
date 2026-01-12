import pandas as pd
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests
import face_recognition # ⭐ 딥러닝 라이브러리
import numpy as np
import base64
import cv2
import os
from datetime import datetime
import glob # 파일 목록 읽기용

app = Flask(__name__)
CORS(app)

# ==========================================
# [설정] 챗봇 데이터 로드 (기존 유지)
# ==========================================
# ... (챗봇 관련 코드는 기존과 동일하게 두시면 됩니다. 아래 얼굴 인식 부분이 중요합니다.) ...
OLLAMA_MODEL = "gemma3:4b"
SIMILARITY_THRESHOLD = 0.4

try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(current_dir, "company_docs.csv")
    df = pd.read_csv(csv_path)
    df.columns = ['Question', 'Answer']
    print(f"✅ 챗봇 데이터 {len(df)}개 로드 완료")
except Exception as e:
    print(f"❌ 데이터 로드 실패: {e}")
    df = pd.DataFrame(columns=['Question', 'Answer'])

tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = None
if not df.empty:
    tfidf_matrix = tfidf_vectorizer.fit_transform(df['Question'])

# 챗봇용 함수들
def refine_answer_with_ai(user_query, fact_answer):
    url = "http://localhost:11434/api/generate"
    prompt = f"질문: {user_query}\n팩트: {fact_answer}\n위 팩트를 바탕으로 친절하게 답변해줘."
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
    try:
        return requests.post(url, json=payload).json()['response']
    except:
        return fact_answer

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
# [설정] 얼굴 인식 모델 로드 (다중 사용자 버전) ⭐
# ==========================================
known_face_encodings = []
known_face_names = []

def load_known_faces():
    global known_face_encodings, known_face_names

    # 1. 'admins' 폴더가 없으면 만들기
    if not os.path.exists("admins"):
        os.makedirs("admins")
        print("📁 'admins' 폴더를 생성했습니다. 여기에 관리자 사진들을 넣어주세요!")
        return

    # 2. 폴더 내 모든 jpg, png 파일 읽기
    image_files = glob.glob("admins/*.jpg") + glob.glob("admins/*.png")

    print(f"🔄 관리자 얼굴 로딩 중... (총 {len(image_files)}장)")

    count = 0
    for file_path in image_files:
        try:
            # 파일명에서 이름만 추출 (예: admins/kim_front.jpg -> kim_front)
            filename = os.path.basename(file_path)
            name = os.path.splitext(filename)[0]

            image = face_recognition.load_image_file(file_path)
            encodings = face_recognition.face_encodings(image)

            if len(encodings) > 0:
                known_face_encodings.append(encodings[0])
                known_face_names.append(name)
                count += 1
                print(f"  - 학습 완료: {name}")
            else:
                print(f"  - ⚠️ 얼굴 감지 실패: {filename} (얼굴이 안 보임)")

        except Exception as e:
            print(f"  - ❌ 로드 에러 ({file_path}): {e}")

    print(f"✅ 총 {count}명의 관리자 얼굴 학습 완료!")

# 서버 시작 시 로드
load_known_faces()


# ==========================================
# [기능 2] 얼굴 로그인 API (최종 업그레이드)
# ==========================================
@app.route('/verify-face', methods=['POST'])
def verify_face():
    if not known_face_encodings:
        return jsonify({"status": "error", "msg": "서버에 등록된 관리자 사진이 없습니다. (admins 폴더 확인)"})

    try:
        data = request.json
        image_data = data['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # 1. 입력된 사진에서 얼굴 찾기
        face_locations = face_recognition.face_locations(rgb_frame)

        if len(face_locations) == 0:
            return jsonify({"status": "fail", "msg": "얼굴을 찾을 수 없습니다."})
        if len(face_locations) > 1:
            return jsonify({"status": "fail", "msg": "🚫 2명 이상 감지되었습니다. 혼자만 시도해주세요."})

        # 2. 특징 추출
        unknown_encoding = face_recognition.face_encodings(rgb_frame, face_locations)[0]

        # 3. 등록된 모든 얼굴과 거리 비교 (가장 닮은 사람 찾기)
        # face_distance는 리스트를 반환합니다. (각 등록된 얼굴과의 거리)
        distances = face_recognition.face_distance(known_face_encodings, unknown_encoding)

        # 가장 거리가 짧은(가장 닮은) 인덱스 찾기
        best_match_index = np.argmin(distances)
        best_distance = distances[best_match_index]

        print(f"🔍 매칭 분석: 가장 닮은 사람='{known_face_names[best_match_index]}' (오차: {best_distance:.4f})")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # 4. 판정 (오차 0.4 미만이면 통과)
        if best_distance < 0.4:
            matched_name = known_face_names[best_match_index]
            print(f"✅ 로그인 성공: {matched_name} ({timestamp})")
            return jsonify({
                "status": "success",
                "msg": f"인증 성공! 환영합니다, {matched_name}님."
            })

        else:
            # 🚨 실패 시: 침입자 사진 저장
            if not os.path.exists("intruders"):
                os.makedirs("intruders")

            filename = f"intruders/failed_{timestamp}_dist{best_distance:.2f}.jpg"
            cv2.imwrite(filename, cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR))

            print(f"🚨 침입자 기록됨: {filename}")
            return jsonify({"status": "fail", "msg": "등록된 관리자가 아닙니다. (기록됨)"})

    except Exception as e:
        print(f"서버 오류: {e}")
        return jsonify({"status": "error", "msg": "서버 처리 중 오류 발생"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)