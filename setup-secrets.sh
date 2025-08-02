#!/bin/bash

# Create secrets in AWS Secrets Manager
echo "Creating secrets in AWS Secrets Manager..."

# Note: Replace these with your actual values
aws secretsmanager create-secret \
  --name aiglossarypro/database \
  --secret-string "postgresql://user:pass@host/db" \
  --region us-east-1 || echo "Secret already exists"

aws secretsmanager create-secret \
  --name aiglossarypro/session \
  --secret-string "your-session-secret" \
  --region us-east-1 || echo "Secret already exists"

aws secretsmanager create-secret \
  --name aiglossarypro/jwt \
  --secret-string "your-jwt-secret" \
  --region us-east-1 || echo "Secret already exists"

# For Firebase, create a JSON secret
aws secretsmanager create-secret \
  --name aiglossarypro/firebase \
  --secret-string '{"project_id":"your-project-id","client_email":"your-client-email","private_key":"your-private-key"}' \
  --region us-east-1 || echo "Secret already exists"

aws secretsmanager create-secret \
  --name aiglossarypro/resend \
  --secret-string "your-resend-api-key" \
  --region us-east-1 || echo "Secret already exists"

aws secretsmanager create-secret \
  --name aiglossarypro/openai \
  --secret-string "your-openai-api-key" \
  --region us-east-1 || echo "Secret already exists"

# For Gumroad, create a JSON secret
aws secretsmanager create-secret \
  --name aiglossarypro/gumroad \
  --secret-string '{"access_token":"your-token","app_id":"your-app-id","app_secret":"your-app-secret"}' \
  --region us-east-1 || echo "Secret already exists"

echo "Secrets created successfully!"
echo "IMPORTANT: Update the secret values with your actual credentials using:"
echo "aws secretsmanager update-secret --secret-id <secret-name> --secret-string '<value>'"