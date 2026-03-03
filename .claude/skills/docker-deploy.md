# Docker & VPS Deployment

## Purpose
Production deployment of Almaty Valuator on a VPS using Docker Compose, Nginx reverse proxy, and Let's Encrypt SSL.

## Architecture
```
VPS (Ubuntu 22.04)
├── Docker
│   ├── next-app (port 3000)
│   ├── telegram-bot (standalone process)
│   └── nginx (ports 80, 443)
├── Certbot (Let's Encrypt auto-renewal)
└── Cron (krisha.kz scraper: Monday 3AM)
```

## Dockerfile
```dockerfile
# Multi-stage build for Next.js
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Requires `output: "standalone"` in `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};
export default nextConfig;
```

## docker-compose.yml
```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: .env.production
    ports:
      - "3000:3000"
    networks:
      - internal

  telegram-bot:
    build:
      context: .
      dockerfile: Dockerfile.bot
    restart: unless-stopped
    env_file: .env.production
    depends_on:
      - app
    networks:
      - internal

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - app
    networks:
      - internal
      - external

  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

networks:
  internal:
  external:
```

## Dockerfile.bot (Telegram bot)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY telegram-bot/ ./telegram-bot/
COPY src/lib/ ./src/lib/
COPY src/data/ ./src/data/
COPY src/types/ ./src/types/
COPY tsconfig.json ./
RUN npm install -g tsx
CMD ["tsx", "telegram-bot/index.ts"]
```

## Nginx Config (`nginx/default.conf`)
```nginx
upstream nextjs {
    server app:3000;
}

server {
    listen 80;
    server_name valuator.yourdomain.kz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name valuator.yourdomain.kz;

    ssl_certificate /etc/letsencrypt/live/valuator.yourdomain.kz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/valuator.yourdomain.kz/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Next.js static assets (long cache)
    location /_next/static {
        proxy_pass http://nextjs;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Everything else
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL Setup (First Time)
```bash
# 1. Start nginx with HTTP only first (comment out ssl server block)
docker compose up -d nginx

# 2. Get certificates
docker compose run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d valuator.yourdomain.kz \
  --email your@email.com --agree-tos --no-eff-email

# 3. Uncomment SSL block in nginx config, restart
docker compose restart nginx
```

## GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build & push Docker image
        run: |
          docker build -t ghcr.io/${{ github.repository }}:latest .
          echo ${{ secrets.GHCR_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}:latest

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/almaty-valuator
            docker compose pull
            docker compose up -d --force-recreate
            docker image prune -f
```

## VPS Initial Setup
```bash
# 1. SSH into VPS
ssh root@your-vps-ip

# 2. Install Docker
curl -fsSL https://get.docker.com | sh

# 3. Clone repo
git clone https://github.com/you/almaty-valuator.git /opt/almaty-valuator
cd /opt/almaty-valuator

# 4. Create env file
cp .env.example .env.production
nano .env.production  # fill in real values

# 5. Build & start
docker compose up -d --build

# 6. Set up krisha.kz cron
crontab -e
# Add: 0 3 * * 1 cd /opt/almaty-valuator && docker compose exec app npx tsx scripts/scrape-krisha.ts >> /var/log/krisha.log 2>&1
```

## VPS Specs (Minimum)
- Ubuntu 22.04 LTS
- 2 vCPU / 4 GB RAM
- 40 GB SSD
- Providers: Hetzner, DigitalOcean, Timeweb (for KZ)

## Monitoring
- **Uptime:** Use UptimeRobot (free) or self-hosted Uptime Kuma
- **Logs:** `docker compose logs -f app` for Next.js, `docker compose logs -f telegram-bot` for bot
- **Alerts:** Telegram notification on service crash (use Docker healthchecks + simple script)
