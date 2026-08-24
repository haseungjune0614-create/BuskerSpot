# 1. Build Stage
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon

COPY src src
RUN ./gradlew bootJar -x test --no-daemon

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