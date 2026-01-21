> **빅데이터와 AI를 활용한 조립 컴퓨터 전문 큐레이션 플랫폼** > Spring Boot와 Python(Flask) 마이크로서비스 아키텍처를 기반으로 구축된 E-Commerce 프로젝트입니다.

---

## 📅 프로젝트 개요
- **프로젝트명:** ROOT STATION (루트 스테이션)
- **개발 기간:** 2025.12.29 ~ 2026.2.1 (약 5주)
- **팀원:** [김태현] (Full Stack & AI Integration)
- **주요 컨셉:** Cyberpunk & Tech 테마의 프리미엄 조립 PC 샵

## 🛠️ Tech Stack (기술 스택)

### Frontend
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=React&logoColor=black"> <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white"> <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white">

### Backend
<img src="https://img.shields.io/badge/Spring Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white"> <img src="https://img.shields.io/badge/Java 17-007396?style=for-the-badge&logo=openjdk&logoColor=white"> <img src="https://img.shields.io/badge/Spring Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white"> <img src="https://img.shields.io/badge/JPA (Hibernate)-59666C?style=for-the-badge&logo=hibernate&logoColor=white">

### Database
<img src="https://img.shields.io/badge/Oracle 19c-F80000?style=for-the-badge&logo=oracle&logoColor=white">

### AI & API
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"> <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white"> <img src="https://img.shields.io/badge/Ollama (Gemma)-000000?style=for-the-badge&logo=ollama&logoColor=white"> <img src="https://img.shields.io/badge/Google Cloud Vision-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white">

---

## 🌟 Key Features (핵심 기능)

### 1. 🤖 AI 기반 스마트 챗봇 (Python Flask 연동)
- **기술:** `SentenceTransformer`, `Cosine Similarity`, Flask API
- **기능:** 사용자의 자연어 질문("배송 언제 와?", "호환성 체크해줘")을 벡터화하여, 사전에 학습된 매장 데이터(`CSV`)와 비교 분석 후 최적의 답변을 제공합니다.
- **특징:** 단순 키워드 매칭이 아닌 **문맥 유사도 분석**을 통해 정확도 높은 답변 구현.

### 2. 📸 관리자 생체 인증 (Face Recognition Login)
- **기술:** `face_recognition`, OpenCV, WebCam API
- **기능:** 관리자 페이지 접속 시 비밀번호 입력 없이 **웹캠을 통한 안면 인식**으로 보안 로그인을 수행합니다.
- **아키텍처:** React(영상 캡처) → Python(얼굴 벡터 분석 및 DB 대조) → Spring Boot(인증 토큰 발급)

### 3. 📝 OCR 사업자 인증 시스템
- **기술:** Google Cloud Vision API
- **기능:** 기업 회원이 사업자등록증 이미지를 업로드하면, OCR 기술로 텍스트를 추출하여 자동으로 가입 폼을 완성합니다.

### 4. 📦 완전한 주문/배송 관리 (Full CRUD)
- **관리자:** 주문 상태 변경(준비중/배송중/완료), 송장 번호 관리.
- **사용자:** 부여받은 **시리얼 코드(송장 번호)**를 입력하여 실시간 배송 현황을 시각적으로 조회 (`Track Your Gear` UI).

### 5. 🛍️ 상품 관리 및 AI 추천
- **기능:** 상품 등록 시 AI(Ollama/Gemma 모델)가 제품 이미지를 분석하거나 설명을 보완하여 **마케팅 문구를 자동 생성**해줍니다.

---

## 📐 System Architecture (시스템 구조)

```mermaid
graph LR
    A[Client (React)] -- REST API (Port 3000) --> B[Main Server (Spring Boot / Port 8080)]
    B -- JPA/JDBC --> C[(Oracle DB)]
    
    subgraph AI Service
    A -- Chat/Face Request --> D[AI Server (Python Flask / Port 5002)]
    D -- Analysis Result --> A
    end
    
    B -- OCR Request --> E[Google Cloud Vision API]
