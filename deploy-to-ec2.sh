#!/bin/bash
# deploy-to-ec2.sh - Secure deployment to EC2
# Usage: 
#   EC2_IP=3.89.152.227 SSH_KEY=~/.ssh/aiglossarypro-ec2.pem ./deploy-to-ec2.sh [frontend|api|both]

set -e

# Required environment variables (no hardcoded secrets)
: "${EC2_IP:?Error: Set EC2_IP environment variable}"
: "${SSH_KEY:?Error: Set SSH_KEY environment variable (path to .pem file)}"
: "${EC2_USER:=ec2-user}"

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

# Function to deploy frontend
deploy_frontend() {
    print_status "Starting frontend deployment..."
    
    # Check if .env.production exists (NEVER create it with real keys)
    if [ ! -f "apps/web/.env.production" ]; then
        print_error "apps/web/.env.production is missing! Create it with your Firebase config first."
        echo "Example format:"
        echo "  VITE_API_BASE_URL=http://$EC2_IP/api"
        echo "  VITE_FIREBASE_API_KEY=your-key-here"
        echo "  VITE_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com"
        echo "  VITE_FIREBASE_PROJECT_ID=your-project-id"
        echo "  VITE_FIREBASE_STORAGE_BUCKET=your-bucket.firebasestorage.app"
        echo "  VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id"
        echo "  VITE_FIREBASE_APP_ID=your-app-id"
        exit 1
    fi
    
    # Build frontend locally
    print_status "Building frontend locally..."
    NODE_ENV=production pnpm -F @aiglossarypro/web build
    
    # Check which output directory exists and use it consistently
    if [ -d "apps/web/dist" ]; then
        BUILD_DIR="apps/web/dist"
    elif [ -d "dist/public" ]; then
        BUILD_DIR="dist/public"
    else
        print_error "Build output not found in apps/web/dist or dist/public"
        exit 1
    fi
    
    print_status "Using build directory: $BUILD_DIR"
    
    # Package frontend
    print_status "Packaging frontend..."
    tar czf /tmp/frontend.tgz -C "$BUILD_DIR" .
    
    # Upload to EC2
    print_status "Uploading to EC2..."
    scp -o StrictHostKeyChecking=no -i "$SSH_KEY" /tmp/frontend.tgz "$EC2_USER@$EC2_IP:/tmp/"
    
    # Deploy on EC2
    print_status "Deploying frontend on EC2..."
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" << 'EOF'
        set -e
        sudo rm -rf /var/www/html/*
        sudo mkdir -p /var/www/html
        sudo tar xzf /tmp/frontend.tgz -C /var/www/html
        sudo chown -R nginx:nginx /var/www/html
        sudo nginx -t
        sudo systemctl reload nginx
        rm -f /tmp/frontend.tgz
EOF
    
    # Clean up local temp file
    rm -f /tmp/frontend.tgz
    
    print_status "Frontend deployed successfully!"
}

# Function to deploy API
deploy_api() {
    print_status "Starting API deployment..."
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes. Please commit them first:"
        git status --short
        read -p "Do you want to continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Deploy API on EC2
    print_status "Deploying API on EC2..."
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" << 'EOF'
        set -e
        
        # Ensure swap is available for t3.small
        echo "Checking swap space..."
        if ! swapon --show | grep -q /swapfile; then
            echo "Creating swap file..."
            sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
            sudo chmod 600 /swapfile
            sudo mkswap /swapfile
            sudo swapon /swapfile
            echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
        fi
        
        cd ~/aiglossarypro
        
        # Pull latest code
        echo "Pulling latest code..."
        git pull
        
        # Ensure pnpm is available
        corepack enable >/dev/null 2>&1 || true
        corepack prepare pnpm@latest --activate >/dev/null 2>&1 || true
        
        # Build API only
        echo "Building API..."
        pnpm --filter @aiglossarypro/api build
        
        # Install production dependencies for API only
        echo "Installing production dependencies for API..."
        pnpm --filter @aiglossarypro/api... install --prod --frozen-lockfile
        
        # Verify the real API exists
        if [ ! -f "apps/api/dist/index.js" ]; then
            echo "Error: apps/api/dist/index.js not found after build!"
            exit 1
        fi
        
        # Restart API with PM2
        echo "Restarting API with PM2..."
        pm2 delete all || true
        set -a && source /etc/aiglossarypro/api.env && set +a
        pm2 start "node apps/api/dist/index.js" --name aiglossarypro-api --update-env
        pm2 save
        
        # Verify PM2 is running the real API
        echo "Verifying PM2 configuration..."
        pm2 describe aiglossarypro-api | grep -E "apps/api/dist/index.js" || {
            echo "Error: PM2 is not running the real API!"
            pm2 status
            exit 1
        }
        
        # Test API health locally
        echo "Testing API health..."
        sleep 3
        curl -sSf http://127.0.0.1:8080/api/health >/dev/null || {
            echo "Error: API health check failed!"
            pm2 logs --lines 20
            exit 1
        }
        
        echo "API deployment successful!"
        pm2 status
EOF
    
    print_status "API deployed successfully!"
}

# Function to verify deployment
verify_deployment() {
    print_status "Running verification gates..."
    
    # Gate 1: Verify PM2 is running the real API
    print_status "Gate 1: Checking PM2 configuration..."
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$EC2_USER@$EC2_IP" \
        "pm2 describe aiglossarypro-api 2>/dev/null | grep -E 'apps/api/dist/index.js' >/dev/null" || {
        print_error "PM2 is not running the real API (apps/api/dist/index.js)"
    }
    
    # Gate 2: Test API health
    print_status "Gate 2: Testing API health endpoint..."
    if curl -sSf "http://$EC2_IP/api/health" >/dev/null 2>&1; then
        print_status "API health check passed"
    else
        print_error "API health check failed"
    fi
    
    # Gate 3: Test frontend assets
    print_status "Gate 3: Testing frontend assets..."
    ASSET=$(curl -s "http://$EC2_IP/" | grep -o 'assets/[^"]*\.js' | head -1)
    if [ -n "$ASSET" ]; then
        if curl -sI "http://$EC2_IP/$ASSET" | grep -q '200'; then
            print_status "Frontend assets are being served correctly"
        else
            print_warning "Frontend assets may not be loading correctly"
        fi
    else
        print_warning "No frontend assets found in index.html"
    fi
    
    # Gate 4: Test API data endpoint
    print_status "Gate 4: Testing API data endpoint..."
    API_RESPONSE=$(curl -s "http://$EC2_IP/api/terms?limit=1" 2>/dev/null | head -c 100)
    if [[ "$API_RESPONSE" == *"["* ]] || [[ "$API_RESPONSE" == *"{"* ]]; then
        print_status "API is returning data"
    else
        print_warning "API may not be returning expected data"
    fi
    
    print_status "All verification gates complete!"
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