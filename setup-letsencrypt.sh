#!/bin/bash
# setup-letsencrypt.sh - Configure Let's Encrypt SSL for test.aiglossary.com

set -e

# Configuration
DOMAIN="test.aiglossary.com"
EMAIL="${EMAIL:-your-email@example.com}"  # Set EMAIL env var or update this
EC2_IP="52.0.112.85"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/aiglossarypro-ec2.pem}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Let's Encrypt Setup for $DOMAIN${NC}"
echo "======================================="

# Step 1: Check DNS
echo -e "\n${YELLOW}Step 1: Checking DNS configuration...${NC}"
DNS_IP=$(dig +short $DOMAIN @8.8.8.8 2>/dev/null | head -1)

if [ "$DNS_IP" = "$EC2_IP" ]; then
    echo -e "${GREEN}✅ DNS is configured correctly!${NC}"
    echo "   $DOMAIN → $DNS_IP"
else
    echo -e "${RED}❌ DNS not configured or propagated yet${NC}"
    echo "   Expected: $DOMAIN → $EC2_IP"
    echo "   Current:  $DOMAIN → ${DNS_IP:-Not found}"
    echo ""
    echo "Please add this DNS record:"
    echo "   Type: A"
    echo "   Name: test"
    echo "   Value: $EC2_IP"
    echo "   TTL: 300"
    echo ""
    echo "Then wait 5-10 minutes for propagation and run this script again."
    exit 1
fi

# Step 2: Test HTTP access
echo -e "\n${YELLOW}Step 2: Testing HTTP/HTTPS access...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/ 2>/dev/null || echo "000")
HTTPS_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ 2>/dev/null || echo "000")

echo "HTTP Status: $HTTP_CODE"
echo "HTTPS Status: $HTTPS_CODE (self-signed)"

if [ "$HTTP_CODE" != "301" ] && [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}Warning: HTTP not accessible${NC}"
fi

# Step 3: Get Let's Encrypt certificate
echo -e "\n${YELLOW}Step 3: Getting Let's Encrypt certificate...${NC}"
echo "This will:"
echo "  1. Obtain a certificate for $DOMAIN"
echo "  2. Configure Nginx automatically"
echo "  3. Set up auto-renewal"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh -o StrictHostKeyChecking=no -t -i "$SSH_KEY" ec2-user@$EC2_IP << EOFCERT
    # Stop Nginx temporarily for standalone mode
    sudo systemctl stop nginx
    
    # Get certificate using standalone mode
    sudo certbot certonly --standalone \
        -d $DOMAIN \
        --agree-tos \
        --no-eff-email \
        --email $EMAIL \
        --non-interactive
    
    # Update Nginx configuration
    sudo tee /etc/nginx/nginx.conf > /dev/null << 'NGINXCONF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    types_hash_max_size 2048;
    types_hash_bucket_size 128;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name $DOMAIN;
        return 301 https://\$host\$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl;
        http2 on;
        server_name $DOMAIN;

        # Let's Encrypt SSL
        ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
        
        # SSL Security Settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers off;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:10m;
        ssl_session_tickets off;
        
        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        # Frontend
        location / {
            root /var/www/html;
            try_files \$uri \$uri/ /index.html;
        }

        # Static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
            root /var/www/html;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # API proxy
        location /api/ {
            proxy_pass http://127.0.0.1:8080/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
NGINXCONF
    
    # Test and restart Nginx
    sudo nginx -t && sudo systemctl start nginx
    
    # Enable auto-renewal
    sudo systemctl enable --now certbot-renew.timer
    
    echo ""
    echo "✅ Let's Encrypt certificate installed!"
    echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
    echo "Auto-renewal enabled via systemd timer"
EOFCERT
    
    # Step 4: Test HTTPS
    echo -e "\n${YELLOW}Step 4: Testing new certificate...${NC}"
    sleep 2
    FINAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ 2>/dev/null)
    
    if [ "$FINAL_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Success! HTTPS is working with Let's Encrypt!${NC}"
        echo ""
        echo "Your site is now available at:"
        echo "  https://$DOMAIN/"
        echo ""
        echo "Next steps:"
        echo "1. Update apps/web/.env.production:"
        echo "   VITE_API_BASE_URL=https://$DOMAIN/api"
        echo "2. Rebuild and deploy frontend"
        echo "3. Test the application"
    else
        echo -e "${RED}Warning: HTTPS returned status $FINAL_CODE${NC}"
        echo "Check the Nginx logs for details"
    fi
else
    echo "Setup cancelled"
fi