FROM maven:3.6.0-jdk-11-slim AS build

COPY . /app
WORKDIR /app

RUN mvn -f /app/pom.xml clean package

RUN mkdir -p target/dependency && (cd target/dependency; jar -xf ../coins-1.0.jar)

FROM openjdk:11-jdk-slim

COPY --from=build /app/target/dependency/ /app

EXPOSE 8080

ENTRYPOINT ["java", "-cp", "/app", "-Dcoins.config=/app/config.yaml", "org.iish.coins.Application"]
