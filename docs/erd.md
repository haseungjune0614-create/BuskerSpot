# 🗄️ BuskerSpot ERD 및 아키텍처

## 1. 데이터베이스 구조 (ERD)
```mermaid
erDiagram
    User ||--o{ Busking : creates
    User ||--o{ Review : writes
    Busking ||--o{ Review : contains
    
    User {
        Long id PK
        String email
        String nickname
    }
    Busking {
        Long id PK
        String title
        Double latitude
        Double longitude
    }
    Review {
        Long id PK
        String content
    }