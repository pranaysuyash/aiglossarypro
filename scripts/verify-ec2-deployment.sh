#!/bin/bash
set -euo pipefail

# EC2 Deployment Verification Script
# Tests all components of the single-EC2 deployment

# Configuration
DOMAIN="${DOMAIN:-aiglossarypro.com}"
ELASTIC_IP="${ELASTIC_IP:-}"
INSTANCE_ID="${INSTANCE_ID:-}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 EC2 Deployment Verification${NC}"
echo "================================"
echo "Domain: $DOMAIN"
echo ""

# Track overall status
ALL_GOOD=true

# Function to check endpoint
check_endpoint() {
    local URL=$1
    local EXPECTED=$2
    local DESC=$3
    
    echo -n "  $DESC: "
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "$EXPECTED" ]; then
        echo -e "${GREEN}✅ $HTTP_CODE${NC}"
        return 0
    else
        echo -e "${RED}❌ $HTTP_CODE (expected $EXPECTED)${NC}"
        ALL_GOOD=false
        return 1
    fi
}

# Function to check JSON response
check_json_endpoint() {
    local URL=$1
    local DESC=$2
    
    echo -n "  $DESC: "
    
    RESPONSE=$(curl -s "$URL" 2>/dev/null)
    
    if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Valid JSON${NC}"
        return 0
    else
        echo -e "${RED}❌ Invalid JSON or error${NC}"
        ALL_GOOD=false
        return 1
    fi
}

# Step 1: Check DNS Resolution
echo -e "${YELLOW}1️⃣ DNS Resolution${NC}"
DNS_IP=$(dig +short "$DOMAIN" | head -1)
if [ -n "$DNS_IP" ]; then
    echo -e "  Domain resolves to: ${GREEN}$DNS_IP${NC}"
    if [ -n "$ELASTIC_IP" ] && [ "$DNS_IP" = "$ELASTIC_IP" ]; then
        echo -e "  Matches Elastic IP: ${GREEN}✅${NC}"
    elif [ -n "$ELASTIC_IP" ]; then
        echo -e "  ${RED}⚠️ Does not match expected Elastic IP: $ELASTIC_IP${NC}"
        ALL_GOOD=false
    fi
else
    echo -e "  ${RED}❌ Domain does not resolve${NC}"
    ALL_GOOD=false
fi

# Step 2: Check HTTP to HTTPS Redirect
echo -e "\n${YELLOW}2️⃣ HTTP → HTTPS Redirect${NC}"
REDIRECT_LOCATION=$(curl -s -I "http://$DOMAIN" 2>/dev/null | grep -i "^location:" | awk '{print $2}' | tr -d '\r')
if [[ "$REDIRECT_LOCATION" == https://* ]]; then
    echo -e "  HTTP redirects to: ${GREEN}$REDIRECT_LOCATION ✅${NC}"
else
    echo -e "  ${RED}❌ No HTTPS redirect found${NC}"
    ALL_GOOD=false
fi

# Step 3: Check SSL Certificate
echo -e "\n${YELLOW}3️⃣ SSL Certificate${NC}"
SSL_CHECK=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -subject 2>/dev/null)
if [ -n "$SSL_CHECK" ]; then
    echo -e "  SSL Certificate: ${GREEN}✅ Valid${NC}"
    
    # Check certificate expiration
    EXPIRY=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    if [ -n "$EXPIRY" ]; then
        echo -e "  Expires: $EXPIRY"
    fi
else
    echo -e "  ${RED}❌ SSL certificate check failed${NC}"
    ALL_GOOD=false
fi

# Step 4: Check Frontend
echo -e "\n${YELLOW}4️⃣ Frontend${NC}"
check_endpoint "https://$DOMAIN" "200" "Homepage"
check_endpoint "https://$DOMAIN/index.html" "200" "Index.html"

# Check if it's actually React
REACT_CHECK=$(curl -s "https://$DOMAIN" 2>/dev/null | grep -c "root" || true)
if [ "$REACT_CHECK" -gt 0 ]; then
    echo -e "  React app detected: ${GREEN}✅${NC}"
else
    echo -e "  ${YELLOW}⚠️ React app markers not found${NC}"
fi

# Step 5: Check API Endpoints
echo -e "\n${YELLOW}5️⃣ API Endpoints${NC}"
check_endpoint "https://$DOMAIN/health" "200" "Health (direct)"
check_json_endpoint "https://$DOMAIN/api/health" "API Health"
check_json_endpoint "https://$DOMAIN/api/terms?limit=1" "API Terms"
check_json_endpoint "https://$DOMAIN/api/categories" "API Categories"

# Step 6: Check Response Times
echo -e "\n${YELLOW}6️⃣ Response Times${NC}"
for ENDPOINT in "/" "/health" "/api/health"; do
    TIME=$(curl -s -o /dev/null -w "%{time_total}" "https://$DOMAIN$ENDPOINT" 2>/dev/null)
    TIME_MS=$(echo "$TIME * 1000" | bc | cut -d. -f1)
    
    echo -n "  $ENDPOINT: "
    if [ "$TIME_MS" -lt 500 ]; then
        echo -e "${GREEN}${TIME_MS}ms ✅${NC}"
    elif [ "$TIME_MS" -lt 1000 ]; then
        echo -e "${YELLOW}${TIME_MS}ms ⚠️${NC}"
    else
        echo -e "${RED}${TIME_MS}ms ❌${NC}"
        ALL_GOOD=false
    fi
done

# Step 7: Check Headers
echo -e "\n${YELLOW}7️⃣ Security Headers${NC}"
HEADERS=$(curl -s -I "https://$DOMAIN" 2>/dev/null)

check_header() {
    local HEADER=$1
    echo -n "  $HEADER: "
    if echo "$HEADERS" | grep -qi "^$HEADER:"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️ Missing${NC}"
    fi
}

check_header "X-Frame-Options"
check_header "X-Content-Type-Options"
check_header "X-XSS-Protection"
check_header "Strict-Transport-Security"

# Step 8: Check EC2 Instance (if instance ID provided)
if [ -n "$INSTANCE_ID" ]; then
    echo -e "\n${YELLOW}8️⃣ EC2 Instance Status${NC}"
    
    INSTANCE_STATE=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --region us-east-1 \
        --query 'Reservations[0].Instances[0].State.Name' \
        --output text 2>/dev/null || echo "unknown")
    
    echo -n "  Instance State: "
    if [ "$INSTANCE_STATE" = "running" ]; then
        echo -e "${GREEN}$INSTANCE_STATE ✅${NC}"
    else
        echo -e "${RED}$INSTANCE_STATE ❌${NC}"
        ALL_GOOD=false
    fi
    
    # Check instance metrics
    CPU=$(aws cloudwatch get-metric-statistics \
        --namespace AWS/EC2 \
        --metric-name CPUUtilization \
        --dimensions Name=InstanceId,Value="$INSTANCE_ID" \
        --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --statistics Average \
        --region us-east-1 \
        --query 'Datapoints[0].Average' \
        --output text 2>/dev/null || echo "N/A")
    
    if [ "$CPU" != "N/A" ] && [ "$CPU" != "None" ]; then
        CPU_INT=$(echo "$CPU" | cut -d. -f1)
        echo -n "  CPU Usage: "
        if [ "$CPU_INT" -lt 50 ]; then
            echo -e "${GREEN}${CPU_INT}% ✅${NC}"
        elif [ "$CPU_INT" -lt 80 ]; then
            echo -e "${YELLOW}${CPU_INT}% ⚠️${NC}"
        else
            echo -e "${RED}${CPU_INT}% ❌${NC}"
        fi
    fi
fi

# Step 9: Summary
echo -e "\n${BLUE}📊 Summary${NC}"
echo "=========="

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Your deployment is working correctly:"
    echo "  🌐 Frontend: https://$DOMAIN"
    echo "  🔌 API: https://$DOMAIN/api/*"
    echo "  🔒 SSL: Active and valid"
    echo "  📦 All components: Operational"
else
    echo -e "${RED}❌ Some checks failed${NC}"
    echo ""
    echo "Please review the errors above and:"
    echo "  1. Check EC2 instance is running"
    echo "  2. Verify Nginx is configured correctly"
    echo "  3. Ensure API container is running"
    echo "  4. Check Route53 DNS settings"
    echo "  5. Verify security group allows 80/443"
fi

echo ""
echo "To get more details, SSH into the EC2 instance and run:"
echo "  ./check-status.sh"
echo "  docker logs api"
echo "  sudo tail -f /var/log/nginx/error.log"

exit $([ "$ALL_GOOD" = true ] && echo 0 || echo 1)