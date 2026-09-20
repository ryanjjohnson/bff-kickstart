FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# Distroless runtime: a JRE and the app jar, nothing else - no shell, no
# package manager, no busybox, so there's no `docker exec sh` and a much
# smaller attack surface. Debug with an ephemeral/sidecar container instead.
# The -debian13 tag is a full OpenJDK 25 JRE (matches the temurin-25 build
# above; Spring Boot 4 requires Java 21+). Kept as the default (root) variant
# rather than :nonroot so this change is *only* shell removal - not also a uid
# change - matching the old eclipse-temurin image's behaviour.
FROM gcr.io/distroless/java25-debian13
WORKDIR /app
# The artifact is a WAR now (see pom `war` packaging), but spring-boot-maven-plugin
# repackages it as an *executable* war, so `java -jar app.war` runs it embedded
# here exactly as the jar did - the WAR shape only matters when it's instead
# dropped into a standalone Tomcat.
COPY --from=build /build/target/backend.war /app/app.war
EXPOSE 8081
# Exec form: no shell is involved in launching the JVM. (This overrides the
# base image's own `java -jar` entrypoint with the explicit war path.)
ENTRYPOINT ["java", "-jar", "/app/app.war"]
