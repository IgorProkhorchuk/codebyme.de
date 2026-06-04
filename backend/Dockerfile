# Stage 1: Run the application
FROM eclipse-temurin:25-jre-jammy
WORKDIR /app

# Copy the built jar from the CI artifact (built in previous CI stage)
COPY app/build/libs/*.jar app.jar

# Expose the internal port (Container port)
EXPOSE 8080

# Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]
