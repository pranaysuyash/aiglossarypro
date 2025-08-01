#!/bin/bash
SERVICE_URL=$1

echo "🔍 Diagnosing App Runner Deployment"
echo "==================================="

# 1. DNS Resolution
echo "1. DNS Resolution:"
nslookup $(echo $SERVICE_URL | sed 's|https://||' | sed 's|/.*||')

# 2. Health Check
echo -e "\n2. Health Check:"
curl -s -w "\nTime: %{time_total}s\nHTTP Code: %{http_code}\n" $SERVICE_URL/health

# 3. Response Headers
echo -e "\n3. Response Headers:"
curl -sI $SERVICE_URL | head -10

# 4. SSL Certificate
echo -e "\n4. SSL Certificate:"
echo | openssl s_client -connect $(echo $SERVICE_URL | sed 's|https://||' | sed 's|/.*||'):443 2>/dev/null | openssl x509 -noout -dates

