#!/bin/bash

echo "🚀 Deploying AIGlossaryPro Frontend..."

# Build frontend
echo "📦 Building frontend..."
cd apps/web
pnpm run build

# Check if S3 bucket exists
BUCKET_NAME="aiglossarypro-frontend"
if ! aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "✅ S3 bucket already exists"
else
    echo "🪣 Creating S3 bucket..."
    aws s3 mb "s3://${BUCKET_NAME}" --region us-east-1
    
    # Configure bucket for static website hosting
    aws s3 website "s3://${BUCKET_NAME}" \
        --index-document index.html \
        --error-document index.html
    
    # Set bucket policy for public read access
    cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF
    
    aws s3api put-bucket-policy \
        --bucket "${BUCKET_NAME}" \
        --policy file:///tmp/bucket-policy.json
fi

# Upload to S3
echo "📤 Uploading to S3..."
aws s3 sync dist/ "s3://${BUCKET_NAME}" --delete

# Invalidate CloudFront cache (if exists)
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='${BUCKET_NAME}.s3.amazonaws.com'].Id" --output text)
if [ ! -z "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    echo "✅ CloudFront cache invalidated"
else
    echo "ℹ️  No CloudFront distribution found"
    echo "📍 S3 Website URL: http://${BUCKET_NAME}.s3-website-us-east-1.amazonaws.com"
fi

echo "✅ Frontend deployed!"
cd ../..