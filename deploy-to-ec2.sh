#!/bin/bash
# deploy-to-ec2.sh - One-command deployment to EC2
# Usage: ./deploy-to-ec2.sh [frontend|api|both]

set -e

# Configuration
EC2_IP="3.89.152.227"
EC2_USER="ec2-user"
SSH_KEY="$HOME/.ssh/aiglossarypro-ec2.pem"
PROJECT_ROOT="/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check what to deploy
DEPLOY_TYPE=${1:-both}

# Navigate to project root
cd "$PROJECT_ROOT"

# Function to deploy frontend
deploy_frontend() {
    print_status "Starting frontend deployment..."
    
    # Check if .env.production exists
    if [ ! -f "apps/web/.env.production" ]; then
        print_warning "Creating .env.production with Firebase config..."
        cat > apps/web/.env.production << 'EOF'
# Production Environment Variables
VITE_API_BASE_URL=http://3.89.152.227/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyBqJ7OMRjr54_CMJpEDMWKR6XQ4Y8qzfdg
VITE_FIREBASE_AUTH_DOMAIN=aiglossarypro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aiglossarypro
VITE_FIREBASE_STORAGE_BUCKET=aiglossarypro.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=449850174939
VITE_FIREBASE_APP_ID=1:449850174939:web:08d7973752807207d24bfe
EOF
    fi
    
    # Build frontend
    print_status "Building frontend locally..."
    NODE_ENV=production pnpm -F @aiglossarypro/web build
    
    # Clean any TSX/JSX references from HTML
    print_status "Cleaning build output..."
    if [ -f "dist/public/index.html" ]; then
        grep -v '\.tsx">' dist/public/index.html | grep -v 'data:text/jsx' > /tmp/index.html
        mv /tmp/index.html dist/public/index.html
    fi
    
    # Package frontend
    print_status "Packaging frontend..."
    tar czf /tmp/frontend.tgz -C dist/public .
    
    # Upload to EC2
    print_status "Uploading to EC2..."
    scp -o StrictHostKeyChecking=no -i "$SSH_KEY" /tmp/frontend.tgz "$EC2_USER@$EC2_IP:/tmp/"
    
    # Deploy on EC2
    print_status "Deploying frontend on EC2..."
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" << 'EOF'
        sudo rm -rf /var/www/html/*
        sudo mkdir -p /var/www/html
        cd /var/www/html
        sudo tar xzf /tmp/frontend.tgz
        sudo chown -R nginx:nginx /var/www/html
        sudo systemctl reload nginx
        rm /tmp/frontend.tgz
EOF
    
    print_status "Frontend deployed successfully!"
}

# Function to deploy API
deploy_api() {
    print_status "Starting API deployment..."
    
    # First, push latest code to git
    print_status "Pushing latest code to git..."
    git add .
    git commit -m "Deploy: API updates $(date +%Y-%m-%d_%H:%M:%S)" || true
    git push origin main || true
    
    # Deploy API on EC2
    print_status "Deploying API on EC2..."
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" << 'EOF'
        cd ~/aiglossarypro
        
        # Pull latest code
        echo "Pulling latest code..."
        git pull
        
        # Install dependencies
        echo "Installing dependencies..."
        pnpm install --frozen-lockfile
        
        # Build API
        echo "Building API..."
        pnpm -F @aiglossarypro/api build
        
        # Restart API with PM2
        echo "Restarting API..."
        pm2 delete all || true
        set -a && source /etc/aiglossarypro/api.env && set +a
        pm2 start "node apps/api/dist/index.js" --name aiglossarypro-api --update-env
        pm2 save
        
        # Show status
        pm2 status
EOF
    
    print_status "API deployed successfully!"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Test frontend
    print_status "Testing frontend..."
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$EC2_IP/")
    if [ "$FRONTEND_STATUS" = "200" ]; then
        print_status "Frontend is accessible (HTTP $FRONTEND_STATUS)"
    else
        print_error "Frontend returned HTTP $FRONTEND_STATUS"
    fi
    
    # Test API health
    print_status "Testing API health..."
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$EC2_IP/api/health")
    if [ "$API_STATUS" = "200" ]; then
        print_status "API is healthy (HTTP $API_STATUS)"
    else
        print_error "API health check returned HTTP $API_STATUS"
    fi
    
    # Test API data
    print_status "Testing API data endpoint..."
    API_DATA=$(curl -s "http://$EC2_IP/api/terms?limit=1" | head -c 100)
    if [[ "$API_DATA" == *"["* ]] || [[ "$API_DATA" == *"{"* ]]; then
        print_status "API is returning data"
    else
        print_warning "API may not be returning expected data"
    fi
    
    print_status "Deployment verification complete!"
    echo ""
    echo "🚀 Application is live at: http://$EC2_IP/"
}

# Main deployment logic
case "$DEPLOY_TYPE" in
    frontend)
        deploy_frontend
        verify_deployment
        ;;
    api)
        deploy_api
        verify_deployment
        ;;
    both)
        deploy_frontend
        deploy_api
        verify_deployment
        ;;
    *)
        print_error "Invalid deployment type. Use: frontend, api, or both"
        ;;
esac

print_status "Deployment complete! 🎉"