# Single EC2 Full Stack Deployment Guide

**Last Updated**: August 10, 2025  
**Purpose**: Lowest cost deployment - Frontend + API on single EC2 with Nginx

## 💰 Cost Comparison

| Architecture | Monthly Cost | Components |
|--------------|-------------|------------|
| **Previous (Multi-Service)** | ~$41.13 | ECS ($18) + ALB ($22) + CloudFront ($0.50) + S3 ($0.10) |
| **New (Single EC2)** | ~$15-30 | EC2 t3.small ($15) or t3.medium ($30) + Elastic IP ($3.60) |
| **Savings** | **~$11-26/month** | 27-63% cost reduction |

## 🏗️ Architecture Overview

```
Internet
    ↓
Route53 (aiglossarypro.com)
    ↓
EC2 Instance (Elastic IP)
    ├── Nginx (Port 80/443)
    │   ├── / → React Frontend (/var/www/aiglossarypro)
    │   └── /api/* → Proxy to localhost:8080
    └── Docker Container (Port 8080)
        └── Node.js API (pulls from ECR)
```

## 🚀 Quick Start

### 1. Launch EC2 Instance

**Via AWS Console:**
- **AMI**: Amazon Linux 2023
- **Instance Type**: t3.small (2GB RAM) or t3.medium (4GB RAM)
- **Network**:
  - VPC: Default or your existing VPC
  - Subnet: Public subnet
  - Auto-assign public IP: **Disable** (we'll use Elastic IP)
- **Security Group**:
  - Port 22 (SSH) from your IP
  - Port 80 (HTTP) from 0.0.0.0/0
  - Port 443 (HTTPS) from 0.0.0.0/0
- **IAM Role**: Create with policies:
  - `AmazonEC2ContainerRegistryReadOnly`
  - Custom policy for Secrets Manager:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/*"
  }]
}
```
- **Storage**: 20GB gp3
- **Tags**: Name=aiglossarypro-fullstack

### 2. Allocate Elastic IP

```bash
# Allocate Elastic IP
ALLOCATION_ID=$(aws ec2 allocate-address --domain vpc --region us-east-1 --query 'AllocationId' --output text)
echo "Allocated Elastic IP: $ALLOCATION_ID"

# Associate with instance
aws ec2 associate-address --instance-id $INSTANCE_ID --allocation-id $ALLOCATION_ID --region us-east-1

# Get the public IP
ELASTIC_IP=$(aws ec2 describe-addresses --allocation-ids $ALLOCATION_ID --region us-east-1 --query 'Addresses[0].PublicIp' --output text)
echo "Elastic IP: $ELASTIC_IP"
```

### 3. Update Route53

Point your domain to the Elastic IP:

```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='aiglossarypro.com.'].Id" --output text | cut -d'/' -f3)

# Create/update A record
cat > /tmp/route53-record.json << EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "aiglossarypro.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "$ELASTIC_IP"}]
    }
  }]
}
EOF

aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch file:///tmp/route53-record.json
```

### 4. SSH into EC2 and Run Setup

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@$ELASTIC_IP

# Download and run setup script
curl -O https://raw.githubusercontent.com/pranaysuyash/aiglossarypro/main/scripts/ec2-full-stack-setup.sh
chmod +x ec2-full-stack-setup.sh

# Set your domain and email
export DOMAIN=aiglossarypro.com
export EMAIL=admin@aiglossarypro.com

# Run setup (will install Nginx, build frontend, setup SSL, start API)
sudo ./ec2-full-stack-setup.sh
```

## 📝 Manual Setup Steps

If the automated script fails, here are the manual steps:

### Install Dependencies

```bash
# Update system
sudo yum update -y

# Install Nginx
sudo yum install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install Docker
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -a -G docker ec2-user

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install pnpm
sudo npm install -g pnpm@9.15.1
```

### Build and Deploy Frontend

```bash
# Clone repository
cd /tmp
git clone https://github.com/pranaysuyash/aiglossarypro.git
cd aiglossarypro

# Install and build
pnpm install --frozen-lockfile
pnpm -F @aiglossarypro/web build

# Deploy to Nginx
sudo mkdir -p /var/www/aiglossarypro
sudo cp -r apps/frontend/dist/* /var/www/aiglossarypro/
sudo chown -R nginx:nginx /var/www/aiglossarypro
```

### Configure Nginx

```bash
sudo cat > /etc/nginx/conf.d/aiglossarypro.conf << 'EOF'
server {
    listen 80;
    server_name aiglossarypro.com www.aiglossarypro.com;
    
    root /var/www/aiglossarypro;
    index index.html;
    
    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:8080/health;
    }
    
    # React SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
EOF

sudo nginx -t
sudo systemctl reload nginx
```

### Setup SSL with Let's Encrypt

```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d aiglossarypro.com -d www.aiglossarypro.com \
  --non-interactive --agree-tos --email admin@aiglossarypro.com --redirect

# Setup auto-renewal
echo "0 0,12 * * * root certbot renew --quiet" | sudo tee /etc/cron.d/certbot
```

### Start API Container

```bash
# Setup environment
export AWS_REGION=us-east-1
export ACCOUNT_ID=927289246324
export ECR_REPO=aiglossarypro-api
export DATABASE_URL_ARN=arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/database
export SESSION_SECRET_ARN=arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/session
export JWT_SECRET_ARN=arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/jwt

# Run the API start script
cd ~
curl -O https://raw.githubusercontent.com/pranaysuyash/aiglossarypro/main/scripts/ec2-start-api.sh
chmod +x ec2-start-api.sh
./ec2-start-api.sh
```

## 🧹 Clean Up Old Resources

After verifying the new setup works:

```bash
# Download cleanup script
curl -O https://raw.githubusercontent.com/pranaysuyash/aiglossarypro/main/scripts/cleanup-aws-resources.sh
chmod +x cleanup-aws-resources.sh

# Dry run first (shows what will be deleted)
./cleanup-aws-resources.sh

# Actually delete resources
DRY_RUN=0 ./cleanup-aws-resources.sh
```

This will delete:
- ❌ Application Load Balancer (~$22.27/month)
- ❌ CloudFront Distribution (~$0.50/month)
- ❌ S3 Static Website Bucket (~$0.10/month)
- ❌ All associated Target Groups

## 🔧 Management Commands

### On EC2 Instance

```bash
# Check status
./check-status.sh

# Update frontend
./update-frontend.sh

# View logs
docker logs -f api                    # API logs
sudo tail -f /var/log/nginx/access.log # Nginx access logs
sudo tail -f /var/log/nginx/error.log  # Nginx error logs

# Restart services
docker restart api                     # Restart API
sudo systemctl restart nginx          # Restart Nginx

# Update API (pull latest from ECR)
docker stop api && docker rm api
./ec2-start-api.sh
```

### Cost Management

```bash
# Stop instance when not needed (saves ~$0.50/day)
aws ec2 stop-instances --instance-ids $INSTANCE_ID --region us-east-1

# Start instance when needed
aws ec2 start-instances --instance-ids $INSTANCE_ID --region us-east-1

# Check instance state
aws ec2 describe-instances --instance-ids $INSTANCE_ID --region us-east-1 \
  --query 'Reservations[0].Instances[0].State.Name' --output text
```

## ✅ Verification

After setup, verify everything works:

```bash
# From your local machine
curl -s https://aiglossarypro.com/health | jq .
curl -s https://aiglossarypro.com/api/health | jq .
curl -s "https://aiglossarypro.com/api/terms?limit=1" | jq .

# Check SSL certificate
curl -vI https://aiglossarypro.com 2>&1 | grep "SSL certificate verify ok"
```

## 🚨 Troubleshooting

### Frontend shows but API returns 502

- Check if API container is running: `docker ps`
- Check API logs: `docker logs api`
- Verify Nginx can reach API: `curl http://localhost:8080/health`
- Check Nginx error log: `sudo tail -f /var/log/nginx/error.log`

### SSL certificate issues

- Check certificate status: `sudo certbot certificates`
- Renew manually: `sudo certbot renew`
- Check Nginx SSL config: `sudo nginx -t`

### High memory usage

- Check memory: `free -h`
- Restart API: `docker restart api`
- Consider upgrading to t3.medium if consistently high

### Domain not resolving

- Check Route53 record: `nslookup aiglossarypro.com`
- Verify Elastic IP association: `aws ec2 describe-addresses`
- Wait for DNS propagation (can take up to 48 hours)

## 📈 Scaling Path

When traffic grows, you can gradually add:

1. **Stage 1**: Current single EC2 (handles ~100 concurrent users)
2. **Stage 2**: Add CloudFront CDN for static assets (~$5/month)
3. **Stage 3**: Add second EC2 + ALB for high availability (~$40/month)
4. **Stage 4**: Return to ECS Fargate for auto-scaling (~$50+/month)

## 🎯 Current Setup Benefits

- ✅ **63% cost reduction** compared to multi-service architecture
- ✅ **Single point of management** - one EC2 instance
- ✅ **Free SSL certificates** via Let's Encrypt
- ✅ **No vendor lock-in** - standard Nginx + Docker
- ✅ **Easy backup** - single instance snapshots
- ✅ **Quick updates** - pull from ECR, rebuild frontend

---

**This single-EC2 deployment provides the lowest cost production setup while maintaining professional features like SSL, custom domain, and containerized deployment.**