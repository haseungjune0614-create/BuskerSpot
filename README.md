# 🎵 BuskerSpot - 스트릿 버스킹 라이브 플랫폼

## 📌 프로젝트 개요

**BuskerSpot**은 거리의 모든 버스킹 공연을 한눈에 볼 수 있는 실시간 플랫폼입니다.

- 🎤 버스킹 아티스트와 관객을 연결하는 지도 기반 서비스
- 📍 실시간 공연 위치 표시 및 검색
- 💬 관객-아티스트 간 실시간 메시지 기능
- 📱 모바일 웹 및 네이티브 앱 지원

---

## 🎯 주요 기능

### 1️⃣ 실시간 공연 맵
- 카카오맵 API를 통한 실시간 공연 위치 표시
- 공연 정보 필터링 (장르, 지역별)
- 공연 상세 정보 조회

### 2️⃣ 아티스트 프로필 관리
- 프로필 생성 및 편집
- 공연 일정 관리

### 3️⃣ 실시간 메시징
- 관객-아티스트 간 메시지 송수신
- 메시지 알림 기능

### 4️⃣ 관리자 기능
- 공연 승인/거절
- 사용자 관리

---

## 🛠️ 기술 스택

### Frontend
- React 18+
- CSS3
- Kakao Maps SDK
- Capacitor (iOS/Android)
- React Hooks

### Backend
- Java 11+
- Spring Boot 2.7+
- MySQL 8.0+
- JWT Authentication
- WebSocket

---

## 📁 프로젝트 구조

---

## 🚀 설치 및 실행

### Frontend

```bash
cd buskerspot-frontend
npm install
npm start
```

접속: http://localhost:3000

### Backend

```bash
cd buskerspot-backend
./gradlew bootRun
```

API Server: http://localhost:8080

---

## 🔐 환경 변수 설정

### Frontend (.env)

### Backend (application.yml)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/buskerspot
    username: root
    password: YOUR_PASSWORD
```

---

## 💻 주요 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/performances | 공연 목록 |
| POST | /api/performances | 공연 등록 |
| POST | /api/auth/login | 로그인 |
| POST | /api/messages | 메시지 전송 |

---

## 🎓 주요 학습 포인트

- React Hooks 상태 관리
- 카카오맵 API 통합
- Spring Boot RESTful API
- JWT 기반 인증
- WebSocket 실시간 통신
- Docker 컨테이너화

---

## 🐛 최근 수정 사항

- ✅ GmarketSansBold 폰트 MIME type 오류 해결
- ✅ Google Fonts (Noto Sans KR)로 대체

---

## 📞 GitHub

https://github.com/haseungjune0614-create/BuskerSpot

---

**버전**: 1.0.0
**마지막 업데이트**: 2026년 8월 24일
