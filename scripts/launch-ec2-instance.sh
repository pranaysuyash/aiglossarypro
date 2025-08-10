#!/bin/bash
set -euo pipefail

# Launch EC2 Instance for AIGlossaryPro
# This script launches a new EC2 instance configured for the full-stack deployment

echo "🚀 Launching EC2 Instance for AIGlossaryPro..."

# Configuration
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.small}"
REGION="${AWS_REGION:-us-east-1}"
AMI_ID="${AMI_ID:-}"  # Will be auto-detected if not set
KEY_NAME="${KEY_NAME:-aiglossarypro-ec2}"
SECURITY_GROUP_NAME="AIGlossaryPro-EC2-SG"

# Get latest Amazon Linux 2023 AMI if not specified
if [ -z "$AMI_ID" ]; then
    echo "Finding latest Amazon Linux 2023 AMI..."
    AMI_ID=$(aws ec2 describe-images \
        --owners amazon \
        --filters \
            "Name=name,Values=al2023-ami-*-x86_64" \
            "Name=state,Values=available" \
        --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" \
        --output text)
    echo "Found AMI: $AMI_ID"
fi

# Create or verify key pair
echo "Checking for key pair: $KEY_NAME..."
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" 2>/dev/null; then
    echo "Creating key pair..."
    aws ec2 create-key-pair --key-name "$KEY_NAME" \
        --query 'KeyMaterial' --output text > ~/.ssh/${KEY_NAME}.pem
    chmod 600 ~/.ssh/${KEY_NAME}.pem
    echo "✅ Key pair created at ~/.ssh/${KEY_NAME}.pem"
else
    echo "✅ Key pair exists"
fi

# Create or update security group
echo "Setting up security group..."
SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
    --query "SecurityGroups[0].GroupId" \
    --output text 2>/dev/null || echo "")

if [ "$SG_ID" == "" ] || [ "$SG_ID" == "None" ]; then
    echo "Creating security group..."
    SG_ID=$(aws ec2 create-security-group \
        --group-name "$SECURITY_GROUP_NAME" \
        --description "Security group for AIGlossaryPro EC2 instance" \
        --query 'GroupId' --output text)
    
    # Add rules
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
        --protocol tcp --port 22 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
        --protocol tcp --port 80 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
        --protocol tcp --port 443 --cidr 0.0.0.0/0
    aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
        --protocol tcp --port 3001 --cidr 0.0.0.0/0
    
    echo "✅ Security group created: $SG_ID"
else
    echo "✅ Security group exists: $SG_ID"
fi

# Create IAM role for EC2 (if doesn't exist)
ROLE_NAME="AIGlossaryPro-EC2-Role"
echo "Setting up IAM role..."
if ! aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null; then
    # Create trust policy
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    
    # Create role
    aws iam create-role --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json
    
    # Attach policies
    aws iam attach-role-policy --role-name "$ROLE_NAME" \
        --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
    aws iam attach-role-policy --role-name "$ROLE_NAME" \
        --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
    aws iam attach-role-policy --role-name "$ROLE_NAME" \
        --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
    
    # Create instance profile
    aws iam create-instance-profile --instance-profile-name "$ROLE_NAME"
    aws iam add-role-to-instance-profile \
        --instance-profile-name "$ROLE_NAME" \
        --role-name "$ROLE_NAME"
    
    echo "✅ IAM role created"
    echo "Waiting for IAM role to propagate..."
    sleep 10
else
    echo "✅ IAM role exists"
fi

# User data script for initial setup
cat > /tmp/user-data.sh <<'EOF'
#!/bin/bash
# Update system
dnf update -y

# Install Docker
dnf install -y docker git
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx
dnf install -y nginx
systemctl enable nginx

# Install Node.js
dnf install -y nodejs npm

# Install AWS CLI (should be pre-installed on AL2023)
dnf install -y aws-cli

# Create app directory
mkdir -p /home/ec2-user/aiglossarypro
chown ec2-user:ec2-user /home/ec2-user/aiglossarypro

# Add helpful aliases
echo "alias ll='ls -la'" >> /home/ec2-user/.bashrc
echo "alias docker-ps='docker ps --format \"table {{.Names}}\t{{.Status}}\t{{.Ports}}\"'" >> /home/ec2-user/.bashrc
echo "cd /home/ec2-user/aiglossarypro" >> /home/ec2-user/.bashrc
EOF

# Launch instance
echo "Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --iam-instance-profile Name="$ROLE_NAME" \
    --user-data file:///tmp/user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=AIGlossaryPro-Server},{Key=Environment,Value=Production},{Key=Project,Value=AIGlossaryPro}]" \
    --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=20,VolumeType=gp3}" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "✅ Instance launched: $INSTANCE_ID"
echo "Waiting for instance to be running..."

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"

# Get instance details
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo ""
echo "===================================="
echo "✅ EC2 INSTANCE LAUNCHED SUCCESSFULLY"
echo "===================================="
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "Instance Type: $INSTANCE_TYPE"
echo "Key Pair: $KEY_NAME"
echo "Security Group: $SG_ID"
echo ""
echo "📝 Next Steps:"
echo "1. Wait 2-3 minutes for instance initialization"
echo "2. SSH to instance: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo "3. Run deployment script on the instance"
echo ""
echo "💾 Save these details to ~/.aiglossarypro/config:"
echo "INSTANCE_ID=$INSTANCE_ID"
echo "ELASTIC_IP=$PUBLIC_IP"
echo "KEY_PATH=~/.ssh/${KEY_NAME}.pem"
echo "SSH_USER=ec2-user"

# Create config file
mkdir -p ~/.aiglossarypro
cat > ~/.aiglossarypro/config <<CONFIG_EOF
# AIGlossaryPro EC2 Configuration
# Generated: $(date)

# EC2 Instance
INSTANCE_ID=$INSTANCE_ID
ELASTIC_IP=$PUBLIC_IP

# SSH Access
KEY_PATH=~/.ssh/${KEY_NAME}.pem
SSH_USER=ec2-user

# AWS Settings
AWS_REGION=$REGION
AWS_ACCOUNT_ID=927289246324

# Application
DOMAIN=aiglossarypro.com
EMAIL=admin@aiglossarypro.com

# Paths
APP_DIR=/home/ec2-user/aiglossarypro
CONFIG_EOF

echo ""
echo "✅ Configuration saved to ~/.aiglossarypro/config"
echo ""
echo "🔗 Instance will be accessible at:"
echo "   SSH: ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@${PUBLIC_IP}"
echo "   HTTP: http://${PUBLIC_IP}"
echo "   HTTPS: https://${PUBLIC_IP} (after SSL setup)"