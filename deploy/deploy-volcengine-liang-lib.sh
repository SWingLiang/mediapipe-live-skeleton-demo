#!/usr/bin/env bash
set -euo pipefail

APP_NAME="mediapipe-live-skeleton-demo"
REPO_URL="https://github.com/SWingLiang/mediapipe-live-skeleton-demo.git"
APP_DIR="/opt/${APP_NAME}"
WEB_DIR="/var/www/${APP_NAME}"
NGINX_CONF_SOURCE="${APP_DIR}/deploy/nginx-liang-lib.tech.conf"
NGINX_CONF_TARGET="/etc/nginx/sites-available/liang-lib.tech"
NGINX_CONF_LINK="/etc/nginx/sites-enabled/liang-lib.tech"

echo "[deploy] Installing required packages..."
apt update
apt install -y git nginx curl rsync

if ! command -v node >/dev/null 2>&1; then
  echo "[deploy] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

mkdir -p /opt

if [ ! -d "${APP_DIR}/.git" ]; then
  echo "[deploy] Cloning repository..."
  git clone "${REPO_URL}" "${APP_DIR}"
else
  echo "[deploy] Pulling latest repository changes..."
  cd "${APP_DIR}"
  git pull
fi

cd "${APP_DIR}"

echo "[deploy] Installing npm dependencies..."
npm install

echo "[deploy] Building static site..."
npm run build

echo "[deploy] Publishing dist to ${WEB_DIR}..."
mkdir -p "${WEB_DIR}"
rsync -av --delete dist/ "${WEB_DIR}/"
chown -R www-data:www-data "${WEB_DIR}"

echo "[deploy] Configuring Nginx..."
cp "${NGINX_CONF_SOURCE}" "${NGINX_CONF_TARGET}"
ln -sfn "${NGINX_CONF_TARGET}" "${NGINX_CONF_LINK}"
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl reload nginx

echo "[deploy] Done. Open http://liang-lib.tech first. Then run:"
echo "certbot --nginx -d liang-lib.tech -d www.liang-lib.tech"
