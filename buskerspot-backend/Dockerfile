# syntax=docker/dockerfile:1.4

# 1. Build Stage
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN chmod +x ./gradlew

# 💡 수정 포인트: bootJar 대신 dependencies만 다운로드하여 의존성 캐싱 수행 (메인 클래스 불필요)
RUN --mount=type=cache,target=/root/.gradle \
    for i in 1 2 3 4 5 6; do \
      ./gradlew dependencies --no-daemon && break || (echo "재시도 $i..." && sleep 30); \
    done

# 소스코드 전체 복사 후 실제 패키징(bootJar) 실행
COPY . .
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew bootJar -x test --no-daemon

# 2. Run Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 💡 타임존 데이터 설치 + 한국시간(KST)으로 고정
RUN apk add --no-cache tzdata
ENV TZ=Asia/Seoul

COPY --from=builder /app/build/libs/*.jar app.jar
RUN mkdir -p uploads

EXPOSE 8080
ENTRYPOINT ["java", "-Duser.timezone=Asia/Seoul", "-jar", "app.jar"]