#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEAR_DIR="$ROOT_DIR/wearos-app"

echo "⌚ Préparation de la compilation BetterSchool Wear OS..."

# Détection du SDK Android local
if [ -z "$ANDROID_HOME" ] && [ -d "$HOME/Android/Sdk" ]; then
  export ANDROID_HOME="$HOME/Android/Sdk"
fi

if [ -n "$ANDROID_HOME" ]; then
  echo "sdk.dir=$ANDROID_HOME" > "$WEAR_DIR/local.properties"
  echo "✅ Android SDK détecté : $ANDROID_HOME"
fi

# Recherche d'un binaire gradle disponible
GRADLE_CMD=""
if command -v gradle >/dev/null 2>&1; then
  GRADLE_CMD="gradle"
elif [ -x "$WEAR_DIR/gradlew" ]; then
  GRADLE_CMD="$WEAR_DIR/gradlew"
else
  FOUND_GRADLE="$(find "$HOME/.gradle/wrapper/dists" -name "gradle" -type f -executable 2>/dev/null | head -n 1 || true)"
  if [ -n "$FOUND_GRADLE" ]; then
    GRADLE_CMD="$FOUND_GRADLE"
  fi
fi

if [ -z "$GRADLE_CMD" ]; then
  echo "⚠️ Gradle n'a pas été trouvé. Ouvrez wearos-app/ dans Android Studio pour générer l'APK."
  exit 1
fi

echo "🚀 Compilation de l'APK Wear OS (Release optimisé R8) avec : $GRADLE_CMD"
cd "$WEAR_DIR"
"$GRADLE_CMD" assembleRelease --no-daemon

APK_SOURCE="$WEAR_DIR/app/build/outputs/apk/release/app-release.apk"
if [ ! -f "$APK_SOURCE" ]; then
  APK_SOURCE="$WEAR_DIR/app/build/outputs/apk/debug/app-debug.apk"
fi
APK_DEST="$ROOT_DIR/public/betterschool-wearos.apk"

if [ -f "$APK_SOURCE" ]; then
  cp "$APK_SOURCE" "$APK_DEST"
  echo "✅ APK Wear OS compilé et copié dans : public/betterschool-wearos.apk"
  echo "🌐 Il est maintenant téléchargeable en 1 clic depuis la modale ⌚ de BetterSchool Web !"
else
  echo "❌ L'APK n'a pas été trouvé à l'emplacement attendu ($APK_SOURCE)."
  exit 1
fi
