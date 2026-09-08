#!/usr/bin/env bash
# Runs the local identity stand-in as a native Keycloak process instead of the
# `keycloak` Docker Compose service - for devs without (or who'd rather not use)
# Docker. See "Running without Docker" in the root README for the full picture;
# this script only handles Keycloak, since it's the one piece with no simple
# `brew install`/native package (unlike Postgres/Mailhog, which the no-Docker
# path skips or replaces - see the README section).
#
# What it does, each run:
#   1. Downloads and extracts the official Keycloak distribution (once - reused
#      on later runs) into keycloak/.dist/, never committed (see keycloak/.gitignore).
#   2. Copies in this repo's theme, registration SPI jar (building it first if
#      missing), and realm export - the same three things the Docker image's
#      Dockerfile bakes in at build time, just placed into a real directory tree
#      here instead of a container layer.
#   3. Starts it in dev mode on :8080 with --import-realm, using Keycloak's own
#      embedded dev database - no Postgres needed for this piece either.
#
# Requires the same /etc/hosts entry as the Docker path (root README's
# "One-time host setup"): 127.0.0.1 keycloak - both this script and the Docker
# service are reachable at the same "keycloak:8080" address either way, so the
# backend's default KEYCLOAK_*_URI values work unmodified regardless of which
# one is actually running.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYCLOAK_DIR="$(cd "$SCRIPT_DIR/../keycloak" && pwd)"

KEYCLOAK_VERSION="26.7.3"
DIST_DIR="$KEYCLOAK_DIR/.dist"
KC_HOME="$DIST_DIR/keycloak-$KEYCLOAK_VERSION"
ARCHIVE="$DIST_DIR/keycloak-$KEYCLOAK_VERSION.tar.gz"
DOWNLOAD_URL="https://github.com/keycloak/keycloak/releases/download/$KEYCLOAK_VERSION/keycloak-$KEYCLOAK_VERSION.tar.gz"

mkdir -p "$DIST_DIR"

if [ ! -d "$KC_HOME" ]; then
  echo "Downloading Keycloak $KEYCLOAK_VERSION (once - reused on future runs)..."
  curl -fL "$DOWNLOAD_URL" -o "$ARCHIVE"
  tar -xzf "$ARCHIVE" -C "$DIST_DIR"
  rm -f "$ARCHIVE"
fi

# Build the registration SPI jar if it isn't already there (same jar the
# Dockerfile's COPY line expects - see root README's docker-compose instructions).
SPI_JAR="$KEYCLOAK_DIR/providers/bff-registration-spi/target/bff-registration-spi.jar"
if [ ! -f "$SPI_JAR" ]; then
  echo "Building the registration SPI jar..."
  mvn -q -f "$KEYCLOAK_DIR/providers/bff-registration-spi/pom.xml" clean package -DskipTests
fi

echo "Copying theme, SPI, and realm export into the native distribution..."
rm -rf "$KC_HOME/themes/gizmoshop"
cp -R "$KEYCLOAK_DIR/themes/gizmoshop" "$KC_HOME/themes/gizmoshop"
cp "$SPI_JAR" "$KC_HOME/providers/bff-registration-spi.jar"
mkdir -p "$KC_HOME/data/import"
cp "$KEYCLOAK_DIR/realm-export/gizmoshop-realm.json" "$KC_HOME/data/import/gizmoshop-realm.json"

echo "Building Keycloak (picks up the theme/provider changes above)..."
"$KC_HOME/bin/kc.sh" build

echo ""
echo "Starting Keycloak on :8080 - admin console at http://keycloak:8080/admin (admin/admin)."
echo "Ctrl-C to stop. Re-run this script any time the theme, SPI, or realm export changes."
echo ""

export KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
export KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
export KC_HTTP_ENABLED=true
export KC_HEALTH_ENABLED=true
# Same fixed hostname the Docker service uses (see docker-compose.yml's own
# comment) - matches what's registered in the realm export's redirect URIs,
# reachable identically from the browser and from the backend once the
# /etc/hosts entry from the root README is in place.
export KC_HOSTNAME=keycloak
export KC_HOSTNAME_STRICT=false

exec "$KC_HOME/bin/kc.sh" start-dev --http-port=8080 --import-realm
