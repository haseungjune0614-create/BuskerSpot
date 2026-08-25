# 🎵 BuskerSpot - 스트릿 버스킹 라이브 플랫폼

## 📌 프로젝트 개요

**BuskerSpot**은 거리의 모든 버스킹 공연을 한눈에 볼 수 있는 실시간 플랫폼입니다.

- 🎤 버스킹 아티스트와 관객을 연결하는 지도 기반 서비스
- 📍 실시간 공연 위치 표시 및 검색
- 🤖 AI 기반 맞춤 공연 추천
- 💬 팔로우한 아티스트 활동 알림
- 📱 모바일 웹 및 네이티브 앱(Android/iOS) 지원

---

## 🎯 주요 기능

### 1️⃣ 실시간 공연 맵
- 카카오맵 API를 통한 실시간 공연 위치 표시
- 지역/장르별 공연 필터링 및 검색
- 공연 상세 정보 조회, 등록/수정/삭제

### 2️⃣ AI 기반 공연 추천
- Groq LLM 기반 자연어 질의 분석 후 맞춤 공연 추천
- 사용자 질의를 분석(QueryAnalysis)하여 동적 SQL 조건으로 변환, 조건에 맞는 공연 추천

### 3️⃣ 아티스트 팔로우 & 알림
- 관심 아티스트 팔로우/언팔로우
- 팔로우한 아티스트가 공연을 등록·수정하거나 프로필을 변경하면 알림 발송
- 팔로우한 아티스트의 공연 일정 모아보기

### 4️⃣ 아티스트 프로필 관리
- 프로필 생성 및 편집 (닉네임, 소개, 프로필 사진)
- 내 공연 일정 등록/수정/삭제 관리

### 5️⃣ 리뷰 & 메시지
- 공연에 대한 리뷰 작성 및 조회
- 관리자 → 사용자 대상 메시지 발송 및 읽음 확인

### 6️⃣ 소셜 로그인 & 인증
- 이메일 회원가입 및 로그인 (JWT 기반 인증)
- Google / Kakao OAuth 소셜 로그인

### 7️⃣ 관리자 기능
- 공연 승인/거절
- 사용자 관리
- 공지/안내 메시지 일괄 발송

---

## 🛠️ 기술 스택

### Frontend
- React 18
- Kakao Maps SDK
- Capacitor (Android/iOS 네이티브 앱 빌드)
- Cloudflare Pages 배포

### Backend
- Java 17
- Spring Boot 3.2.5
- Spring Data JPA (Hibernate)
- Spring Security + JWT 인증
- PostgreSQL
- Render 배포 (Docker 기반)

### AI
- Groq API (LLM 기반 공연 추천)

---

## 📁 프로젝트 구조

```
BuskerSpot/
├── buskerspot-backend/                # Spring Boot 백엔드
│   └── src/main/java/com/buskerspot/
│       ├── config/                    # Security, JWT, CORS 설정
│       ├── controller/                # REST API 엔드포인트
│       ├── service/                   # 비즈니스 로직
│       ├── repository/                # JPA Repository
│       ├── entity/                    # DB 엔티티
│       ├── dto/                       # 요청/응답 DTO
│       └── common/                    # 공통 예외처리, 유틸
│
└── buskerspot-frontend/               # React 프론트엔드
    ├── src/
    │   ├── components/                # 화면별 컴포넌트
    │   ├── api/                       # API 호출 모듈
    │   └── App.js
    ├── android/                       # Capacitor 안드로이드 프로젝트
    └── ios/                           # Capacitor iOS 프로젝트
```

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
|--------|----------|------|
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

- React Hooks 기반 상태 관리 및 전역 데이터 동기화 처리
- 카카오맵 API 통합 및 위치 기반 필터링
- Spring Boot + Spring Security + JWT 기반 인증/인가
- LLM(Groq) 연동을 통한 자연어 기반 추천 시스템 구현
- Capacitor를 활용한 웹-네이티브 앱 전환
- Git 히스토리 관리 및 민감정보(시크릿) 제거, 협업 브랜치 전략 정리

---

## 🐛 최근 수정 사항

- ✅ 팔로우 아티스트 공연/닉네임 변경 시 알림 발송 기능 구현
- ✅ 공연 수정 시 전역 상태(공연 목록)가 갱신되지 않던 버그 수정
- ✅ 날짜 필터로 인해 "전국 전체" 검색 시 결과가 표시되지 않던 버그 수정
- ✅ 닉네임 변경 후 공연 상세 화면에 이전 닉네임이 표시되던 버그 수정
- ✅ Node.js 기반 AI 추천 기능을 Spring Boot로 마이그레이션
- ✅ 저장소 내 노출된 시크릿(JWT_SECRET 등) 제거 및 재발급
- ✅ GmarketSansBold 폰트 MIME type 오류 해결 → Google Fonts(Noto Sans KR)로 대체

---

## 🤝 기여 안내

버그 제보나 기능 제안은 [Issues](https://github.com/haseungjune0614-create/BuskerSpot/issues)를 통해 남겨주세요.

---

## 📞 GitHub

https://github.com/haseungjune0614-create/BuskerSpot

---

## 📄 License

이 프로젝트는 [MIT License](./LICENSE)를 따릅니다.

---

**버전**: 1.0.0
**마지막 업데이트**: 2026년 8월 25일