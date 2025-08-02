#!/bin/bash
set -e

echo "🚀 Frontend S3 + CloudFront Deployment for AIGlossaryPro"
echo "========================================================="

# Configuration
REGION="${AWS_REGION:-us-east-1}"
BUCKET_NAME="aiglossarypro-frontend"
DISTRIBUTION_NAME="aiglossarypro-frontend-cdn"
DOMAIN_NAME="aiglossarypro.com"
WWW_DOMAIN_NAME="www.aiglossarypro.com"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Configuration:${NC}"
echo "  Region: $REGION"
echo "  S3 Bucket: $BUCKET_NAME"
echo "  Primary Domain: $DOMAIN_NAME"
echo "  WWW Domain: $WWW_DOMAIN_NAME"

# Step 1: Build the frontend application
echo -e "\n${YELLOW}1️⃣ Building frontend application...${NC}"

# Create production environment file for build
echo -e "${YELLOW}Creating build environment...${NC}"
cat > .env.build << EOF
NODE_ENV=production
VITE_API_BASE_URL=https://api.aiglossarypro.com
VITE_FIREBASE_API_KEY=AIzaSyBqJ7OMRjr54_CMJpEDMWKR6XQ4Y8qzfdg
VITE_FIREBASE_AUTH_DOMAIN=aiglossarypro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aiglossarypro
VITE_FIREBASE_STORAGE_BUCKET=aiglossarypro.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=449850174939
VITE_FIREBASE_APP_ID=1:449850174939:web:08d7973752807207d24bfe
VITE_POSTHOG_KEY=phc_mYHD50kDJLqHf9s9w2jMDeDpJYu3V8ySNJNmdNROZA1
VITE_GA4_MEASUREMENT_ID=G-PGJ3NP5TR7
VITE_GA4_ENABLED=true
VITE_GUMROAD_PRODUCT_URL=https://pranaysuyash.gumroad.com/l/ggczfy
VITE_GUMROAD_DISCOUNT_URL=https://pranaysuyash.gumroad.com/l/ggczfy/EARLY500
VITE_GUMROAD_BASE_PRICE=249
VITE_GUMROAD_EARLY_BIRD_PRICE=179
VITE_PPP_MIN_PRICE=99
VITE_PPP_MAX_DISCOUNT=60
VITE_PPP_ENABLED=true
VITE_EARLY_BIRD_SAVINGS=70
EOF

# Install dependencies and build
echo -e "${YELLOW}Installing dependencies...${NC}"
pnpm install --frozen-lockfile

echo -e "${YELLOW}Building frontend...${NC}"
pnpm --filter @aiglossarypro/web run build

if [ ! -d "dist/public" ]; then
    echo -e "${RED}❌ Build failed - dist/public directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build completed successfully${NC}"

# Step 2: Create S3 bucket
echo -e "\n${YELLOW}2️⃣ Creating S3 bucket...${NC}"

# Check if bucket exists
if aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null; then
    echo -e "${YELLOW}⚠️ Bucket $BUCKET_NAME already exists${NC}"
else
    # Create bucket
    if [ "$REGION" = "us-east-1" ]; then
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
    else
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
    fi
    echo -e "${GREEN}✅ S3 bucket created: $BUCKET_NAME${NC}"
fi

# Configure bucket for static website hosting
echo -e "${YELLOW}Configuring static website hosting...${NC}"
aws s3api put-bucket-website --bucket "$BUCKET_NAME" --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
}'

# Configure bucket policy for CloudFront access
echo -e "${YELLOW}Configuring bucket policy...${NC}"
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://bucket-policy.json
rm -f bucket-policy.json

# Block public access (security best practice)
aws s3api put-public-access-block --bucket "$BUCKET_NAME" --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false

echo -e "${GREEN}✅ S3 bucket configured${NC}"

# Step 3: Upload files to S3
echo -e "\n${YELLOW}3️⃣ Uploading files to S3...${NC}"

# Sync files with optimized caching headers
aws s3 sync dist/public/ s3://"$BUCKET_NAME"/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.json" \
    --exclude "*.xml" \
    --exclude "*.txt"

# Upload HTML files with shorter cache
aws s3 sync dist/public/ s3://"$BUCKET_NAME"/ \
    --delete \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "*.html" \
    --include "*.json" \
    --include "*.xml" \
    --include "*.txt"

# Set specific content types
aws s3 cp s3://"$BUCKET_NAME"/manifest.json s3://"$BUCKET_NAME"/manifest.json \
    --content-type "application/manifest+json" \
    --metadata-directive REPLACE \
    --cache-control "public, max-age=86400" || echo "manifest.json not found"

echo -e "${GREEN}✅ Files uploaded to S3${NC}"

# Step 4: Create Origin Access Control for CloudFront
echo -e "\n${YELLOW}4️⃣ Creating CloudFront Origin Access Control...${NC}"

OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config '{
        "Name": "aiglossarypro-oac",
        "Description": "Origin Access Control for AIGlossaryPro S3 bucket",
        "OriginAccessControlOriginType": "s3",
        "SigningBehavior": "always",
        "SigningProtocol": "sigv4"
    }' \
    --query 'OriginAccessControl.Id' \
    --output text 2>/dev/null || \
    aws cloudfront list-origin-access-controls \
    --query 'OriginAccessControlList.Items[?Name==`aiglossarypro-oac`].Id' \
    --output text)

echo -e "${GREEN}✅ Origin Access Control ID: $OAC_ID${NC}"

# Step 5: Create CloudFront distribution
echo -e "\n${YELLOW}5️⃣ Creating CloudFront distribution...${NC}"

# Check if distribution already exists
EXISTING_DIST=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='AIGlossaryPro Frontend CDN'].Id" \
    --output text)

if [ ! -z "$EXISTING_DIST" ] && [ "$EXISTING_DIST" != "None" ]; then
    echo -e "${YELLOW}⚠️ CloudFront distribution already exists: $EXISTING_DIST${NC}"
    DISTRIBUTION_ID="$EXISTING_DIST"
else
    # Create distribution configuration
    cat > cloudfront-config.json << EOF
{
    "CallerReference": "aiglossarypro-$(date +%s)",
    "Comment": "AIGlossaryPro Frontend CDN",
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-${BUCKET_NAME}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
        "Compress": true,
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        }
    },
    "CacheBehaviors": {
        "Quantity": 3,
        "Items": [
            {
                "PathPattern": "/api/*",
                "TargetOriginId": "API-Backend",
                "ViewerProtocolPolicy": "redirect-to-https",
                "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
                "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
                "AllowedMethods": {
                    "Quantity": 7,
                    "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                    "CachedMethods": {
                        "Quantity": 2,
                        "Items": ["GET", "HEAD"]
                    }
                }
            },
            {
                "PathPattern": "*.html",
                "TargetOriginId": "S3-${BUCKET_NAME}",
                "ViewerProtocolPolicy": "redirect-to-https",
                "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
                "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
                "DefaultTTL": 0,
                "MaxTTL": 86400,
                "MinTTL": 0,
                "AllowedMethods": {
                    "Quantity": 2,
                    "Items": ["GET", "HEAD"],
                    "CachedMethods": {
                        "Quantity": 2,
                        "Items": ["GET", "HEAD"]
                    }
                }
            },
            {
                "PathPattern": "/assets/*",
                "TargetOriginId": "S3-${BUCKET_NAME}",
                "ViewerProtocolPolicy": "redirect-to-https",
                "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
                "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
                "DefaultTTL": 31536000,
                "MaxTTL": 31536000,
                "MinTTL": 31536000,
                "AllowedMethods": {
                    "Quantity": 2,
                    "Items": ["GET", "HEAD"],
                    "CachedMethods": {
                        "Quantity": 2,
                        "Items": ["GET", "HEAD"]
                    }
                }
            }
        ]
    },
    "Origins": {
        "Quantity": 2,
        "Items": [
            {
                "Id": "S3-${BUCKET_NAME}",
                "DomainName": "${BUCKET_NAME}.s3.${REGION}.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "${OAC_ID}"
            },
            {
                "Id": "API-Backend",
                "DomainName": "54.152.245.210",
                "CustomOriginConfig": {
                    "HTTPPort": 8080,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only",
                    "OriginSslProtocols": {
                        "Quantity": 1,
                        "Items": ["TLSv1.2"]
                    }
                }
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100",
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "DefaultRootObject": "index.html",
    "HttpVersion": "http2and3",
    "IsIPV6Enabled": true
}
EOF

    # Create the distribution
    DISTRIBUTION_RESULT=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json)
    DISTRIBUTION_ID=$(echo "$DISTRIBUTION_RESULT" | jq -r '.Distribution.Id')
    DISTRIBUTION_DOMAIN=$(echo "$DISTRIBUTION_RESULT" | jq -r '.Distribution.DomainName')
    
    rm -f cloudfront-config.json
    
    echo -e "${GREEN}✅ CloudFront distribution created: $DISTRIBUTION_ID${NC}"
    echo -e "${GREEN}✅ Distribution domain: $DISTRIBUTION_DOMAIN${NC}"
fi

# Step 6: Wait for distribution deployment
echo -e "\n${YELLOW}6️⃣ Waiting for CloudFront distribution to deploy...${NC}"
echo "This typically takes 5-15 minutes..."

DEPLOYED=false
for i in {1..30}; do
    STATUS=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.Status' --output text)
    echo -ne "\r  Deployment status: $STATUS (attempt $i/30)"
    
    if [ "$STATUS" = "Deployed" ]; then
        DEPLOYED=true
        break
    fi
    
    sleep 30
done

echo ""
if [ "$DEPLOYED" = true ]; then
    echo -e "${GREEN}✅ CloudFront distribution deployed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️ Distribution is still deploying. You can continue monitoring manually.${NC}"
fi

# Get final distribution details
DISTRIBUTION_DETAILS=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID")
DISTRIBUTION_DOMAIN=$(echo "$DISTRIBUTION_DETAILS" | jq -r '.Distribution.DomainName')

# Step 7: Create invalidation to refresh cache
echo -e "\n${YELLOW}7️⃣ Creating cache invalidation...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}✅ Cache invalidation created: $INVALIDATION_ID${NC}"

# Clean up build environment
rm -f .env.build

echo -e "\n${GREEN}🎉 Frontend Deployment Successful!${NC}"
echo "================================="
echo -e "${BLUE}Distribution ID:${NC} $DISTRIBUTION_ID"
echo -e "${BLUE}Distribution Domain:${NC} $DISTRIBUTION_DOMAIN"
echo ""
echo -e "${GREEN}Access URLs:${NC}"
echo "  🌐 CloudFront: https://$DISTRIBUTION_DOMAIN"
echo "  📦 S3 Website: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure custom domain (aiglossarypro.com) with Route 53"
echo "2. Add SSL certificate via AWS Certificate Manager"
echo "3. Update DNS records to point to CloudFront"
echo "4. Set up automated deployment pipeline"

echo -e "\n${BLUE}📋 Deployment Summary:${NC}"
echo "  S3 Bucket: $BUCKET_NAME"
echo "  CloudFront Distribution: $DISTRIBUTION_ID"
echo "  Region: $REGION"
echo "  Files Uploaded: $(aws s3 ls s3://$BUCKET_NAME --recursive | wc -l)"

echo -e "\n${BLUE}🛠️ Management Commands:${NC}"
echo "  List files: aws s3 ls s3://$BUCKET_NAME --recursive"
echo "  Sync new files: aws s3 sync dist/public/ s3://$BUCKET_NAME/ --delete"
echo "  Invalidate cache: aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/*'"
echo "  Distribution status: aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"