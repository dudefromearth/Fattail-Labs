#!/usr/bin/env bash
# FatTail Labs — macOS dev bootstrap (Apple Silicon / Homebrew)
#
#     cd ~/Fattail-Labs && bash scripts/dev-setup-macos.sh
#
# Creates the `labs` database + user and writes .env (mode 600, gitignored).
# The password is generated HERE and never printed. Safe to re-run.
#
# Assumes MySQL is installed and running:  brew services start mysql

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
echo "==> repo: $REPO_ROOT"

# ---------------------------------------------------------------- 0. mysql up?
if ! mysql -u root -e "SELECT 1" >/dev/null 2>&1; then
  echo "!! cannot log in as mysql root."
  echo "   If root has a password, run:  bash scripts/dev-setup-macos.sh -p"
  echo "   If mysql is stopped, run:     brew services start mysql"
  exit 1
fi
echo "==> mysql root login OK"

# ---------------------------------------------------------------- 1. bind addr
BREW_PREFIX="$(brew --prefix 2>/dev/null || echo /opt/homebrew)"
MYCNF="$BREW_PREFIX/etc/my.cnf"
if grep -qE '^\s*bind-address\s*=\s*0\.0\.0\.0' "$MYCNF" 2>/dev/null; then
  echo "==> mysql already listening beyond localhost"
else
  echo "==> opening mysql to the local VM network"
  cp "$MYCNF" "$MYCNF.bak.$(date +%s)" 2>/dev/null || true
  if grep -q '^\[mysqld\]' "$MYCNF" 2>/dev/null; then
    /usr/bin/sed -i '' '/^[[:space:]]*bind-address[[:space:]]*=/d' "$MYCNF"
    /usr/bin/sed -i '' 's/^\[mysqld\]/[mysqld]\'$'\n''bind-address = 0.0.0.0/' "$MYCNF"
  else
    printf '\n[mysqld]\nbind-address = 0.0.0.0\n' >> "$MYCNF"
  fi
  brew services restart mysql
  for _ in $(seq 1 30); do mysql -u root -e "SELECT 1" >/dev/null 2>&1 && break; sleep 1; done
fi

# ---------------------------------------------------------------- 2. .env guard
if [ -f .env ]; then
  echo "==> .env already exists — leaving it and the DB password alone."
  echo "    (delete .env first if you want a clean regenerate)"
  exit 0
fi

# ---------------------------------------------------------------- 3. db + user
DBPASS="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)"
SESSION_SECRET="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48)"
SSO_FATTAIL="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48)"
SSO_0DTE="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 48)"

echo "==> creating database 'labs' and user 'labs'"
mysql -u root <<SQL || { echo "!! mysql user/db creation failed"; exit 1; }
CREATE DATABASE IF NOT EXISTS labs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'labs'@'localhost'   IDENTIFIED BY '${DBPASS}';
CREATE USER IF NOT EXISTS 'labs'@'127.0.0.1'   IDENTIFIED BY '${DBPASS}';
CREATE USER IF NOT EXISTS 'labs'@'%'           IDENTIFIED BY '${DBPASS}';
ALTER USER 'labs'@'localhost' IDENTIFIED BY '${DBPASS}';
ALTER USER 'labs'@'127.0.0.1' IDENTIFIED BY '${DBPASS}';
ALTER USER 'labs'@'%'         IDENTIFIED BY '${DBPASS}';
GRANT ALL PRIVILEGES ON labs.* TO 'labs'@'localhost';
GRANT ALL PRIVILEGES ON labs.* TO 'labs'@'127.0.0.1';
GRANT ALL PRIVILEGES ON labs.* TO 'labs'@'%';
FLUSH PRIVILEGES;
SQL

# ---------------------------------------------------------------- 4. .env
# 127.0.0.1 is correct for running the server natively on macOS.
# The Claude sandbox reaches the same instance at 172.16.10.254 and overrides
# LABS_DB_HOST in its own environment; it does not edit this file.
echo "==> writing .env"
umask 077
sed -e "s|^LABS_DB_HOST=.*|LABS_DB_HOST=127.0.0.1|" \
    -e "s|^LABS_DB_PASSWORD=.*|LABS_DB_PASSWORD=${DBPASS}|" \
    -e "s|^LABS_SESSION_SECRET=.*|LABS_SESSION_SECRET=${SESSION_SECRET}|" \
    -e "s|^LABS_SSO_SECRET_FATTAIL=.*|LABS_SSO_SECRET_FATTAIL=${SSO_FATTAIL}|" \
    -e "s|^LABS_SSO_SECRET_0DTE=.*|LABS_SSO_SECRET_0DTE=${SSO_0DTE}|" \
    -e "s|^LABS_SMTP_PASSWORD=.*|LABS_SMTP_PASSWORD=dev-no-smtp|" \
    .env.example > .env
chmod 600 .env

echo
echo "==> done. .env written, mode 600, gitignored. No secret printed."
echo "    db=labs  user=labs  host=127.0.0.1 (sandbox uses 172.16.10.254)"
echo "    Next: Claude runs the migrations and the test suite."