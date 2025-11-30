# Stage 1: Build 
# fixed gradle dk25-corretto image to ensure compatibility with Java 25
FROM gradle:jdk25-corretto AS builder 
WORKDIR /app

# caching layer
COPY settings.gradle.kts build.gradle.kts gradle.properties ./
COPY app/build.gradle.kts app/
COPY shared/build.gradle.kts shared/

# Copy source code
COPY . .

# Build the application, skipping tests to speed up container build 
RUN ./gradlew clean :app:bootJar -x test --no-daemon

# Stage 2: Run the application
FROM eclipse-temurin:25-jre-jammy
WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/app/build/libs/*.jar app.jar

# Expose the internal port (Container port)
EXPOSE 8080

# Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]
