# ==============================================================================
# ReCall AI – Production Multi-Stage Dockerfile (JDK 17)
# Optimized for Free-Tier Cloud Deployments (Render, Railway, Fly.io, Google Cloud Run)
# ==============================================================================

# Stage 1: Build JAR using Maven
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Distroless / Alpine JRE Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S recall && adduser -S recall -G recall \
    && mkdir -p /app/data /app/frontend/src/content/notes /tmp/recall-notes \
    && chown -R recall:recall /app /tmp/recall-notes
COPY --from=builder --chown=recall:recall /app/target/recall-backend-*.jar app.jar
USER recall
EXPOSE 8080
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
