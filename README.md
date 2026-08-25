# 🎵 BuskerSpot - 스트릿 버스킹 라이브 플랫폼

[![Open Source Initiative](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![Backend](https://img.shields.io/badge/Backend-Spring_Boot-brightgreen)
![Frontend](https://img.shields.io/badge/Frontend-React-blue)
![AI](https://img.shields.io/badge/AI-Groq-orange)

## 📌 프로젝트 개요

**BuskerSpot**은 거리의 모든 버스킹 공연을 한눈에 볼 수 있는 실시간 지도 기반 플랫폼입니다. 아티스트와 관객을 실시간으로 연결하고, AI를 통해 사용자 취향에 맞는 공연을 추천합니다.

- 🎤 **버스킹 매칭**: 실시간 위치 기반 공연 정보 제공 및 검색
- 🤖 **AI 추천**: Groq LLM을 활용한 자연어 기반 맞춤 공연 추천
- 💬 **소통 알림**: 아티스트 팔로우 및 활동 알림 기능
- 📱 **멀티 플랫폼**: 반응형 웹 및 Android/iOS 네이티브 앱 지원

---

## 🎯 주요 기능

### 1️⃣ 실시간 공연 맵
- 카카오맵 API를 연동하여 실시간 공연 위치를 지도에 시각화
- 지역, 장르, 날짜별 공연 필터링 및 상세 검색
- 공연 정보 등록/수정/삭제 및 실시간 업데이트

### 2️⃣ AI 기반 공연 추천 (핵심 혁신 기능)
- **Groq API(LLM)**를 활용하여 사용자의 자연어 질의(예: "홍대 근처 인디밴드 공연") 분석
- `QueryAnalysis`를 통해 질의를 동적 SQL 조건으로 변환하여 최적의 공연 추천

### 3️⃣ 아티스트 활동 관리 및 알림
- 아티스트 계정 생성 및 프로필(소개, 사진) 편집
- 공연 일정 등록/수정/삭제 관리
- 팔로우한 아티스트의 공연 등록/변경 시 실시간 알림 발송

### 4️⃣ 커뮤니티 및 인증
- 공연에 대한 리뷰 작성 및 조회 기능
- Google / Kakao OAuth 소셜 로그인 및 JWT 기반 자체 인증 시스템
- 관리자 페이지를 통한 공연 승인 및 회원/공지사항 일괄 관리

---

## 🛠️ 기술 스택

| 구분 | 기술 및 프레임워크 |
| :--- | :--- |
| **Frontend** | React 18, Kakao Maps SDK, Capacitor (Android/iOS), Cloudflare Pages |
| **Backend** | Java 17, Spring Boot 3.2.5, Spring Data JPA, Spring Security + JWT, PostgreSQL, Docker |
| **AI/LLM** | Groq API (Language Processing Model) |
| **Infra/Deploy** | Render (Backend), Cloudflare Pages (Frontend) |

---

## 📁 프로젝트 구조

프로젝트는 멀티 모듈 구조로 구성되어 있습니다.

```text
BuskerSpot/
├── buskerspot-backend/      # Spring Boot 백엔드 (REST API, AI 로직)
│   └── src/main/java/com/buskerspot/
│       ├── config/          # 보안, JWT, Web 설정
│       ├── controller/      # API 엔드포인트
│       ├── service/         # 비즈니스 로직 및 AI 연동
│       ├── dto/             # 데이터 전송 객체
│       └── ...
└── buskerspot-frontend/     # React 프론트엔드 및 Capacitor 앱
    ├── src/
    │   ├── components/      # UI 컴포넌트
    │   └── api/             # API 통신 모듈
    ├── android/             # 안드로이드 네이티브 프로젝트
    └── ios/                 # iOS 네이티브 프로젝트

```

---

## 📚 개발 문서 (Documentation)

심사 위원님들께서 코드의 구체적인 구현 내용을 쉽게 확인하실 수 있도록 상세 개발 문서를 별도로 제공합니다.

> 💡 **심사 포인트**: 아래 문서들을 통해 본 프로젝트의 상세 API 명세와 데이터베이스 구조를 파악하실 수 있습니다.

* [📋 API 상세 명세서](https://www.google.com/search?q=./docs/api-spec.md): 엔드포인트별 요청/응답 예시 및 상세 설명
* [🗄️ DB ERD 및 시스템 아키텍처](https://www.google.com/search?q=./docs/erd.md): 데이터베이스 관계도 및 시스템 구성도
* [🖼️ 핵심 화면 스크린샷 가이드](https://www.google.com/search?q=./docs/screenshots/README.md): 주요 기능별 실행 화면 및 설명

---

## 🚀 설치 및 실행

### Backend

```bash
cd buskerspot-backend
./gradlew bootRun

```

API Server: http://localhost:8080

### Frontend

```bash
cd buskerspot-frontend
npm install
npm start

```

접속: http://localhost:3000

---

## 🔐 환경 변수 설정

### Backend (`.env` 또는 배포 환경변수)

```
DB_USERNAME=
DB_PASSWORD=
JWT_SECRET=
GROQ_API_KEY=
RESEND_API_KEY=
KAKAO_REST_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=

```

### Frontend (`.env`)

```
REACT_APP_API_URL=http://localhost:8080

```

> ⚠️ 실제 키 값은 저장소에 커밋하지 않습니다. `.env.example`을 참고해 로컬에 `.env` 파일을 직접 생성해주세요.

---

## 💻 주요 API 엔드포인트

| Method | Endpoint | 설명 |
| --- | --- | --- |
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 |
| GET | /api/performances | 공연 목록 조회 |
| POST | /api/performances | 공연 등록 |
| PUT | /api/performances/{id} | 공연 수정 |
| POST | /api/follows/toggle | 아티스트 팔로우/언팔로우 |
| GET | /api/messages | 내 메시지 목록 |
| GET | /api/messages/unread-count | 읽지 않은 메시지 수 |
| POST | /api/ai/recommend | AI 기반 공연 추천 |
| POST | /api/reviews | 리뷰 작성 |

---

## 🎓 주요 학습 포인트

* React Hooks 기반 상태 관리 및 전역 데이터 동기화 처리
* 카카오맵 API 통합 및 위치 기반 필터링
* Spring Boot + Spring Security + JWT 기반 인증/인가
* LLM(Groq) 연동을 통한 자연어 기반 추천 시스템 구현
* Capacitor를 활용한 웹-네이티브 앱 전환
* Git 히스토리 관리 및 민감정보(시크릿) 제거, 협업 브랜치 전략 정리

---

## 🐛 최근 수정 사항

* ✅ 팔로우 아티스트 공연/닉네임 변경 시 알림 발송 기능 구현
* ✅ 공연 수정 시 전역 상태(공연 목록)가 갱신되지 않던 버그 수정
* ✅ 날짜 필터로 인해 "전국 전체" 검색 시 결과가 표시되지 않던 버그 수정
* ✅ 닉네임 변경 후 공연 상세 화면에 이전 닉네임이 표시되던 버그 수정
* ✅ Node.js 기반 AI 추천 기능을 Spring Boot로 마이그레이션
* ✅ 저장소 내 노출된 시크릿(JWT_SECRET 등) 제거 및 재발급
* ✅ GmarketSansBold 폰트 MIME type 오류 해결 → Google Fonts(Noto Sans KR)로 대체

---

## 🤝 기여 안내

버그 제보나 기능 제안은 [Issues](https://www.google.com/search?q=https://github.com/haseungjune0614-create/BuskerSpot/issues)를 통해 남겨주세요.

---

## 📞 GitHub

https://github.com/haseungjune0614-create/BuskerSpot

---

## 📄 License

이 프로젝트는 [MIT License](https://www.google.com/search?q=./LICENSE)를 따릅니다.

---

**버전**: 1.0.0

**마지막 업데이트**: 2026년 8월 25일

```

이 코드로 `README.md`에 다시 저장해 주시면 링크가 정상적으로 연결됩니다! 이 작업 끝나면 이제 정말 GitHub에 푸시하고 마무리하시면 됩니다.

```