빅데이터와 AI를 활용한 조립 컴퓨터 전문 큐레이션 플랫폼 > Spring Boot와 Python(Flask) 마이크로서비스 아키텍처를 기반으로 구축된 E-Commerce 프로젝트입니다.

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

## 📐 System Architecture (시스템 구조)

```mermaid
graph LR
    A["Client (React)"] -- "REST API (Port 3000)" --> B["Main Server (Spring Boot / Port 8080)"]
    B -- "JPA/JDBC" --> C[("Oracle DB")]
    
    subgraph AI Service
        A -- "Chat/Face Request" --> D["AI Server (Python Flask / Port 5002)"]
        D -- "Analysis Result" --> A
    end
    
    B -- "OCR Request" --> E["Google Cloud Vision API"]
👨‍💻 핵심 구현 기능 (Developed by 김태현)
본 프로젝트에서 Python AI 서버 구축, React 프론트엔드 연동, 그리고 물류 프로세스 설계까지 풀스택 전반을 주도했습니다. 특히 단순 쇼핑몰을 넘어선 **지능형 서비스(AI)**와 스마트 물류 시스템, 그리고 견고한 게시판(CRUD) 로직을 직접 설계 및 구현했습니다.

1. 🤖 AI & Deep Learning 기능 (100% 자체 구현)
단순 API 호출이 아닌, Python Flask 서버를 직접 구축하여 커머스 운영에 필요한 5가지 핵심 AI 기능을 개발했습니다.

① 🔐 관리자 안면 인식 로그인 (Face Auth System)
기능: 관리자 페이지 접속 시, ID/PW 입력 없이 웹캠을 통해 즉시 로그인합니다.

기술: React WebCam으로 프레임을 캡처하고, Python 서버의 Face Recognition 라이브러리가 사전에 등록된 관리자 얼굴 벡터와 대조하여 0.5초 내에 인증을 완료합니다.

② 💬 AI 챗봇 어시스턴트 (Context-Aware Chatbot)
기능: 24시간 고객 응대를 위한 플로팅 챗봇을 구현했습니다. 로그인한 사용자의 **주문/배송 정보(Context)**를 인식하여 개인화된 답변을 제공합니다.

기술: 자연어 처리(NLP)를 통해 사용자의 질문 의도를 파악하고, DB와 연동하여 "내 배송 어디쯤이야?" 같은 질문에 실시간 주문 상태를 조회하여 응답합니다.

③ 📸 하이브리드 AI 이미지 검색 (Hybrid Search Architecture)
기능: 텍스트 없이 사진만으로 제품을 찾습니다. 단순한 유사도 비교를 넘어, 딥러닝 기반의 사물 인식으로 검색 범위를 확장했습니다.

구현 로직 (2-Stage Fallback System):

1단계 (Feature Matching): OpenCV ORB 알고리즘을 사용하여 업로드된 이미지의 특징점(Keypoints)을 추출, DB 내 제품들과 1:1 정밀 대조를 수행합니다. (정확도 우선)

2단계 (Deep Learning Classification): 1단계에서 일치하는 제품이 없을 경우, TensorFlow MobileNetV2 모델이 개입합니다. 이미지를 분석하여 'Keyboard', 'Mouse' 등의 사물 종류를 예측하고, 해당 카테고리의 인기 제품을 대체 추천합니다. (검색 실패 방지)

보안 기능: 관리자가 상품 등록 시, 기존 DB 이미지와 유사도가 90% 이상이면 '중복 상품(짝퉁 의심)' 경고를 출력하여 데이터 오염을 방지합니다.

④ 💳 AI 과소비 방지 (Wallet Guard)
기능: 충동구매를 막기 위해 결제 직전 사용자의 구매 패턴을 분석합니다.

기술: 사용자의 과거 주문 내역과 현재 장바구니 품목을 분석하여, 중복 구매나 과소비 패턴 감지 시 SweetAlert2 경고창을 통해 합리적 소비를 제안합니다.

⑤ 📊 리뷰 감정 분석 & 카테고리 자동 분류
기능: 고객 리뷰의 긍정/부정 여부를 분석하고, 상품 이미지 등록 시 카테고리를 자동 입력합니다.

기술: NLP 감정 분석을 통해 리뷰에 태그(😊/😡)를 부착하고, Computer Vision으로 사물을 인식해 'Keyboard', 'Monitor' 등의 카테고리를 자동 분류합니다.

2. 🚚 통합 물류 공정 관리 시스템 (Logistics Control)
단순 배송 상태 변경을 넘어, 주문 접수부터 제작, 검수, 배송까지의 전 과정을 추적 관리하는 로직을 설계했습니다.

① 관리자: 공정 제어 대시보드 (Process Dashboard)
기능: 전체 주문 건을 송장 번호(Invoice ID) 기준으로 그룹화하여 관리합니다.

구현:

상태 머신(State Machine): 주문 상태를 ORDERED → MANUFACTURING(제작) → QUALITY_CHECK(검수) → SHIPPING(배송) → COMPLETED 5단계로 세분화하여 관리합니다.

개별 제어: 동일 주문 번호 내에서도 부품별로 진행 상황을 다르게 설정할 수 있도록 DB를 설계하여 유연성을 확보했습니다.

② 사용자: 실시간 트래킹 (Real-time Tracking)
기능: 송장 번호 하나만으로 로그인 없이 본인 주문의 현재 공정률을 확인합니다.

구현:

공정률 시각화: 현재 단계(예: 검수 중 70%)를 프론트엔드에서 계산하여 프로그레스 바(Progress Bar) UI로 직관적으로 제공합니다.

접근성 강화: 비회원이라도 송장 번호(UUID 기반 시리얼 코드)만 있으면 조회가 가능하도록 구현했습니다.

3. 📝 게시판 및 커뮤니티 시스템 (Full CRUD)
사용자와 관리자, 그리고 구매자 간의 상호작용을 위한 핵심 기능을 완벽하게 구현했습니다.

① 1:1 문의 시스템 (Inquiry Board)
User (사용자): 로그인 세션을 연동하여 본인 명의로 문의를 등록하며, 인라인 편집(Inline Edit) UI를 적용해 페이지 이동 없이 즉시 수정/삭제가 가능합니다.

Admin (관리자): 전체 회원의 문의 내역을 대시보드에서 조회하고 답변을 등록할 수 있으며, 답변 완료 시 사용자 화면에 상태가 실시간 동기화됩니다.

② 상품 리뷰 시스템 (Product Reviews)
구매자 검증: 실제 구매 이력이 있는 사용자만 리뷰를 작성할 수 있도록 권한을 제어했습니다.

CRUD 구현:

Create/Read: 별점(Rating)과 이미지, 텍스트가 포함된 리뷰를 작성하고 상품 상세 페이지에 실시간 렌더링합니다.

Update/Delete: 본인이 작성한 리뷰에 한해 수정 및 삭제 권한을 부여했습니다.

AI 연동: 작성된 리뷰 데이터는 실시간으로 Python AI 서버로 전송되어 감정 분석(긍정/부정)의 기초 데이터로 활용됩니다.
