FROM openjdk:11-jdk-slim AS build

FROM maven:3.6.0-jdk-11-slim AS build

COPY . /app
WORKDIR /app

RUN mvn -f /app/pom.xml clean package

RUN mkdir -p target/dependency && (cd target/dependency; jar -xf ../*.jar)

FROM openjdk:11-jdk-slim

COPY --from=build /app/target/classes /app
#COPY --from=build /app/target/dependency/BOOT-INF/lib /app/lib
#COPY --from=build /app/target/dependency/META-INF /app/META-INF

EXPOSE 8080

ENTRYPOINT ["java", "-cp", "/app:/app/lib/*", "-Djava.library.path=/usr/lib/x86_64-linux-gnu", "org.iish.coins.Application"]
