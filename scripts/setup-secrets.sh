#!/bin/bash
set -e

echo "🔐 Setting up AWS Secrets Manager for AIGlossaryPro"
echo "================================================="

# Configuration
REGION="${AWS_REGION:-us-east-1}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables from .env
if [ -f ".env" ]; then
    echo -e "${YELLOW}Loading configuration from .env...${NC}"
    set -a
    source .env
    set +a
else
    echo -e "${RED}ERROR: .env file not found${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Creating/updating secrets in AWS Secrets Manager...${NC}"

# Function to create or update secret
create_or_update_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    local DESCRIPTION=$3
    
    if [ -z "$SECRET_VALUE" ]; then
        echo -e "${YELLOW}  Skipping $SECRET_NAME (no value set)${NC}"
        return
    fi
    
    # Check if secret exists
    if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" &>/dev/null; then
        echo -e "  Updating secret: $SECRET_NAME"
        aws secretsmanager update-secret \
            --secret-id "$SECRET_NAME" \
            --secret-string "$SECRET_VALUE" \
            --region "$REGION" \
            --no-cli-pager &>/dev/null
    else
        echo -e "  Creating secret: $SECRET_NAME"
        aws secretsmanager create-secret \
            --name "$SECRET_NAME" \
            --description "$DESCRIPTION" \
            --secret-string "$SECRET_VALUE" \
            --region "$REGION" \
            --no-cli-pager &>/dev/null
    fi
}

# Create secrets
create_or_update_secret "aiglossarypro/database-url" "$DATABASE_URL" "PostgreSQL connection string"
create_or_update_secret "aiglossarypro/jwt-secret" "$JWT_SECRET" "JWT signing secret"
create_or_update_secret "aiglossarypro/openai-api-key" "$OPENAI_API_KEY" "OpenAI API key"
create_or_update_secret "aiglossarypro/groq-api-key" "$GROQ_API_KEY" "Groq API key"
create_or_update_secret "aiglossarypro/anthropic-api-key" "$ANTHROPIC_API_KEY" "Anthropic API key"
create_or_update_secret "aiglossarypro/redis-url" "$REDIS_URL" "Redis connection string"
create_or_update_secret "aiglossarypro/admin-api-key" "$ADMIN_API_KEY" "Admin API key"
create_or_update_secret "aiglossarypro/firebase-project-id" "$FIREBASE_PROJECT_ID" "Firebase project ID"
create_or_update_secret "aiglossarypro/firebase-client-email" "$FIREBASE_CLIENT_EMAIL" "Firebase client email"
create_or_update_secret "aiglossarypro/firebase-private-key-base64" "$FIREBASE_PRIVATE_KEY_BASE64" "Firebase private key (base64)"
create_or_update_secret "aiglossarypro/posthog-api-key" "$POSTHOG_API_KEY" "PostHog API key"
create_or_update_secret "aiglossarypro/session-secret" "${SESSION_SECRET:-$JWT_SECRET}" "Session secret"

echo -e "\n${GREEN}✅ Secrets setup complete!${NC}"
echo ""
echo "Secrets created in AWS Secrets Manager:"
aws secretsmanager list-secrets --region "$REGION" --query 'SecretList[?starts_with(Name, `aiglossarypro/`)].{Name:Name,ARN:ARN}' --output table