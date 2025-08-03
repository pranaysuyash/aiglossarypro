#!/bin/bash

# Example deployment script template - Shows how to handle secrets properly
# DO NOT commit actual secrets to git!

set -e

echo "🚀 Example deployment script - Using environment variables for secrets"

# Configuration (safe to commit)
REGION="us-east-1"
CLUSTER_NAME="aiglossarypro"
SERVICE_NAME="aiglossarypro-api"

# Check for required environment variables
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ Error: Environment variable $1 is not set"
        echo "Please set it using: export $1=<value>"
        exit 1
    fi
}

# Verify all required secrets are available
echo "📋 Checking required environment variables..."
check_env_var "DATABASE_URL"
check_env_var "SESSION_SECRET"
check_env_var "JWT_SECRET"
check_env_var "OPENAI_API_KEY"
check_env_var "AWS_ACCESS_KEY_ID"
check_env_var "AWS_SECRET_ACCESS_KEY"

echo "✅ All required environment variables are set"

# Example: Create secrets in AWS Secrets Manager using environment variables
create_secret() {
    local secret_name=$1
    local secret_value=$2
    
    echo "Creating secret: $secret_name"
    aws secretsmanager create-secret \
        --name "$secret_name" \
        --secret-string "$secret_value" \
        --region $REGION 2>/dev/null || echo "Secret $secret_name already exists"
}

# Use environment variables instead of hardcoding
create_secret "myapp/database" "${DATABASE_URL}"
create_secret "myapp/jwt" "${JWT_SECRET}"
create_secret "myapp/openai" "${OPENAI_API_KEY}"

# Example task definition without hardcoded values
cat > task-definition-template.json << 'EOF'
{
  "family": "myapp",
  "containerDefinitions": [
    {
      "name": "api",
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "8080"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:myapp/database"
        }
      ]
    }
  ]
}
EOF

echo "📝 Example: How to load secrets from .env file (for local development only):"
echo ""
echo "if [ -f .env.local ]; then"
echo "    export \$(grep -v '^#' .env.local | xargs)"
echo "fi"
echo ""
echo "Remember:"
echo "- Never commit .env files"
echo "- Use AWS Secrets Manager or similar for production"
echo "- Keep this template as reference"