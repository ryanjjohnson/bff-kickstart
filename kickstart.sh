#!/usr/bin/env bash
# Bootstraps a new, freshly-branded app from this bff-kickstart template.
#
# What this does:
#   1. Copies the current working tree (not just the last git commit - your uncommitted
#      edits come along too) into a new destination directory, respecting .gitignore.
#   2. Rebrands it: display name, docker/URL slugs, DB name, Keycloak realm/client IDs, the
#      Java package (moved + rewritten under whatever reverse-domain package you choose), and
#      swaps the sample logo for a neutral placeholder (a new app has no business shipping
#      this template's own demo branding).
#   3. Gives the new project its own fresh git history - one initial commit, no remote - not
#      this template's commits. Matches how create-vite/degit/GitHub's own "template
#      repository" feature all work: a new project is its own history from day one.
#
# What this deliberately leaves alone: the demo domain itself (Facility/Permit/Inspection,
# the compliance report, the demo roles) - that's the kickstart's actual content, not
# branding, and is exactly what you're expected to build on top of or replace yourself.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --- sed portability: BSD (macOS) needs -i '', GNU (Linux) needs bare -i ---
if sed --version >/dev/null 2>&1; then
  SED_INPLACE=(-i)
else
  SED_INPLACE=(-i '')
fi

# --- 1. App name ---
read -rp "App name (e.g. \"Citrus Tracker\"): " APP_NAME
if [ -z "$APP_NAME" ]; then
  echo "App name is required." >&2
  exit 1
fi

APP_SLUG=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')
if [ -z "$APP_SLUG" ]; then
  echo "Couldn't derive a URL-safe slug from that name (need at least one letter or digit)." >&2
  exit 1
fi
DB_SLUG=$(echo "$APP_SLUG" | tr '-' '_')

# --- 2. Destination ---
DEFAULT_DEST="./out/$APP_SLUG"
read -rp "Destination directory [$DEFAULT_DEST]: " DEST
DEST="${DEST:-$DEFAULT_DEST}"

# --- 3. Java package (a full reverse-domain package, not just a suffix - "com.example" is
#     this template's own placeholder groupId, not a namespace worth preserving the way a real
#     organization's would be) ---
while true; do
  read -rp "Java package for the new app (e.g. \"com.acme.citrustracker\"): " NEW_PACKAGE
  if [[ "$NEW_PACKAGE" =~ ^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$ ]]; then
    break
  fi
  echo "Must be dot-separated lowercase segments, each starting with a letter (Java package rules - e.g. com.acme.citrustracker)." >&2
done
OLD_PACKAGE="com.example.bffkickstart"

# --- 4. Keycloak realm name (defaults to the app slug, but the realm and the URL/docker slug
#     are independent concerns - a real deployment's realm is often named by the identity team,
#     not the app team) ---
read -rp "Keycloak realm name [$APP_SLUG]: " REALM_SLUG
REALM_SLUG="${REALM_SLUG:-$APP_SLUG}"

echo ""
echo "About to create:"
echo "  App name         : $APP_NAME"
echo "  Destination      : $DEST"
echo "  Docker/URL slug  : $APP_SLUG"
echo "  DB name          : $DB_SLUG"
echo "  Keycloak realm   : $REALM_SLUG"
echo "  Java package     : $NEW_PACKAGE"
echo "  Git history      : fresh (this template's own history is not carried over)"
echo ""
read -rp "Continue? [Y/n] " CONFIRM
if [[ "$CONFIRM" =~ ^[Nn] ]]; then
  echo "Aborted."
  exit 1
fi

if [ -e "$DEST" ]; then
  echo "Destination '$DEST' already exists - refusing to overwrite." >&2
  exit 1
fi
mkdir -p "$DEST"
DEST="$(cd "$DEST" && pwd)"

# --- Copy: current working tree (uncommitted edits included), respecting .gitignore ---
echo "Copying template..."
git ls-files -co --exclude-standard -z \
  | tar --null -T - -cf - \
  | tar -C "$DEST" -xf -

# The setup script and its assets are template-authoring tools, not part of the generated app.
rm -f "$DEST/kickstart.sh"
rm -rf "$DEST/scripts"

echo "Rebranding..."

# --- Text substitution, scoped to text file types (never touches images/fonts/binaries) ---
# (Re-running `find` per substitution rather than caching the list once - simpler and
# portable to bash 3.2, which macOS still ships by default and lacks `mapfile`.)
find_text_files() {
  find "$DEST" -type f \( \
      -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.json' -o -name '*.properties' \
      -o -name '*.yml' -o -name '*.yaml' -o -name '*.xml' -o -name '*.java' -o -name '*.md' \
      -o -name '*.html' -o -name '*.css' -o -name '*.sql' -o -name '*.template' -o -name '*.sh' \
      -o -name 'Dockerfile' -o -name '.env*' \
    \) -print0
}

replace_in_files() {
  local old="$1" new="$2"
  local escaped_old=${old//./\\.}
  find_text_files | xargs -0 sed "${SED_INPLACE[@]}" "s/${escaped_old}/${new}/g"
}

# Order matters - longer/more specific patterns must run before the shorter patterns
# they contain as substrings, or the shorter pass fires first and leaves nothing for the
# more specific one to match: the Java package ("com.example.bffkickstart") contains
# "bff-kickstart"'s own dotted form, and "BFF Kickstart" (the compound display name) contains
# "bff-kickstart" too.
replace_in_files "$OLD_PACKAGE" "$NEW_PACKAGE"
replace_in_files "BFF Kickstart" "$APP_NAME"
replace_in_files "bff-kickstart" "$APP_SLUG"
replace_in_files "bff_kickstart" "$DB_SLUG"
replace_in_files "gizmoshop" "$REALM_SLUG"

# --- Physical move of the Java package directory tree (contents already rewritten above) ---
OLD_PKG_DIR="$DEST/backend/src/main/java/$(echo "$OLD_PACKAGE" | tr '.' '/')"
NEW_PKG_DIR="$DEST/backend/src/main/java/$(echo "$NEW_PACKAGE" | tr '.' '/')"
if [ -d "$OLD_PKG_DIR" ]; then
  mkdir -p "$(dirname "$NEW_PKG_DIR")"
  mv "$OLD_PKG_DIR" "$NEW_PKG_DIR"
  # Prune now-empty parent directories left behind by the move, up to (but not including)
  # backend/src/main/java itself.
  JAVA_ROOT="$DEST/backend/src/main/java"
  d="$(dirname "$OLD_PKG_DIR")"
  while [ "$d" != "$JAVA_ROOT" ] && [ -d "$d" ] && [ -z "$(ls -A "$d")" ]; do
    rmdir "$d"
    d="$(dirname "$d")"
  done
fi

# --- Swap the sample logo for a neutral placeholder ---
cp "$SCRIPT_DIR/scripts/kickstart-assets/placeholder-logo.png" "$DEST/frontend/src/assets/gizmo-logo.png"
cp "$SCRIPT_DIR/scripts/kickstart-assets/placeholder-logo.png" "$DEST/backend/src/main/resources/images/gizmo-logo.png"

# --- Cosmetic: rename the realm-export file to match (Keycloak imports every file in the
#     mounted directory regardless of name, so this isn't functionally required) ---
OLD_REALM_FILE="$DEST/keycloak/realm-export/gizmoshop-realm.json"
if [ -f "$OLD_REALM_FILE" ]; then
  mv "$OLD_REALM_FILE" "$DEST/keycloak/realm-export/${REALM_SLUG}-realm.json"
fi

# --- Fresh git history - not this template's ---
(
  cd "$DEST"
  git init -q
  git add -A
  git commit -q -m "Initial commit: $APP_NAME, generated from bff-kickstart"
)

echo ""
echo "Done! '$APP_NAME' created at $DEST"
echo ""
echo "Next steps:"
echo "  cd $DEST"
echo "  cp .env.example .env"
echo "  docker compose up --build"
echo ""
echo "One thing worth doing yourself: the header logo is a plain neutral placeholder"
echo "(scripts/kickstart-assets/placeholder-logo.png in the template) - swap in your own"
echo "org's logo at frontend/src/assets/gizmo-logo.png (and the matching copy under"
echo "backend/src/main/resources/images/) whenever you have one."
