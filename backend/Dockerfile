FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# Distroless runtime: a JRE and the app jar, nothing else - no shell, no
# package manager, no busybox, so there's no `docker exec sh` and a much
# smaller attack surface. Debug with an ephemeral/sidecar container instead.
# The -debian12 tag is a full OpenJDK 17 JRE (matches the temurin-17 build
# above). Kept as the default (root) variant rather than :nonroot so this
# change is *only* shell removal - not also a uid change - matching the old
# eclipse-temurin image's behaviour.
FROM gcr.io/distroless/java17-debian12
WORKDIR /app
COPY --from=build /build/target/backend.jar /app/app.jar
EXPOSE 8081
# Exec form: no shell is involved in launching the JVM. (This overrides the
# base image's own `java -jar` entrypoint with the explicit jar path.)
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
