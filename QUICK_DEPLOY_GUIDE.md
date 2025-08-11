# Quick Deploy Guide - AIGlossaryPro EC2

## 🔐 Initial Setup (One Time)

### 1. Create your Firebase config file
```bash
# Create apps/web/.env.production with YOUR Firebase keys (never commit this!)
cat > apps/web/.env.production << 'EOF'
VITE_API_BASE_URL=http://3.89.152.227/api
VITE_FIREBASE_API_KEY=your-actual-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
EOF
```

### 2. Add to .gitignore
```bash
echo "apps/web/.env.production" >> .gitignore
```

---

## 🚀 Deployment Commands

After making code changes:

```bash
# Get current EC2 IP (changes when instance restarts)
EC2_IP=$(aws ec2 describe-instances --instance-ids i-045ff31e850f8b78d --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "Current EC2 IP: $EC2_IP"

# Deploy everything (frontend + API)
EC2_IP=$EC2_IP SSH_KEY=~/.ssh/aiglossarypro-ec2.pem ./deploy-to-ec2.sh

# Deploy only frontend changes
EC2_IP=$EC2_IP SSH_KEY=~/.ssh/aiglossarypro-ec2.pem ./deploy-to-ec2.sh frontend

# Deploy only API changes  
EC2_IP=$EC2_IP SSH_KEY=~/.ssh/aiglossarypro-ec2.pem ./deploy-to-ec2.sh api
```

Or export the variables once per session:
```bash
export EC2_IP=$(aws ec2 describe-instances --instance-ids i-045ff31e850f8b78d --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
export SSH_KEY=~/.ssh/aiglossarypro-ec2.pem
echo "Using EC2 IP: $EC2_IP"

# Then just run:
./deploy-to-ec2.sh
```

---

## ✅ What the Script Does

### Security Features
- ❌ NO hardcoded secrets in the script
- ✅ Requires .env.production to exist (won't create it)
- ✅ Warns about uncommitted changes
- ✅ Creates swap space automatically on EC2
- ✅ Verifies PM2 runs the real API (not fallback)
- ✅ 4 verification gates after deployment

### Frontend Deployment
1. Checks .env.production exists (fails if missing)
2. Builds locally with production config
3. Auto-detects build output directory
4. Uploads compiled assets to EC2
5. Deploys to `/var/www/html/`
6. Reloads Nginx

### API Deployment
1. Warns if uncommitted changes exist
2. Creates swap if needed (4GB for t3.small)
3. Pulls latest from git
4. Builds API only (not full monorepo)
5. Installs production deps for API only
6. Verifies `apps/api/dist/index.js` exists
7. Restarts with PM2 using real API
8. Runs health checks

### Verification Gates
1. **Gate 1**: PM2 running real API from `apps/api/dist/index.js`
2. **Gate 2**: API health endpoint returns 200
3. **Gate 3**: Frontend assets load correctly
4. **Gate 4**: API returns actual data

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

### Emergency API restart (with verification)
```bash
ssh -i ~/.ssh/aiglossarypro-ec2.pem ec2-user@3.89.152.227 << 'EOF'
pm2 delete all
set -a && source /etc/aiglossarypro/api.env && set +a
pm2 start "node apps/api/dist/index.js" --name aiglossarypro-api
pm2 describe aiglossarypro-api | grep "apps/api/dist/index.js"
EOF
```

---

## ⚠️ Important Notes

1. **Never commit .env.production** - it contains real Firebase keys
2. **Always set EC2_IP and SSH_KEY** - script won't run without them
3. **Commit your changes first** - script will warn about uncommitted files
4. **Build happens locally** - avoids EC2 memory issues
5. **No TSX hacks needed** - proper Vite config handles everything

---

## 🎯 That's It!

The script is now secure and reliable. No experiments, no hardcoded secrets, proper verification gates.

**Live URL**: http://54.159.81.177/ (Current as of Aug 11, 2025)

> **Note**: EC2 public IP changes when instance stops/starts. Use the AWS command above to get current IP, or consider setting up an Elastic IP for a permanent address.