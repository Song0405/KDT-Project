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

app = Flask(__name__)
CORS(app)

# --- 1. 챗봇 모델 및 데이터 로드 ---
print("⏳ 모델 및 데이터 로딩 중...")
model = SentenceTransformer('jhgan/ko-sroberta-multitask')

try:
    # CSV 파일 읽기 (인코딩 에러 나면 'cp949'로 변경)
    df = pd.read_csv('company_docs.csv', encoding='utf-8')
    # 질문(Question)들을 미리 임베딩(벡터화)
    question_embeddings = model.encode(df['Question'].tolist(), convert_to_tensor=True)
    print(f"✅ 챗봇 데이터 {len(df)}개 로드 완료")
except Exception as e:
    print(f"❌ 데이터 로드 실패: {e}")
    df = pd.DataFrame(columns=['Question', 'Answer'])
    question_embeddings = None

# --- 2. 관리자 얼굴 데이터 로드 ---
known_face_encodings = []
known_face_names = []

def load_admin_faces():
    admin_path = "../../admins" # 관리자 사진 폴더 경로
    # 경로가 안 맞으면 절대 경로로 수정 필요 (현재 위치 기준 상위 폴더 탐색)
    if not os.path.exists(admin_path):
        # 만약 못 찾으면 현재 폴더의 admins 폴더를 찾음 (테스트용)
        if os.path.exists("admins"):
            admin_path = "admins"
        else:
            print(f"⚠️ 경고: 관리자 사진 폴더('{admin_path}')를 찾을 수 없습니다.")
            return

    files = os.listdir(admin_path)
    print(f"🔄 관리자 얼굴 로딩 중... (총 {len(files)}장)")

    count = 0
    for file in files:
        if file.endswith((".jpg", ".png", ".jpeg")):
            try:
                # 이미지 로드
                img_path = os.path.join(admin_path, file)
                image = face_recognition.load_image_file(img_path)
                # 얼굴 인코딩 (특징점 추출)
                encodings = face_recognition.face_encodings(image)

                if encodings:
                    known_face_encodings.append(encodings[0])
                    # 파일명에서 확장자 떼고 이름으로 사용 (예: KTH.jpg -> KTH)
                    name = os.path.splitext(file)[0]
                    known_face_names.append(name)
                    print(f"  - 학습 완료: {name}")
                    count += 1
                else:
                    print(f"  - ❌ 얼굴 감지 실패: {file}")
            except Exception as e:
                print(f"  - ❌ 로드 에러 ({file}): {e}")
    print(f"✅ 총 {count}명의 관리자 얼굴 학습 완료!")

# 서버 시작 시 얼굴 로드 실행
try:
    load_admin_faces()
except Exception as e:
    print(f"❌ 얼굴 인식 모듈 초기화 실패: {e}")

# --- API 1: 챗봇 질문 답변 ---
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_query = data.get('message')

    if not user_query:
        return jsonify({"response": "질문을 입력해주세요."})

    # 사용자 질문 임베딩
    query_embedding = model.encode(user_query, convert_to_tensor=True)

    # 가장 유사한 질문 찾기 (코사인 유사도)
    cos_scores = util.cos_sim(query_embedding, question_embeddings)[0]
    best_match_idx = torch.argmax(cos_scores).item()
    best_score = cos_scores[best_match_idx].item()

    # ⭐ [디버깅용 로그] 터미널에서 점수를 확인해보세요!
    print(f"--------------------------------------------------")
    print(f"🗣️ 사용자 질문: {user_query}")
    print(f"🤖 가장 비슷한 CSV 질문: {df.iloc[best_match_idx]['Question']}")
    print(f"📊 유사도 점수: {best_score:.4f}") # 점수가 1.0에 가까울수록 똑같은 말
    print(f"--------------------------------------------------")

    # ⭐ [수정] 기준 점수 높이기 (기존 0.4 -> 0.55)
    # 0.55보다 낮으면 "모르는 질문"으로 처리합니다.
    if best_score < 0.55:
        return jsonify({"response": "죄송합니다, 해당 내용에 대해서는 학습되지 않았습니다. 😓\n고객센터(02-1234-5678)로 문의 부탁드립니다."})

    # 답변 반환
    answer = df.iloc[best_match_idx]['Answer']
    return jsonify({"response": answer})

# --- API 2: 얼굴 인식 로그인 ---
@app.route('/verify-face', methods=['POST'])
def verify_face():
    try:
        data = request.json
        image_data = data.get('image') # Base64 문자열

        # Base64 디코딩 -> OpenCV 이미지 변환
        encoded_data = image_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # 얼굴 위치 찾기 & 인코딩
        # (속도를 위해 이미지를 1/4로 줄여서 처리 가능하지만 여기선 원본 사용)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        if not face_encodings:
            return jsonify({"status": "fail", "msg": "얼굴이 감지되지 않았습니다."})

        # 감지된 얼굴이 아는 사람인지 확인
        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.45)
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)

            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    name = known_face_names[best_match_index]
                    return jsonify({"status": "success", "msg": f"환영합니다 {name}님!"})

        return jsonify({"status": "fail", "msg": "등록되지 않은 관리자입니다."})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "msg": "서버 오류가 발생했습니다."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)