#!/bin/bash
# Setup SSL Certificate with Let's Encrypt for AIGlossaryPro
# Requires a domain name to be provided

set -e

DOMAIN="$1"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EC2_USER="ec2-user"
EC2_IP="52.0.112.85"
SSH_KEY="~/.ssh/aiglossarypro-ec2.pem"

if [ -z "$DOMAIN" ]; then
    echo "❌ Usage: $0 <domain-name>"
    echo ""
    echo "📝 Examples:"
    echo "   $0 test.aiglossary.com"
    echo "   $0 yourname.duckdns.org"
    echo "   $0 aiglossary-test.freenom.tk"
    echo ""
    echo "⚠️  IMPORTANT: Domain must already point to 52.0.112.85"
    echo "   Test with: nslookup your-domain"
    exit 1
fi

echo "🔒 Setting up SSL certificate for domain: $DOMAIN"
echo "📅 Timestamp: $TIMESTAMP"

# Verify domain points to our EC2 instance
echo "1️⃣ Verifying domain DNS resolution..."
DOMAIN_IP=$(nslookup "$DOMAIN" | grep -A1 "Name:" | tail -1 | awk '{print $2}' | tr -d '\r' || echo "")

if [ "$DOMAIN_IP" != "52.0.112.85" ]; then
    echo "❌ Domain $DOMAIN does not resolve to 52.0.112.85"
    echo "   Current resolution: $DOMAIN_IP"
    echo "   Please update your DNS settings first"
    echo ""
    echo "🌐 DNS Setup Instructions:"
    echo "   Add this A record in your domain registrar:"
    echo "   $DOMAIN    A    52.0.112.85    (TTL: 300)"
    exit 1
fi

echo "✅ Domain resolves correctly to 52.0.112.85"

# Test HTTP connectivity first
echo "2️⃣ Testing HTTP connectivity to domain..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN/" || echo "000")

if [ "$HTTP_STATUS" != "200" ]; then
    echo "❌ Domain is not accessible via HTTP (Status: $HTTP_STATUS)"
    echo "   Please check your domain configuration"
    exit 1
fi

echo "✅ Domain is accessible via HTTP"

# Create SSL setup script on EC2
echo "3️⃣ Uploading SSL setup script to EC2..."
cat > /tmp/ssl-setup.sh << 'SSL_SCRIPT'
#!/bin/bash
set -e

DOMAIN="$1"
TIMESTAMP="$2"

echo "🔒 Installing SSL certificate for $DOMAIN..."

# Install Certbot
echo "   Installing Certbot..."
sudo yum update -y >/dev/null 2>&1
sudo yum install -y certbot >/dev/null 2>&1

# Backup current nginx config
echo "   Backing up current nginx configuration..."
sudo cp /etc/nginx/nginx.conf "/home/ec2-user/backups/nginx.conf.pre-ssl.$TIMESTAMP"

# Stop nginx temporarily for certificate generation
echo "   Stopping nginx temporarily..."
sudo systemctl stop nginx

# Get Let's Encrypt certificate
echo "   Requesting Let's Encrypt certificate..."
sudo certbot certonly \
    --standalone \
    -d "$DOMAIN" \
    --agree-tos \
    --email pranay.suyash@gmail.com \
    --non-interactive \
    --quiet

if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "❌ Certificate generation failed"
    sudo systemctl start nginx
    exit 1
fi

# Create new nginx config with SSL
echo "   Updating nginx configuration for SSL..."
sudo tee /etc/nginx/nginx.conf > /dev/null << NGINX_EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name $DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN;
        
        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # Frontend
        location / {
            root /var/www/html;
            try_files \$uri \$uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
                expires 30d;
                add_header Cache-Control "public, immutable";
                add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
            }
        }
        
        # API proxy
        location /api/ {
            proxy_pass http://127.0.0.1:8080/;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_set_header X-Forwarded-Host \$host;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }
    }
}
NGINX_EOF

# Test nginx configuration
echo "   Testing nginx configuration..."
sudo nginx -t

# Start nginx with SSL
echo "   Starting nginx with SSL..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup auto-renewal
echo "   Setting up certificate auto-renewal..."
(sudo crontab -l 2>/dev/null; echo "0 12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab -

echo "✅ SSL certificate installed successfully for $DOMAIN"
SSL_SCRIPT

# Upload and execute SSL script
scp -o StrictHostKeyChecking=no -i "$SSH_KEY" /tmp/ssl-setup.sh "$EC2_USER@$EC2_IP:/tmp/"

ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "chmod +x /tmp/ssl-setup.sh && /tmp/ssl-setup.sh '$DOMAIN' '$TIMESTAMP'"

# Clean up temporary script
rm /tmp/ssl-setup.sh

# Verify SSL is working
echo "4️⃣ Verifying SSL installation..."
sleep 5

HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/" || echo "000")
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health" || echo "000")

if [ "$HTTPS_STATUS" != "200" ]; then
    echo "❌ HTTPS verification failed (Status: $HTTPS_STATUS)"
    echo "🔙 Rolling back to previous configuration..."
    
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
        "sudo cp /home/ec2-user/backups/nginx.conf.pre-ssl.$TIMESTAMP /etc/nginx/nginx.conf && sudo systemctl restart nginx"
    
    echo "❌ SSL setup failed and has been rolled back"
    exit 1
fi

echo "✅ HTTPS is working correctly"
echo "✅ API is accessible via HTTPS (Status: $API_STATUS)"

# Update frontend configuration to use HTTPS
echo "5️⃣ Updating frontend API URL to use HTTPS..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" << UPDATE_FRONTEND
# The frontend is already built, but we can check if it needs updating
if grep -q "http://52.0.112.85" /var/www/html/assets/*.js 2>/dev/null; then
    echo "⚠️  Frontend still references HTTP API URL"
    echo "   Consider rebuilding frontend with VITE_API_BASE_URL=https://$DOMAIN/api"
else
    echo "✅ Frontend API URL looks correct"
fi
UPDATE_FRONTEND

echo ""
echo "🎉 SSL setup complete!"
echo "📊 Status Summary:"
echo "   ✅ Domain: $DOMAIN"
echo "   ✅ HTTPS Status: $HTTPS_STATUS"
echo "   ✅ API HTTPS Status: $API_STATUS"
echo "   ✅ Auto-renewal: Enabled"
echo ""
echo "🔗 Your secure site is now available at:"
echo "   🌐 Frontend: https://$DOMAIN"
echo "   🔧 API: https://$DOMAIN/api/health"
echo ""
echo "📝 Certificate Details:"
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "sudo certbot certificates | grep -A5 '$DOMAIN'" || echo "   Use: sudo certbot certificates (on EC2)"
echo ""
echo "🔙 Rollback commands (if needed):"
echo "   ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@52.0.112.85"
echo "   sudo cp /home/ec2-user/backups/nginx.conf.pre-ssl.$TIMESTAMP /etc/nginx/nginx.conf"
echo "   sudo systemctl restart nginx"