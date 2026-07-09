#!/usr/bin/env bash
set -euo pipefail

APP_NAME="mediapipe-live-skeleton-demo"
REPO_URL="https://github.com/SWingLiang/mediapipe-live-skeleton-demo.git"
APP_DIR="/opt/${APP_NAME}"
WEB_DIR="/var/www/${APP_NAME}"
NGINX_SITE="/etc/nginx/sites-available/poseread.liang-lib.tech"
DOMAIN="poseread.liang-lib.tech"

if [ "${EUID}" -ne 0 ]; then
  echo "Please run as root: sudo bash deploy/deploy-poseread.sh"
  exit 1
fi

echo "[1/7] Installing system packages..."
apt update
apt install -y git nginx curl rsync snapd

if ! command -v node >/dev/null 2>&1; then
  echo "[2/7] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
else
  echo "[2/7] Node.js already installed: $(node -v)"
fi

echo "[3/7] Pulling repository..."
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" pull
else
  git clone "${REPO_URL}" "${APP_DIR}"
fi

echo "[4/7] Building app..."
cd "${APP_DIR}"
npm install
npm run build

echo "[5/7] Publishing dist to ${WEB_DIR}..."
mkdir -p "${WEB_DIR}"
rsync -av --delete "${APP_DIR}/dist/" "${WEB_DIR}/"
chown -R www-data:www-data "${WEB_DIR}"

echo "[6/7] Configuring Nginx..."
cat > "${NGINX_SITE}" <<'NGINX'
server {
    listen 80;
    server_name poseread.liang-lib.tech;

    root /var/www/mediapipe-live-skeleton-demo;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    location ~* \.(wasm|task)$ {
        expires 30d;
        add_header Cache-Control "public";
        types {
            application/wasm wasm;
            application/octet-stream task;
        }
        try_files $uri =404;
    }
}
NGINX

ln -sf "${NGINX_SITE}" "/etc/nginx/sites-enabled/poseread.liang-lib.tech"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "[7/7] Done. Now point DNS A record for ${DOMAIN} to this server IP, then run:"
echo "certbot --nginx -d ${DOMAIN}"
