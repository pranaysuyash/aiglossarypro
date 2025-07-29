#!/bin/bash

# AWS Deployment Script for AI Glossary Pro
# This script builds and deploys the application to AWS App Runner

set -e  # Exit on error

echo "🚀 Starting AWS deployment process..."

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
ECR_REPOSITORY="aiglossarypro"
IMAGE_TAG="latest"
APP_RUNNER_SERVICE_NAME="aiglossarypro"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
        echo "Visit: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
        echo "Visit: https://www.docker.com/get-started"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured. Run 'aws configure'${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Function to create ECR repository if it doesn't exist
create_ecr_repository() {
    echo "📦 Checking ECR repository..."
    
    if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION &> /dev/null; then
        echo "Creating ECR repository..."
        aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
        echo -e "${GREEN}✅ ECR repository created${NC}"
    else
        echo -e "${GREEN}✅ ECR repository already exists${NC}"
    fi
}

# Function to build and push Docker image
build_and_push_image() {
    echo "🔨 Building Docker image..."
    
    # Get AWS account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY"
    
    # Login to ECR
    echo "🔐 Logging in to ECR..."
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI
    
    # Build Docker image
    echo "🏗️ Building Docker image..."
    docker build --platform linux/amd64 -t $ECR_REPOSITORY:$IMAGE_TAG .
    
    # Tag image for ECR
    docker tag $ECR_REPOSITORY:$IMAGE_TAG $ECR_URI:$IMAGE_TAG
    
    # Push image to ECR
    echo "⬆️ Pushing image to ECR..."
    docker push $ECR_URI:$IMAGE_TAG
    
    echo -e "${GREEN}✅ Docker image pushed successfully${NC}"
    echo "ECR URI: $ECR_URI:$IMAGE_TAG"
}

# Function to create or update App Runner service
deploy_to_app_runner() {
    echo "🚀 Deploying to App Runner..."
    
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
    
    # Check if service exists
    if aws apprunner describe-service --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$APP_RUNNER_SERVICE_NAME" &> /dev/null; then
        echo "📝 Updating existing App Runner service..."
        # For existing service, you'll need to update via console or use update-service API
        echo -e "${YELLOW}⚠️  Please update the service in AWS App Runner console with the new image:${NC}"
        echo "   Image URI: $ECR_URI"
    else
        echo "📝 Creating new App Runner service..."
        echo -e "${YELLOW}⚠️  Please create the service in AWS App Runner console with:${NC}"
        echo "   Service name: $APP_RUNNER_SERVICE_NAME"
        echo "   Image URI: $ECR_URI"
        echo "   Port: 3001"
        echo ""
        echo "   Don't forget to add all environment variables from .env.production!"
    fi
}

# Function to display next steps
display_next_steps() {
    echo ""
    echo "📋 Next Steps:"
    echo "1. Go to AWS App Runner console: https://console.aws.amazon.com/apprunner"
    echo "2. Create or update service with the ECR image"
    echo "3. Configure environment variables from .env.production"
    echo "4. Configure custom domain (aiglossarypro.com)"
    echo "5. Test the deployment"
    echo ""
    echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
}

# Main execution
main() {
    check_prerequisites
    create_ecr_repository
    build_and_push_image
    deploy_to_app_runner
    display_next_steps
}

# Run main function
main