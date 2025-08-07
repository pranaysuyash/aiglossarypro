#!/bin/bash

# Monitor CloudFront deployment status
DISTRIBUTION_ID="ESF8YR50LSGU8"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔄 Monitoring CloudFront deployment for distribution: $DISTRIBUTION_ID"
echo "This typically takes 5-10 minutes..."
echo

start_time=$(date +%s)

while true; do
    status=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status' --output text 2>/dev/null)
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    elapsed_min=$((elapsed / 60))
    elapsed_sec=$((elapsed % 60))
    
    if [ "$status" = "Deployed" ]; then
        echo -e "\n${GREEN}✅ Deployment complete!${NC}"
        echo "Total time: ${elapsed_min}m ${elapsed_sec}s"
        
        echo -e "\n${GREEN}Testing updated configuration...${NC}"
        echo
        
        # Test search with query parameters
        echo "1. Testing search endpoint with query parameters:"
        response=$(curl -s "https://d1m7nnfj3im4kp.cloudfront.net/api/search?q=Machine" | head -c 100)
        echo "Response: $response"
        
        # Test if it's still returning the error
        if [[ "$response" == *"Query parameter"* ]]; then
            echo -e "${RED}❌ Query parameters still not working${NC}"
        else
            echo -e "${GREEN}✅ Query parameters working!${NC}"
        fi
        
        break
    elif [ "$status" = "InProgress" ]; then
        echo -ne "\r⏳ Status: ${YELLOW}InProgress${NC} (${elapsed_min}m ${elapsed_sec}s)..."
    else
        echo -e "\n${RED}❌ Unexpected status: $status${NC}"
        break
    fi
    
    sleep 10
done

echo -e "\n\nDeployment monitoring complete."