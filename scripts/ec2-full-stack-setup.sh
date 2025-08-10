#!/bin/bash
set -euo pipefail

# EC2 Full Stack Setup Script
# Sets up Nginx to serve both frontend and API on a single EC2 instance

# Configuration
DOMAIN="${DOMAIN:-aiglossarypro.com}"
EMAIL="${EMAIL:-admin@aiglossarypro.com}"
FRONTEND_DIR="/var/www/aiglossarypro"
API_PORT="8080"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Setting up Full Stack on EC2${NC}"
echo "Domain: $DOMAIN"
echo "Frontend Dir: $FRONTEND_DIR"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run with sudo${NC}"
    exit 1
fi

# Step 1: Update system and install dependencies
echo -e "${YELLOW}1️⃣ Installing system dependencies...${NC}"
yum update -y
yum install -y nginx git docker jq aws-cli
amazon-linux-extras install -y nginx1

# Install Node.js 20 for building frontend
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install pnpm
npm install -g pnpm@9.15.1

# Step 2: Start services
echo -e "${YELLOW}2️⃣ Starting services...${NC}"
systemctl enable nginx
systemctl start nginx
systemctl enable docker
systemctl start docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Step 3: Clone repository and build frontend
echo -e "${YELLOW}3️⃣ Building frontend...${NC}"
cd /tmp
if [ -d "aiglossarypro" ]; then
    rm -rf aiglossarypro
fi

git clone https://github.com/pranaysuyash/aiglossarypro.git
cd aiglossarypro

# Install dependencies and build frontend
pnpm install --frozen-lockfile
pnpm -F @aiglossarypro/web build

# Step 4: Set up frontend directory
echo -e "${YELLOW}4️⃣ Setting up frontend directory...${NC}"
mkdir -p $FRONTEND_DIR
cp -r apps/frontend/dist/* $FRONTEND_DIR/
chown -R nginx:nginx $FRONTEND_DIR

# Step 5: Configure Nginx
echo -e "${YELLOW}5️⃣ Configuring Nginx...${NC}"
cat > /etc/nginx/conf.d/aiglossarypro.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend root
    root $FRONTEND_DIR;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoints
    location /health {
        proxy_pass http://127.0.0.1:$API_PORT/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Frontend routing (React SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
    gzip_min_length 1000;
}
EOF

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Step 6: Install Certbot and get SSL certificate
echo -e "${YELLOW}6️⃣ Setting up SSL with Let's Encrypt...${NC}"
yum install -y certbot python3-certbot-nginx

# Get SSL certificate (will modify Nginx config automatically)
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

# Set up auto-renewal
cat > /etc/cron.d/certbot << EOF
0 0,12 * * * root certbot renew --quiet --no-self-upgrade --post-hook "systemctl reload nginx"
EOF

# Step 7: Start API container
echo -e "${YELLOW}7️⃣ Starting API container...${NC}"
cd /home/ec2-user
if [ -f "scripts/ec2-start-api.sh" ]; then
    echo "Using existing ec2-start-api.sh"
else
    # Copy the start script
    cp /tmp/aiglossarypro/scripts/ec2-start-api.sh ./
    chmod +x ec2-start-api.sh
fi

# Set up environment for API start script
cat > /home/ec2-user/.env.api << EOF
export AWS_REGION=us-east-1
export ACCOUNT_ID=927289246324
export ECR_REPO=aiglossarypro-api
export DATABASE_URL_ARN=arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/database
export SESSION_SECRET_ARN=arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/session
export JWT_SECRET_ARN=arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/jwt
EOF

# Run the API start script
source /home/ec2-user/.env.api
/home/ec2-user/ec2-start-api.sh

# Step 8: Create management scripts
echo -e "${YELLOW}8️⃣ Creating management scripts...${NC}"

# Create update script
cat > /home/ec2-user/update-frontend.sh << 'SCRIPT'
#!/bin/bash
set -e
echo "Updating frontend..."
cd /tmp
rm -rf aiglossarypro
git clone https://github.com/pranaysuyash/aiglossarypro.git
cd aiglossarypro
pnpm install --frozen-lockfile
pnpm -F @aiglossarypro/web build
sudo rm -rf /var/www/aiglossarypro/*
sudo cp -r apps/frontend/dist/* /var/www/aiglossarypro/
sudo chown -R nginx:nginx /var/www/aiglossarypro
echo "Frontend updated successfully!"
SCRIPT

# Create status script
cat > /home/ec2-user/check-status.sh << 'SCRIPT'
#!/bin/bash
echo "=== System Status ==="
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -5
echo ""
echo "API Container:"
docker ps --filter name=api --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Health Checks:"
echo -n "  Local API: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health && echo " ✅" || echo " ❌"
echo -n "  Nginx Proxy: "
curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health && echo " ✅" || echo " ❌"
echo ""
echo "Disk Usage:"
df -h / | tail -1
echo ""
echo "Memory Usage:"
free -h | grep Mem
SCRIPT

chmod +x /home/ec2-user/*.sh
chown ec2-user:ec2-user /home/ec2-user/*.sh

# Step 9: Set up log rotation
echo -e "${YELLOW}9️⃣ Setting up log rotation...${NC}"
cat > /etc/logrotate.d/aiglossarypro << EOF
/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 nginx nginx
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# Step 10: Final verification
echo -e "${YELLOW}🔟 Verifying deployment...${NC}"
sleep 10

echo -n "Nginx running: "
systemctl is-active nginx && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"

echo -n "API container running: "
docker ps --filter name=api --format "{{.Names}}" | grep -q api && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}"

echo -n "HTTP redirect working: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L http://$DOMAIN)
[ "$HTTP_CODE" = "200" ] && echo -e "${GREEN}✅${NC}" || echo -e "${YELLOW}⚠️ $HTTP_CODE${NC}"

echo ""
echo -e "${GREEN}🎉 Full stack deployment complete!${NC}"
echo ""
echo "Access your site at:"
echo "  🌐 https://$DOMAIN"
echo ""
echo "Management commands:"
echo "  Check status: ./check-status.sh"
echo "  Update frontend: ./update-frontend.sh"
echo "  View API logs: docker logs -f api"
echo "  View Nginx logs: sudo tail -f /var/log/nginx/access.log"
echo ""
echo "API endpoints:"
echo "  https://$DOMAIN/api/health"
echo "  https://$DOMAIN/api/terms"
echo "  https://$DOMAIN/api/categories"