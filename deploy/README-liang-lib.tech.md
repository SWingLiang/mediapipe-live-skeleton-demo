# Deploy to liang-lib.tech on Volcengine Hong Kong ECS

This guide deploys the MediaPipe Live Skeleton Demo to:

```txt
https://liang-lib.tech
```

## 1. DNS records

In Volcengine DNS or your domain DNS provider, add these records:

```txt
A    @      <your-volcengine-hk-ecs-public-ip>
A    www    <your-volcengine-hk-ecs-public-ip>
```

Wait until DNS resolves.

## 2. Security group

Open inbound ports:

```txt
TCP 22
TCP 80
TCP 443
```

## 3. Run deployment script

SSH into the ECS server:

```bash
ssh root@<your-volcengine-hk-ecs-public-ip>
```

Then run:

```bash
cd /opt
if [ ! -d mediapipe-live-skeleton-demo ]; then
  git clone https://github.com/SWingLiang/mediapipe-live-skeleton-demo.git
fi
cd mediapipe-live-skeleton-demo
chmod +x deploy/deploy-volcengine-liang-lib.sh
bash deploy/deploy-volcengine-liang-lib.sh
```

After this step, test:

```txt
http://liang-lib.tech
```

## 4. Enable HTTPS

Camera access requires HTTPS.

Install Certbot:

```bash
apt install -y snapd
snap install core
snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/local/bin/certbot
```

Issue the certificate:

```bash
certbot --nginx -d liang-lib.tech -d www.liang-lib.tech
```

Test renewal:

```bash
certbot renew --dry-run
```

Then open:

```txt
https://liang-lib.tech
```

## 5. Update deployment later

When the GitHub repo changes, run:

```bash
cd /opt/mediapipe-live-skeleton-demo
git pull
npm install
npm run build
rsync -av --delete dist/ /var/www/mediapipe-live-skeleton-demo/
nginx -t
systemctl reload nginx
```

## Notes

This is a static Vite site. The browser performs MediaPipe inference locally on the user's device. The server only serves HTML, JS, CSS, WASM, and the Pose Landmarker model.
