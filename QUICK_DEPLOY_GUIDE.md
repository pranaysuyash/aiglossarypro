# Quick Deploy Guide - AIGlossaryPro EC2

## 🚀 One-Command Deployment

After making any code changes, just run:

```bash
# Deploy everything (frontend + API)
./deploy-to-ec2.sh

# Deploy only frontend changes
./deploy-to-ec2.sh frontend

# Deploy only API changes  
./deploy-to-ec2.sh api
```

That's it. No experiments, no trial and error.

---

## 📝 What Each Deployment Does

### Frontend Deployment
1. Builds locally with production config
2. Cleans any TSX/JSX references automatically
3. Uploads compiled assets to EC2
4. Deploys to `/var/www/html/`
5. Reloads Nginx

### API Deployment
1. Commits and pushes your changes to git
2. Pulls latest on EC2
3. Installs dependencies
4. Builds API
5. Restarts with PM2 (using real API, not fallback)

---

## 🔧 Manual Commands (if needed)

### SSH to EC2
```bash
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@3.89.152.227
```

### Check API logs
```bash
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@3.89.152.227 "pm2 logs --lines 50"
```

### Restart API only
```bash
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@3.89.152.227 "pm2 restart aiglossarypro-api"
```

### Check status
```bash
curl http://3.89.152.227/api/health
```

---

## ⚠️ Common Issues & Quick Fixes

### API returns 502
```bash
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@3.89.152.227 << 'EOF'
pm2 delete all
set -a && source /etc/aiglossarypro/api.env && set +a
pm2 start "node apps/api/dist/index.js" --name aiglossarypro-api
EOF
```

### Frontend shows old version
Clear browser cache or run:
```bash
./deploy-to-ec2.sh frontend
```

### Out of memory on EC2
Build locally (which the script already does).

---

## 🎯 That's It!

No more experimenting. The `deploy-to-ec2.sh` script handles everything based on what we learned. Just run it and it works.

**Live URL**: http://3.89.152.227/