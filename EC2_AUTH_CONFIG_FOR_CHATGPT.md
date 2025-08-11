# EC2 Deployment Authentication & Configuration - For ChatGPT

## Current Status
- **EC2 Instance**: i-045ff31e850f8b78d (running)
- **Public IP**: 52.0.112.85
- **Instance Type**: t3.small
- **Key Pair**: aiglossarypro-ec2.pem
- **Security Group**: Allows HTTP (80), SSH (22)

## SSH Access
```bash
# SSH key location
~/.ssh/aiglossarypro-ec2.pem

# SSH command
ssh -o StrictHostKeyChecking=no -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@52.0.112.85
```

## Current EC2 State
```bash
# PM2 is running the REAL API (not fallback) but having issues
pm2 status
# Shows: aiglossarypro-api (online) but 502 bad gateway externally

# API is built and available at:
~/aiglossarypro/apps/api/dist/index.js

# Environment file exists:
/etc/aiglossarypro/api.env

# Frontend is deployed but may need fixes:
/var/www/html/ (contains React build)

# Nginx is running:
sudo nginx -t  # shows config is valid
```

## Environment Configuration (/etc/aiglossarypro/api.env)
```bash
NODE_ENV=production
PORT=8080
USE_STANDARD_PG=true
REDIS_ENABLED=false
ALLOW_NO_AUTH_FOR_DEBUG=true
SESSION_SECRET=739928d1d5a681613f0ad9a8d3a21ea6f2fd5c579a0f25c0239e4a6343a6e75b
JWT_SECRET=27c5756fb55a8049721af0c59fd190c465df52608f125c04fa051564cfef9bfd
DATABASE_URL=postgresql://neondb_owner:npg_9dlJKInqoT1w@ep-wandering-morning-a5u0szvw.us-east-2.aws.neon.tech/neondb?sslmode=require
OPENAI_API_KEY=placeholder-key-not-required-for-basic-api
```

## Nginx Configuration (/etc/nginx/nginx.conf)
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    upstream api {
        server 127.0.0.1:8080;
    }

    server {
        listen 80;
        server_name _;

        # Frontend
        location / {
            root /var/www/html;
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "public, max-age=31536000" always;
        }

        # API proxy
        location /api/ {
            proxy_pass http://api/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

## Project Structure on EC2
```bash
/home/ec2-user/aiglossarypro/
├── apps/
│   ├── api/
│   │   ├── dist/           # Compiled TypeScript (REAL API)
│   │   │   └── index.js    # Main API entry point
│   │   └── src/            # Source code
│   └── web/
│       ├── dist/           # TypeScript build (not web assets)
│       └── src/            # React source
├── packages/               # Shared packages
├── dist/
│   └── public/            # Vite build output (web assets)
│       ├── index.html
│       └── assets/        # JS/CSS bundles
└── package.json           # Root package.json with pnpm workspaces
```

## Problems to Fix
1. **API 502 Bad Gateway**: PM2 shows online but nginx can't reach it
2. **Frontend might be serving wrong files**: Need to ensure /var/www/html has correct Vite build output
3. **Environment loading**: PM2 may not be loading env vars properly

## Exact Commands That Should Work (from ChatGPT analysis)
```bash
# 1) Stop fallback and ensure env is loaded for PM2
set -e
pm2 delete all || true
set -a && source /etc/aiglossarypro/api.env && set +a

# 2) Real API: install prod deps and start real server
cd ~/aiglossarypro
pnpm --filter @aiglossarypro/api... install --prod --frozen-lockfile
pm2 start "node apps/api/dist/index.js" --name aiglossarypro-api --update-env
pm2 save

# 3) Frontend: build with higher memory and deploy compiled assets
NODE_OPTIONS=--max-old-space-size=1536 pnpm -F @aiglossarypro/web build
sudo rm -rf /var/www/html/* && sudo mkdir -p /var/www/html
sudo cp -r apps/web/dist/* /var/www/html/
sudo nginx -t && sudo systemctl reload nginx

# 4) Verification gates (must all pass)
pm2 describe aiglossarypro-api | grep -E "apps/api/dist/index.js"
curl -sSf http://127.0.0.1:8080/api/health >/dev/null
curl -sSf "http://127.0.0.1:8080/api/terms?limit=1" | head -200 >/dev/null
ASSET=$(grep -o 'assets/[^"]*\.js' /var/www/html/index.html | head -1); curl -sI "http://127.0.0.1/$ASSET" | head -1
```

## Database Connection
```bash
# Test direct database connection
PGPASSWORD=npg_9dlJKInqoT1w psql -h ep-wandering-morning-a5u0szvw.us-east-2.aws.neon.tech -U neondb_owner -d neondb -c "SELECT COUNT(*) FROM terms;"
```

## Package Manager - CRITICAL
```bash
# MUST use pnpm (not npm) due to workspace:* dependencies
which pnpm
# Should show: /usr/local/bin/pnpm

# If npm is used instead, it will fail with:
# "Unsupported URL Type 'workspace:*'"
```

## AWS CLI Configuration
```bash
# AWS CLI is installed and configured for the deployment user
aws sts get-caller-identity
# Should show proper AWS account/user
```

## Key Files That Must Exist
1. `/etc/aiglossarypro/api.env` - Environment variables
2. `~/aiglossarypro/apps/api/dist/index.js` - Built API
3. `/var/www/html/index.html` - Frontend entry point
4. `/var/www/html/assets/` - Frontend JS/CSS bundles
5. `/etc/nginx/nginx.conf` - Nginx proxy config

## Expected Behavior
- `http://52.0.112.85/` - React frontend loads
- `http://52.0.112.85/api/health` - Returns {"status":"ok","timestamp":"..."}
- `http://52.0.112.85/api/terms` - Returns actual terms from database

## If Build Fails (Memory Issues)
```bash
# Option 1: Increase swap
sudo swapoff /swapfile || true
sudo fallocate -l 6G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile

# Option 2: Resize to t3.medium temporarily
aws ec2 stop-instances --instance-ids i-045ff31e850f8b78d
aws ec2 modify-instance-attribute --instance-id i-045ff31e850f8b78d --instance-type '{"Value":"t3.medium"}'
aws ec2 start-instances --instance-ids i-045ff31e850f8b78d

# Option 3: Build locally and upload (most reliable)
# [Local] pnpm -F @aiglossarypro/web build
# [Local] scp -i ~/.ssh/aiglossarypro-ec2.pem -r dist/public/* ec2-user@52.0.112.85:/tmp/webdist/
# [EC2] sudo cp -r /tmp/webdist/* /var/www/html/
```

## Emergency Reset
```bash
# If everything is broken, restart services
sudo systemctl restart nginx
pm2 restart all
pm2 logs --lines 50
```

## Success Verification
```bash
# These should all return 200 OK:
curl -I http://52.0.112.85/
curl -I http://52.0.112.85/api/health
curl -s http://52.0.112.85/api/terms?limit=1 | jq '.'
```

## Access Credentials Summary for ChatGPT
- **Instance ID**: i-045ff31e850f8b78d
- **SSH Key**: ~/.ssh/aiglossarypro-ec2.pem
- **Public IP**: 52.0.112.85
- **User**: ec2-user
- **Database**: Neon PostgreSQL (connection string in env file)
- **Package Manager**: pnpm (REQUIRED)
- **Web Server**: Nginx on port 80
- **API Server**: Node.js on port 8080 via PM2

The main issue is that the API is showing as online in PM2 but returning 502 Bad Gateway externally, and the frontend may need the correct Vite build assets deployed.