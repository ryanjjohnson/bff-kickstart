FROM quay.io/keycloak/keycloak:26.7.3

# bff-kickstart theme (login/registration, account console skin, email) - see themes/gizmoshop.
COPY themes/gizmoshop /opt/keycloak/themes/gizmoshop

# Custom registration SPI (built beforehand: mvn -f providers/bff-registration-spi/pom.xml package)
# - see providers/bff-registration-spi.
COPY providers/bff-registration-spi/target/bff-registration-spi.jar /opt/keycloak/providers/bff-registration-spi.jar

RUN /opt/keycloak/bin/kc.sh build
