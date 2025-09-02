# Testing Guide - Frontend and Backend Testing

**Date**: September 2, 2025  
**Purpose**: Comprehensive testing guide for frontend, backend, and integrated system testing

---

## 🎯 Current System Testing Overview

### Architecture to Test
```
Users → CloudFront (d1m7nnfj3im4kp.cloudfront.net)
    ├─ Frontend (/*) → S3 
    └─ API (/api/*) → EC2 Direct (ec2-52-0-112-85.compute-1.amazonaws.com:8080)
```

---

## 🖥️ Backend Testing (Standalone)

### **1. Direct EC2 API Testing**

#### Health Check
```bash
curl -s http://52.0.112.85:8080/health
# Expected: {"status":"healthy","timestamp":"...","environment":"production","uptime":...}
```

#### API Base Endpoint
```bash
curl -s http://52.0.112.85:8080/api
# Expected: {"success":true,"message":"AI Glossary Pro API","version":"2.0.0",...}
```

#### Core API Endpoints
```bash
# Terms endpoint
curl -s http://52.0.112.85:8080/api/terms | jq '.success'
# Expected: true

# Categories endpoint  
curl -s http://52.0.112.85:8080/api/categories | jq '.success'
# Expected: true

# API Documentation
curl -s http://52.0.112.85:8080/api/docs
# Expected: HTML documentation or redirect

# Search endpoint
curl -s "http://52.0.112.85:8080/api/search?q=machine" | jq '.success'
# Expected: true or false (depending on implementation)
```

#### Performance Testing
```bash
# Response time testing
time curl -s http://52.0.112.85:8080/api/health > /dev/null
# Expected: < 2 seconds

# Load testing (simple)
for i in {1..10}; do curl -s http://52.0.112.85:8080/api/health & done; wait
# Expected: All requests return 200 OK
```

#### Backend Logs
```bash
# SSH to EC2 and check logs
ssh -i your-key.pem ec2-user@52.0.112.85
sudo journalctl -u your-api-service -f
# OR
pm2 logs
```

### **2. Backend Health Indicators**
- ✅ HTTP 200 responses on all endpoints
- ✅ Response time < 2 seconds
- ✅ JSON responses properly formatted
- ✅ No error logs in system logs
- ✅ Process running (pm2 status or ps)

---

## 🎨 Frontend Testing (Standalone)

### **1. Direct S3 Testing via CloudFront**

#### Homepage Loading
```bash
curl -s https://d1m7nnfj3im4kp.cloudfront.net/ -w "Status: %{http_code}, Size: %{size_download}, Time: %{time_total}\n" > /dev/null
# Expected: Status: 200, reasonable size and time
```

#### Static Assets
```bash
# Test CSS loading
curl -s https://d1m7nnfj3im4kp.cloudfront.net/assets/index-*.css -I
# Expected: 200 OK, Content-Type: text/css

# Test JS loading  
curl -s https://d1m7nnfj3im4kp.cloudfront.net/assets/index-*.js -I
# Expected: 200 OK, Content-Type: application/javascript
```

#### Frontend Routing (SPA)
```bash
# Test 404 handling (should return index.html for SPA)
curl -s https://d1m7nnfj3im4kp.cloudfront.net/some-route -w "Status: %{http_code}\n" > /dev/null
# Expected: Status: 200 (returns index.html)

# Test assets path
curl -s https://d1m7nnfj3im4kp.cloudfront.net/assets/ -w "Status: %{http_code}\n"
# Expected: Status: 200 or 403 (should serve from S3)
```

### **2. Browser Testing**

#### Manual Browser Tests
```bash
# Open in browser
open https://d1m7nnfj3im4kp.cloudfront.net/

# Check browser console for:
# - No 404 errors on assets
# - No CORS errors
# - JavaScript loads and executes
# - React app renders properly
```

#### Frontend Performance
```bash
# Use lighthouse for performance testing
npx lighthouse https://d1m7nnfj3im4kp.cloudfront.net/ --output=json --output-path=lighthouse-report.json

# Check key metrics in report:
# - First Contentful Paint < 2s
# - Largest Contentful Paint < 4s  
# - Performance Score > 70
```

### **3. Frontend Health Indicators**
- ✅ Homepage loads without errors
- ✅ All static assets (CSS/JS) load successfully
- ✅ No 404 errors in browser console
- ✅ React app renders and is interactive
- ✅ Routing works for SPA paths
- ✅ Performance metrics within acceptable ranges

---

## 🔗 Integrated System Testing

### **1. End-to-End API Testing via CloudFront**

#### API Health via CDN
```bash
curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/health
# Expected: {"status":"healthy",...}
```

#### API Endpoints via CDN
```bash
# Test all major endpoints through CloudFront
curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/terms | jq '.success'
curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/categories | jq '.success'  
curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/ | jq '.success'

# Compare with direct EC2 responses
diff <(curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/health) <(curl -s http://52.0.112.85:8080/health)
# Expected: No differences (or minimal timestamp differences)
```

#### CORS Testing
```bash
# Test CORS headers for API requests
curl -s -I -X OPTIONS https://d1m7nnfj3im4kp.cloudfront.net/api/health
# Expected: Proper CORS headers if configured
```

### **2. Full User Journey Testing**

#### Complete User Flow
```bash
# 1. Load frontend
curl -s https://d1m7nnfj3im4kp.cloudfront.net/ > /tmp/frontend.html

# 2. Check if frontend can reach API (simulate browser)
# Extract API calls from frontend code or test manually in browser

# 3. Test API response times through CDN
time curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/health > /dev/null

# 4. Test caching behavior
curl -s -I https://d1m7nnfj3im4kp.cloudfront.net/api/health | grep -i cache
# Check cache headers
```

#### Mobile Testing
```bash
# Test with mobile user agent
curl -s https://d1m7nnfj3im4kp.cloudfront.net/ \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)" \
  -w "Status: %{http_code}, Size: %{size_download}\n" > /dev/null
```

### **3. Error Scenarios Testing**

#### API Failure Simulation
```bash
# Test when backend is down (stop EC2 temporarily)
# aws ec2 stop-instances --instance-ids i-045ff31e850f8b78d

# Test API endpoints while EC2 is stopped
curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/health -w "Status: %{http_code}\n"
# Expected: 5xx errors

# Test frontend still works
curl -s https://d1m7nnfj3im4kp.cloudfront.net/ -w "Status: %{http_code}\n"
# Expected: 200 OK (frontend should still load)

# Restart EC2
# aws ec2 start-instances --instance-ids i-045ff31e850f8b78d
```

#### CloudFront Cache Testing
```bash
# Test cache invalidation
aws cloudfront create-invalidation --distribution-id ESF8YR50LSGU8 --paths "/api/health"

# Test response before and after cache clear
curl -s -I https://d1m7nnfj3im4kp.cloudfront.net/api/health | grep -E "(X-Cache|Age)"
```

---

## 🧪 Automated Testing Scripts

### **1. Backend Health Check Script**
```bash
#!/bin/bash
# backend-health-check.sh

echo "🔍 Backend Health Check..."

# Test direct EC2 access
if curl -s -f http://52.0.112.85:8080/health > /dev/null; then
    echo "✅ Direct EC2 API: HEALTHY"
else
    echo "❌ Direct EC2 API: FAILED"
    exit 1
fi

# Test key endpoints
endpoints=("health" "api" "api/terms" "api/categories")
for endpoint in "${endpoints[@]}"; do
    if curl -s -f "http://52.0.112.85:8080/$endpoint" > /dev/null; then
        echo "✅ /$endpoint: OK"
    else
        echo "❌ /$endpoint: FAILED"
    fi
done

echo "✅ Backend health check completed"
```

### **2. Frontend Health Check Script**
```bash
#!/bin/bash
# frontend-health-check.sh

echo "🔍 Frontend Health Check..."

# Test homepage
if curl -s -f https://d1m7nnfj3im4kp.cloudfront.net/ > /dev/null; then
    echo "✅ Frontend homepage: LOADING"
else
    echo "❌ Frontend homepage: FAILED"
    exit 1
fi

# Test static assets (approximate)
if curl -s -I https://d1m7nnfj3im4kp.cloudfront.net/assets/ 2>/dev/null | grep -q "200\|404"; then
    echo "✅ Assets path: ACCESSIBLE"
else
    echo "❌ Assets path: FAILED"
fi

echo "✅ Frontend health check completed"
```

### **3. Integrated System Check Script**
```bash
#!/bin/bash
# system-health-check.sh

echo "🔍 Full System Health Check..."

# Frontend via CloudFront
if curl -s -f https://d1m7nnfj3im4kp.cloudfront.net/ > /dev/null; then
    echo "✅ Frontend via CloudFront: OK"
else
    echo "❌ Frontend via CloudFront: FAILED"
fi

# API via CloudFront
if curl -s -f https://d1m7nnfj3im4kp.cloudfront.net/api/health > /dev/null; then
    echo "✅ API via CloudFront: OK"
else
    echo "❌ API via CloudFront: FAILED"
fi

# Compare direct vs CDN API response
direct_response=$(curl -s http://52.0.112.85:8080/health | jq -r '.status' 2>/dev/null)
cdn_response=$(curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/health | jq -r '.status' 2>/dev/null)

if [ "$direct_response" = "$cdn_response" ] && [ "$direct_response" = "healthy" ]; then
    echo "✅ Direct vs CDN consistency: OK"
else
    echo "❌ Direct vs CDN consistency: MISMATCH"
    echo "   Direct: $direct_response"
    echo "   CDN: $cdn_response"
fi

echo "✅ System health check completed"
```

---

## 🔄 CI/CD Testing Integration

### **1. Pre-deployment Tests**
```bash
# Add to your deployment pipeline
# 1. Test backend directly
./scripts/backend-health-check.sh

# 2. Test frontend build
npm run build && npm run test

# 3. Integration test
./scripts/system-health-check.sh
```

### **2. Post-deployment Validation**
```bash
# After deployment, verify:
# 1. CloudFront cache cleared
aws cloudfront create-invalidation --distribution-id ESF8YR50LSGU8 --paths "/*"

# 2. Wait for deployment
sleep 30

# 3. Run full system check
./scripts/system-health-check.sh

# 4. Performance validation
time curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/health > /dev/null
```

---

## 📊 Monitoring and Alerting

### **1. Key Metrics to Monitor**
- **Response Time**: API calls < 2 seconds
- **Success Rate**: > 99% for health checks  
- **Frontend Load Time**: < 5 seconds
- **Error Rates**: < 1% for critical endpoints

### **2. CloudWatch Alarms (Optional)**
```bash
# Create CloudWatch alarm for EC2 CPU
aws cloudwatch put-metric-alarm \
  --alarm-name "EC2-High-CPU" \
  --alarm-description "EC2 CPU usage > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=InstanceId,Value=i-045ff31e850f8b78d
```

### **3. Simple Uptime Monitoring**
```bash
# Cron job for basic monitoring (every 5 minutes)
*/5 * * * * curl -s -f https://d1m7nnfj3im4kp.cloudfront.net/api/health > /dev/null || echo "API DOWN" | mail -s "API Alert" admin@yourdomain.com
```

---

## 🚨 Troubleshooting Guide

### **Frontend Issues**
- **404 on assets**: Check S3 bucket contents and CloudFront origins
- **Blank page**: Check browser console for JavaScript errors
- **Slow loading**: Check CloudFront cache hit rates

### **Backend Issues** 
- **503 errors**: Check EC2 instance status and application logs
- **Timeout errors**: Check EC2 security groups and application health
- **Wrong responses**: Compare direct EC2 vs CloudFront responses

### **Integration Issues**
- **CORS errors**: Check API CORS configuration
- **Cache problems**: Clear CloudFront cache and test
- **DNS issues**: Verify EC2 public DNS name hasn't changed

---

**This testing guide ensures comprehensive validation of your direct CloudFront → EC2 architecture.**