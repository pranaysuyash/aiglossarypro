# SSL & Redis Upgrade Plan - AIGlossaryPro EC2

**Created**: August 18, 2025  
**Instance**: i-045ff31e850f8b78d (52.0.112.85)  
**Current Status**: Self-signed SSL, Redis disabled  
**Target**: Let's Encrypt SSL + Redis enabled  

---

## 🎯 **UPGRADE OBJECTIVES**

1. **SSL Certificate**: Replace self-signed with Let's Encrypt
2. **Redis Integration**: Enable Redis in API to prevent deletion
3. **Domain Setup**: Configure proper domain for SSL
4. **Rollback Safety**: Document every change for quick revert

---

## 📸 **CURRENT STATE BACKUP**

### **Pre-Upgrade Configuration Snapshot**

#### **Current Nginx Config**
```bash
# Backup current nginx config
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@52.0.112.85 \
  "sudo cp /etc/nginx/nginx.conf /home/ec2-user/backups/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)"
```

#### **Current Environment Variables**
```bash
# Backup current API environment
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@52.0.112.85 \
  "sudo cp /etc/aiglossarypro/api.env /home/ec2-user/backups/api.env.backup.$(date +%Y%m%d_%H%M%S)"
```

#### **Current PM2 Status**
```bash
# Document running processes
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@52.0.112.85 \
  "pm2 jlist > /home/ec2-user/backups/pm2.status.$(date +%Y%m%d_%H%M%S).json"
```

#### **Current SSL Certificates**
```bash
# Backup self-signed certificates
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@52.0.112.85 \
  "sudo tar czf /home/ec2-user/backups/ssl.backup.$(date +%Y%m%d_%H%M%S).tgz /etc/ssl/private/ /etc/ssl/certs/ 2>/dev/null || true"
```

---

## 🚀 **UPGRADE PHASE 1: DOMAIN & DNS SETUP**

### **Option A: Use Existing Domain (Recommended)**
If you own `aiglossary.com`:
```bash
# Set DNS A record in your domain registrar
test.aiglossary.com    A    52.0.112.85    (TTL: 300)
```

### **Option B: Use Free Domain Service**
If you don't have a domain:
```bash
# Use services like:
# - DuckDNS (free)  
# - No-IP (free)
# - Freenom (free .tk/.ml domains)

# Example with DuckDNS:
yourname.duckdns.org    →    52.0.112.85
```

### **Option C: AWS Route 53 (Costs $0.50/month)**
```bash
# Create hosted zone
aws route53 create-hosted-zone \
    --name test-aiglossary.com \
    --caller-reference $(date +%s)

# Add A record
aws route53 change-resource-record-sets \
    --hosted-zone-id ZXXXXXXXXXXXXX \
    --change-batch file://dns-record.json
```

**DNS Record JSON** (`dns-record.json`):
```json
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "test-aiglossary.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "52.0.112.85"}]
    }
  }]
}
```

---

## 🔒 **UPGRADE PHASE 2: SSL CERTIFICATE**

### **Step 1: Prepare SSL Upgrade Script**
```bash
# Create SSL upgrade script
cat > ssl-upgrade.sh << 'EOF'
#!/bin/bash
set -e

DOMAIN="$1"
BACKUP_DIR="/home/ec2-user/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔒 Starting SSL upgrade for domain: $DOMAIN"

# 1. Install Certbot
sudo yum update -y
sudo yum install -y certbot python3-certbot-nginx

# 2. Backup current nginx config
sudo cp /etc/nginx/nginx.conf $BACKUP_DIR/nginx.conf.pre-ssl.$TIMESTAMP

# 3. Stop nginx temporarily
sudo systemctl stop nginx

# 4. Get Let's Encrypt certificate
sudo certbot certonly --standalone \
    -d $DOMAIN \
    --agree-tos \
    --email pranay.suyash@gmail.com \
    --non-interactive

# 5. Update nginx config for SSL
sudo tee /etc/nginx/nginx.conf > /dev/null << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name DOMAIN_PLACEHOLDER;
        return 301 https://$server_name$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name DOMAIN_PLACEHOLDER;
        
        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        
        # Frontend
        location / {
            root /var/www/html;
            try_files $uri $uri/ /index.html;
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
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    }
}
NGINX_EOF

# 6. Replace domain placeholder
sudo sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/nginx.conf

# 7. Test nginx config
sudo nginx -t

# 8. Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 9. Setup auto-renewal
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer

echo "✅ SSL upgrade complete for $DOMAIN"
echo "🌐 Site now available at: https://$DOMAIN"
EOF

chmod +x ssl-upgrade.sh
```

---

## ⚡ **UPGRADE PHASE 3: REDIS ENABLEMENT**

### **Step 1: Create Redis Upgrade Script**
```bash
# Create Redis upgrade script
cat > redis-upgrade.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/home/ec2-user/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "⚡ Starting Redis integration..."

# 1. Backup current environment
sudo cp /etc/aiglossarypro/api.env $BACKUP_DIR/api.env.pre-redis.$TIMESTAMP

# 2. Add Redis configuration
sudo tee -a /etc/aiglossarypro/api.env > /dev/null << 'ENV_EOF'

# Redis Configuration
REDIS_ENABLED=true
REDIS_URL=https://communal-hawk-12289.upstash.io
UPSTASH_REDIS_REST_TOKEN=ATABAAIjcDE0NmIzNGIyMzM5Yjk0ODU3YTg0ZDQ0NDkzMjFjMTI3NnAxMA
ENABLE_REDIS_CACHE=true
REDIS_CACHE_TTL=3600
REDIS_CACHE_PREFIX=aiglossary:

ENV_EOF

# 3. Restart API with new environment
pm2 reload aiglossarypro-api --update-env

# 4. Test Redis connection
sleep 5
node -e "
const redis = require('ioredis');
const client = new redis(process.env.REDIS_URL, {
  headers: { Authorization: 'Bearer ' + process.env.UPSTASH_REDIS_REST_TOKEN }
});
client.ping().then(() => {
  console.log('✅ Redis connection successful');
  process.exit(0);
}).catch(err => {
  console.error('❌ Redis connection failed:', err.message);
  process.exit(1);
});
"

echo "✅ Redis integration complete"
EOF

chmod +x redis-upgrade.sh
```

---

## 🔙 **ROLLBACK PROCEDURES**

### **Complete Rollback Script**
```bash
# Create comprehensive rollback script
cat > rollback.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/home/ec2-user/backups"
ROLLBACK_DATE="$1"

if [ -z "$ROLLBACK_DATE" ]; then
    echo "Usage: ./rollback.sh YYYYMMDD_HHMMSS"
    echo "Available backups:"
    ls -la $BACKUP_DIR/ | grep backup
    exit 1
fi

echo "🔙 Rolling back to state: $ROLLBACK_DATE"

# 1. Stop services
sudo systemctl stop nginx
pm2 stop all

# 2. Restore nginx config
if [ -f "$BACKUP_DIR/nginx.conf.backup.$ROLLBACK_DATE" ]; then
    sudo cp "$BACKUP_DIR/nginx.conf.backup.$ROLLBACK_DATE" /etc/nginx/nginx.conf
    echo "✅ Nginx config restored"
else
    echo "❌ Nginx backup not found for $ROLLBACK_DATE"
fi

# 3. Restore API environment
if [ -f "$BACKUP_DIR/api.env.backup.$ROLLBACK_DATE" ]; then
    sudo cp "$BACKUP_DIR/api.env.backup.$ROLLBACK_DATE" /etc/aiglossarypro/api.env
    echo "✅ API environment restored"
else
    echo "❌ API env backup not found for $ROLLBACK_DATE"
fi

# 4. Restore SSL certificates (if needed)
if [ -f "$BACKUP_DIR/ssl.backup.$ROLLBACK_DATE.tgz" ]; then
    sudo tar xzf "$BACKUP_DIR/ssl.backup.$ROLLBACK_DATE.tgz" -C /
    echo "✅ SSL certificates restored"
fi

# 5. Remove Let's Encrypt certificates (if present)
if [ -d "/etc/letsencrypt" ]; then
    sudo rm -rf /etc/letsencrypt
    echo "✅ Let's Encrypt certificates removed"
fi

# 6. Test nginx config
sudo nginx -t

# 7. Restart services
sudo systemctl start nginx
pm2 restart all

echo "✅ Rollback complete"
echo "🌐 Site status:"
curl -I http://52.0.112.85/ || echo "❌ HTTP check failed"
curl -I http://52.0.112.85/api/health || echo "❌ API check failed"
EOF

chmod +x rollback.sh
```

---

## 📋 **EXECUTION CHECKLIST**

### **Pre-Upgrade Checks**
- [ ] Backup current state
- [ ] Verify domain DNS propagation
- [ ] Confirm Redis credentials
- [ ] Test current site functionality

### **Upgrade Execution**
- [ ] Upload scripts to EC2
- [ ] Execute domain setup
- [ ] Run SSL upgrade
- [ ] Run Redis upgrade
- [ ] Verify all services

### **Post-Upgrade Validation**
- [ ] Test HTTPS access
- [ ] Verify API functionality
- [ ] Confirm Redis connectivity
- [ ] Check auto-renewal setup

---

## 🚨 **EMERGENCY CONTACTS & RECOVERY**

### **If Upgrade Fails:**
1. **SSH Access**: `ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@52.0.112.85`
2. **Quick Rollback**: `./rollback.sh [TIMESTAMP]`
3. **Service Check**: `sudo systemctl status nginx && pm2 status`
4. **Logs**: `sudo tail -f /var/log/nginx/error.log && pm2 logs`

### **Critical Backup Locations:**
- **Scripts**: `/home/ec2-user/` 
- **Configs**: `/home/ec2-user/backups/`
- **SSL**: `/etc/letsencrypt/` (after upgrade)
- **Logs**: `/var/log/nginx/` and `pm2 logs`

---

## 💰 **COST IMPLICATIONS**

### **Current Cost**: ~$15-20/month
- EC2 t3.small: $15/month
- Elastic IP: Free

### **After Upgrade**: ~$15-20/month  
- No additional SSL costs (Let's Encrypt is free)
- Redis: Already paid for Upstash
- Domain: Only if you buy one ($10-15/year)

---

## 🎯 **NEXT STEPS**

1. **Choose Domain Strategy** (A, B, or C above)
2. **Upload scripts to EC2**
3. **Execute upgrade in phases**
4. **Test thoroughly**
5. **Document any issues**

**Ready to proceed when you confirm the domain strategy!**