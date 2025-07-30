#!/bin/bash
# Script to configure Firebase secret in App Runner after deployment

set -e

echo "🔐 Configuring Firebase secret for App Runner service..."

SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-api/bf1d3383aa7a4632afa3fbb9fdd93163"
SECRET_ARN="arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/firebase-private-key-guP8N3"

echo "📝 Service ARN: $SERVICE_ARN"
echo "🔑 Secret ARN: $SECRET_ARN"

# Get current environment variables
echo "📋 Getting current service configuration..."
CURRENT_ENV=$(aws apprunner describe-service \
  --service-arn "$SERVICE_ARN" \
  --region us-east-1 \
  --query 'Service.SourceConfiguration.CodeRepository.CodeConfiguration.CodeConfigurationValues.RuntimeEnvironmentVariables' \
  --output json)

echo "Current environment variables:"
echo "$CURRENT_ENV" | jq '.'

# Add the Firebase secret reference
echo "🔧 Preparing updated configuration with secret reference..."
UPDATED_ENV=$(echo "$CURRENT_ENV" | jq '. + {"FIREBASE_PRIVATE_KEY_BASE64": {"SecretsManagerArn": "'$SECRET_ARN'", "IsValueSecret": true}}')

echo "Updated environment variables:"
echo "$UPDATED_ENV" | jq '.'

echo "⚠️  Note: This will trigger a new deployment of your service."
echo "Do you want to continue? (yes/no)"
read -r CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    echo "❌ Operation cancelled"
    exit 1
fi

echo "🚀 Updating service configuration..."
aws apprunner update-service \
  --service-arn "$SERVICE_ARN" \
  --region us-east-1 \
  --source-configuration '{
    "CodeRepository": {
      "CodeConfiguration": {
        "ConfigurationSource": "API",
        "CodeConfigurationValues": {
          "Runtime": "nodejs18",
          "Port": "8080",
          "RuntimeEnvironmentVariables": '"$UPDATED_ENV"'
        }
      }
    }
  }'

echo "✅ Service configuration updated! A new deployment will start."
echo "Monitor the deployment at: https://console.aws.amazon.com/apprunner/home?region=us-east-1#/services"