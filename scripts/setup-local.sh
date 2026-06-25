#!/bin/sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PHP_BIN="${PHP_BIN:-}"
COMPOSER_BIN="${COMPOSER_BIN:-}"

if [ -z "$PHP_BIN" ]; then
  if [ -x "/Applications/MAMP/bin/php/php8.3.14/bin/php" ]; then
    PHP_BIN="/Applications/MAMP/bin/php/php8.3.14/bin/php"
  elif command -v php >/dev/null 2>&1; then
    PHP_BIN="$(command -v php)"
  else
    echo "PHP was not found. Set PHP_BIN and rerun this script." >&2
    exit 1
  fi
fi

if [ -z "$COMPOSER_BIN" ]; then
  if [ -x "/Applications/MAMP/bin/php/composer" ]; then
    COMPOSER_BIN="/Applications/MAMP/bin/php/composer"
  elif command -v composer >/dev/null 2>&1; then
    COMPOSER_BIN="$(command -v composer)"
  else
    echo "Composer was not found. Set COMPOSER_BIN and rerun this script." >&2
    exit 1
  fi
fi

"$PHP_BIN" "$COMPOSER_BIN" install

if [ ! -f "php/sso_local.php" ] && [ -f "php/sso_local.example.php" ]; then
  cp "php/sso_local.example.php" "php/sso_local.php"
  echo "Created php/sso_local.php from php/sso_local.example.php."
  echo "Edit php/sso_local.php and set your local SSO credentials."
fi

echo "Local setup complete."
