#!/bin/bash

SERVICE_NAME="aiglossary-prod-pnpm"
SERVICE_URL="https://z2t3jzx6q3.us-east-1.awsapprunner.com"
SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossary-prod-pnpm/572f33ab32024613b4cd377edbc59366"

echo "Monitoring deployment of $SERVICE_NAME..."
echo "Service URL: $SERVICE_URL"
echo "====================================="

while true; do
  # Get service status
  SERVICE_INFO=$(aws apprunner describe-service --service-arn $SERVICE_ARN 2>/dev/null)
  
  if [ $? -eq 0 ]; then
    STATUS=$(echo "$SERVICE_INFO" | jq -r '.Service.Status')
    echo -n "$(date '+%Y-%m-%d %H:%M:%S') - Status: $STATUS"
    
    if [ "$STATUS" == "RUNNING" ]; then
      echo " ✅"
      echo "Service is running! Testing health endpoint..."
      
      # Test the health endpoint
      HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health" 2>/dev/null)
      echo "Health check response: $HEALTH_CHECK"
      
      if [ "$HEALTH_CHECK" == "200" ]; then
        echo "Health check passed! Service is operational."
        curl -s "$SERVICE_URL/health" | jq . 2>/dev/null || echo "Response: $(curl -s "$SERVICE_URL/health")"
      fi
      
      # Also check root endpoint
      echo "Testing root endpoint..."
      ROOT_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/" 2>/dev/null)
      echo "Root endpoint response: $ROOT_CHECK"
      break
      
    elif [[ "$STATUS" == "CREATE_FAILED" || "$STATUS" == "DELETE_FAILED" ]]; then
      echo " ❌"
      echo "Deployment failed!"
      
      # Get logs
      echo "Fetching deployment logs..."
      aws logs tail /aws/apprunner/aiglossary-prod-pnpm/572f33ab32024613b4cd377edbc59366/service --since 5m 2>/dev/null || echo "Unable to fetch logs"
      break
    else
      echo ""
    fi
  else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Unable to get service status"
  fi
  
  sleep 30
done