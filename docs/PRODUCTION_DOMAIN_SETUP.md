# Production Domain Configuration Guide

## 🌐 Domain Setup Overview

This guide covers configuring AI Glossary Pro for production deployment at `aiglossarypro.com`.

## 🚀 Quick Setup

### 1. Environment Variables

Add these to your `.env.production`:

```bash
# Domain Configuration
NODE_ENV=production
BASE_URL=https://aiglossarypro.com
VITE_APP_URL=https://aiglossarypro.com
VITE_API_BASE_URL=https://aiglossarypro.com

# CORS Configuration
CORS_ORIGIN=https://aiglossarypro.com

# Session Configuration
SESSION_COOKIE_DOMAIN=.aiglossarypro.com
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=strict

# Security Headers
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000
```

### 2. DNS Configuration

Configure these DNS records at your domain registrar:

```
Type    Name    Value               TTL
A       @       your-server-ip      300
A       www     your-server-ip      300
CNAME   api     aiglossarypro.com   300
```

### 3. SSL Certificate

#### Option A: Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt update
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d aiglossarypro.com -d www.aiglossarypro.com

# Auto-renewal
sudo certbot renew --dry-run
```

#### Option B: Cloudflare (If using CF)
- Enable "Full (strict)" SSL mode
- Use Cloudflare's origin certificates
- Enable "Always Use HTTPS"

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/aiglossarypro.com`:

```nginx
server {
    listen 80;
    server_name aiglossarypro.com www.aiglossarypro.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aiglossarypro.com www.aiglossarypro.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/aiglossarypro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aiglossarypro.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files (if serving separately)
    location /assets {
        alias /var/www/aiglossarypro/dist/public/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API specific settings
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_read_timeout 30s;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
    }

    # Gumroad webhook endpoint
    location /api/gumroad/webhooks {
        proxy_pass http://localhost:3001/api/gumroad/webhooks;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Preserve raw body for signature verification
        proxy_set_header Content-Type $content_type;
        proxy_request_buffering off;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/aiglossarypro.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Application Configuration

#### Update server configuration:
```javascript
// server/index.ts
const app = express();

// Trust proxy (required for proper IP and protocol detection)
app.set('trust proxy', 1);

// Session configuration for production
app.use(session({
  cookie: {
    domain: process.env.SESSION_COOKIE_DOMAIN || '.aiglossarypro.com',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));
```

### 6. Firebase Configuration

Update Firebase authorized domains:
1. Go to Firebase Console → Authentication → Settings
2. Add to Authorized domains:
   - `aiglossarypro.com`
   - `www.aiglossarypro.com`

### 7. Third-Party Services

#### Google Analytics:
- Add `aiglossarypro.com` to GA4 property
- Update data stream URL

#### Gumroad:
- Update webhook URLs to `https://aiglossarypro.com/api/gumroad/webhooks/*`
- Update product URLs

#### Resend (Email):
- Verify domain `aiglossarypro.com`
- Add DNS records provided by Resend

### 8. Testing Production Domain

```bash
# Test SSL
curl -I https://aiglossarypro.com

# Test API
curl https://aiglossarypro.com/api/health

# Test WebSocket
wscat -c wss://aiglossarypro.com

# Test security headers
curl -I https://aiglossarypro.com | grep -E "(Strict-Transport|X-Frame|X-Content-Type)"
```

## 🔒 Security Checklist

- [ ] SSL certificate installed and auto-renewal configured
- [ ] HSTS enabled with preload
- [ ] Security headers configured in Nginx
- [ ] CORS properly restricted to production domain
- [ ] Session cookies marked as secure and httpOnly
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] CSP headers configured

## 🚨 Common Issues

### Mixed Content Warnings
- Ensure all resources use HTTPS
- Update any hardcoded HTTP URLs
- Check third-party scripts

### CORS Errors
- Verify `CORS_ORIGIN` matches exactly
- Check API calls use correct domain
- Ensure credentials are included

### Session Issues
- Confirm cookie domain starts with `.`
- Verify secure flag in production
- Check SameSite settings

### WebSocket Connection Failed
- Ensure Nginx proxies WebSocket upgrade
- Check WSS protocol is used
- Verify firewall allows WebSocket

## 📝 Post-Deployment

1. **Monitor logs**:
   ```bash
   tail -f /var/log/nginx/error.log
   pm2 logs ai-glossary-pro
   ```

2. **Check SSL rating**:
   - Test at [SSL Labs](https://www.ssllabs.com/ssltest/)
   - Should achieve A+ rating

3. **Verify security headers**:
   - Test at [Security Headers](https://securityheaders.com/)
   - Should achieve A rating

4. **Update monitoring**:
   - Add domain to uptime monitoring
   - Configure SSL expiry alerts
   - Set up performance monitoring

## 🎉 Success Indicators

- ✅ Site loads at https://aiglossarypro.com
- ✅ No mixed content warnings
- ✅ API endpoints respond correctly
- ✅ WebSocket connections work
- ✅ Authentication flows function
- ✅ Payment webhooks process
- ✅ Analytics tracking active
- ✅ Email delivery working

That's it! Your production domain is configured and ready for launch. 🚀