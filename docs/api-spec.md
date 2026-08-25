# 🚌 BuskerSpot API 명세서

## 1. Auth (인증)
- **POST /api/auth/kakao/login**
  - 설명: 카카오 소셜 로그인 및 토큰 발급
  - Request Body: `{ "code": "카카오 인가 코드" }`
  - Response (200 OK): `{ "accessToken": "JWT...", "refreshToken": "JWT..." }`

## 2. Busking (버스킹 공연)
- **GET /api/buskings**
  - 설명: 실시간 위치 기반 주변 버스킹 목록 조회
  - Query Parameters: `lat` (위도), `lng` (경도), `radius` (반경)
  - Response (200 OK): 버스킹 정보 배열 반환

## 3. AI 추천 (Groq 자연어 질의)
- **POST /api/ai/recommend**
  - 설명: 사용자의 자연어 요청("홍대 근처 인디밴드 공연 찾아줘")을 분석하여 동적 SQL 조건으로 변환 후 추천
  - Request Body: `{ "query": "질의 내용" }`