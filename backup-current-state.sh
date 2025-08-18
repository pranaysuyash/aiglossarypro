#!/bin/bash
# Backup Current EC2 State Before SSL/Redis Upgrade
# Run this script BEFORE making any changes

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_BACKUP_DIR="./backups/pre-upgrade-$TIMESTAMP"
EC2_USER="ec2-user"
EC2_IP="52.0.112.85"
SSH_KEY="~/.ssh/aiglossarypro-ec2.pem"

echo "🔄 Creating complete backup of EC2 state..."
echo "📅 Timestamp: $TIMESTAMP"

# Create local backup directory
mkdir -p "$LOCAL_BACKUP_DIR"

echo "1️⃣ Creating backup directory on EC2..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "mkdir -p /home/ec2-user/backups"

echo "2️⃣ Backing up Nginx configuration..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "sudo cp /etc/nginx/nginx.conf /home/ec2-user/backups/nginx.conf.backup.$TIMESTAMP"

echo "3️⃣ Backing up API environment..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "sudo cp /etc/aiglossarypro/api.env /home/ec2-user/backups/api.env.backup.$TIMESTAMP"

echo "4️⃣ Backing up PM2 configuration..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "pm2 jlist > /home/ec2-user/backups/pm2.status.$TIMESTAMP.json"

echo "5️⃣ Backing up SSL certificates..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "sudo tar czf /home/ec2-user/backups/ssl.backup.$TIMESTAMP.tgz /etc/ssl/private/ /etc/ssl/certs/ 2>/dev/null || true"

echo "6️⃣ Testing current services..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "curl -s -k https://127.0.0.1/api/health > /home/ec2-user/backups/api.health.$TIMESTAMP.json || echo 'API_FAILED' > /home/ec2-user/backups/api.health.$TIMESTAMP.json"

echo "7️⃣ Downloading backups locally..."
scp -o StrictHostKeyChecking=no -i "$SSH_KEY" -r \
    "$EC2_USER@$EC2_IP:/home/ec2-user/backups/*.$TIMESTAMP*" "$LOCAL_BACKUP_DIR/"

echo "8️⃣ Creating system snapshot..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "sudo systemctl status nginx > /home/ec2-user/backups/nginx.status.$TIMESTAMP.txt 2>&1 || true"

ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "pm2 status > /home/ec2-user/backups/pm2.status.$TIMESTAMP.txt 2>&1 || true"

ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "df -h > /home/ec2-user/backups/disk.status.$TIMESTAMP.txt 2>&1 || true"

ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
    "free -h > /home/ec2-user/backups/memory.status.$TIMESTAMP.txt 2>&1 || true"

# Download status files
scp -o StrictHostKeyChecking=no -i "$SSH_KEY" \
    "$EC2_USER@$EC2_IP:/home/ec2-user/backups/*.status.$TIMESTAMP.txt" "$LOCAL_BACKUP_DIR/"

echo "✅ Backup complete!"
echo "📁 Local backup location: $LOCAL_BACKUP_DIR"
echo "📁 EC2 backup location: /home/ec2-user/backups/"
echo ""
echo "🔍 Backup contents:"
ls -la "$LOCAL_BACKUP_DIR/"
echo ""
echo "🚨 IMPORTANT: Keep this backup safe!"
echo "   Use timestamp $TIMESTAMP for rollback if needed"
echo ""
echo "📝 Current system status:"
echo "   - Testing API health..."
curl -s -k "https://52.0.112.85/api/health" && echo " ✅ API working" || echo " ❌ API failed"
echo "   - Testing frontend..."
curl -s -I -k "https://52.0.112.85/" | head -1 && echo " ✅ Frontend working" || echo " ❌ Frontend failed"

echo ""
echo "🎯 Ready for upgrade! Use timestamp: $TIMESTAMP"