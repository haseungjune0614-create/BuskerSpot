## 🗺️ Core Service Flow

BuskerSpot은 사용자 위치 기반 탐색부터 AI 맞춤 추천, 일정 관리까지 매끄럽게 연결되는 버스킹 플랫폼 UX를 제공합니다.

```mermaid
flowchart TD
    A["📍 사용자 GPS / 지도 API"] -->|"현재 위치 주변 버스킹 탐색"| B["🎨 아티스트 팔로우 & AI 취향 분석"]
    B -->|"선호 장르 / 아티스트 기반 맞춤 공연 추천"| C["📅 달력 & 타임라인"]
    C -->|"일정 저장 및 실시간 · 시간대별 공연 타임라인 시각화"| D["🎪 완성된 버스킹 데이터 레이어"]

    style A fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    style B fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style C fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    style D fill:#fff3e0,stroke:#f57c00,stroke-width:2px
