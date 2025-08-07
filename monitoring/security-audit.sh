#!/bin/bash

# Security Audit Script for AIGlossaryPro API
# Date: 2025-08-06
# API Base URL: https://d1m7nnfj3im4kp.cloudfront.net/api

set -e

API_BASE="https://d1m7nnfj3im4kp.cloudfront.net/api"
RESULTS_DIR="monitoring/results"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
AUDIT_FILE="$RESULTS_DIR/security_audit_$TIMESTAMP.txt"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "=== AIGlossaryPro API Security Audit ===" | tee "$AUDIT_FILE"
echo "Timestamp: $(date)" | tee -a "$AUDIT_FILE"
echo "API Base URL: $API_BASE" | tee -a "$AUDIT_FILE"
echo "============================================" | tee -a "$AUDIT_FILE"
echo "" | tee -a "$AUDIT_FILE"

# Function to check security headers
check_security_headers() {
    local endpoint="$1"
    local name="$2"
    
    echo "=== Security Headers Analysis: $name ===" | tee -a "$AUDIT_FILE"
    echo "Endpoint: $endpoint" | tee -a "$AUDIT_FILE"
    echo "" | tee -a "$AUDIT_FILE"
    
    # Get all headers
    headers=$(curl -I -s "$API_BASE$endpoint")
    echo "$headers" | tee -a "$AUDIT_FILE"
    echo "" | tee -a "$AUDIT_FILE"
    
    # Check for important security headers
    echo "Security Headers Check:" | tee -a "$AUDIT_FILE"
    
    if echo "$headers" | grep -qi "x-frame-options"; then
        echo "✅ X-Frame-Options: Present" | tee -a "$AUDIT_FILE"
    else
        echo "❌ X-Frame-Options: Missing" | tee -a "$AUDIT_FILE"
    fi
    
    if echo "$headers" | grep -qi "x-content-type-options"; then
        echo "✅ X-Content-Type-Options: Present" | tee -a "$AUDIT_FILE"
    else
        echo "❌ X-Content-Type-Options: Missing" | tee -a "$AUDIT_FILE"
    fi
    
    if echo "$headers" | grep -qi "strict-transport-security"; then
        echo "✅ Strict-Transport-Security: Present" | tee -a "$AUDIT_FILE"
    else
        echo "❌ Strict-Transport-Security: Missing" | tee -a "$AUDIT_FILE"
    fi
    
    if echo "$headers" | grep -qi "x-xss-protection"; then
        echo "✅ X-XSS-Protection: Present" | tee -a "$AUDIT_FILE"
    else
        echo "❌ X-XSS-Protection: Missing" | tee -a "$AUDIT_FILE"
    fi
    
    if echo "$headers" | grep -qi "content-security-policy"; then
        echo "✅ Content-Security-Policy: Present" | tee -a "$AUDIT_FILE"
    else
        echo "❌ Content-Security-Policy: Missing" | tee -a "$AUDIT_FILE"
    fi
    
    if echo "$headers" | grep -qi "referrer-policy"; then
        echo "✅ Referrer-Policy: Present" | tee -a "$AUDIT_FILE"
    else
        echo "❌ Referrer-Policy: Missing" | tee -a "$AUDIT_FILE"
    fi
    
    # Check for information disclosure
    if echo "$headers" | grep -qi "x-powered-by"; then
        powered_by=$(echo "$headers" | grep -i "x-powered-by" | head -1)
        echo "⚠️  Information Disclosure: $powered_by" | tee -a "$AUDIT_FILE"
    else
        echo "✅ X-Powered-By: Not disclosed" | tee -a "$AUDIT_FILE"
    fi
    
    if echo "$headers" | grep -qi "server:"; then
        server=$(echo "$headers" | grep -i "server:" | head -1)
        echo "⚠️  Server Information: $server" | tee -a "$AUDIT_FILE"
    else
        echo "✅ Server: Not disclosed" | tee -a "$AUDIT_FILE"
    fi
    
    echo "" | tee -a "$AUDIT_FILE"
}

# Function to test for common vulnerabilities
test_vulnerabilities() {
    echo "=== Vulnerability Tests ===" | tee -a "$AUDIT_FILE"
    echo "" | tee -a "$AUDIT_FILE"
    
    # Test for SQL injection (basic)
    echo "Testing for SQL Injection patterns:" | tee -a "$AUDIT_FILE"
    for payload in "'; DROP TABLE--" "1' OR '1'='1" "admin'--"; do
        echo "Testing payload: $payload" | tee -a "$AUDIT_FILE"
        response=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/search?q=$payload" 2>/dev/null || echo "000")
        if [ "$response" = "500" ]; then
            echo "⚠️  Potential vulnerability: Server error on payload" | tee -a "$AUDIT_FILE"
        else
            echo "✅ Response code: $response" | tee -a "$AUDIT_FILE"
        fi
    done
    echo "" | tee -a "$AUDIT_FILE"
    
    # Test for XSS (basic)
    echo "Testing for XSS patterns:" | tee -a "$AUDIT_FILE"
    xss_payload="<script>alert('xss')</script>"
    response=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/search?q=$xss_payload" 2>/dev/null || echo "000")
    echo "XSS payload response: $response" | tee -a "$AUDIT_FILE"
    echo "" | tee -a "$AUDIT_FILE"
    
    # Test for directory traversal
    echo "Testing for Directory Traversal:" | tee -a "$AUDIT_FILE"
    for payload in "../../etc/passwd" "..\\..\\windows\\system32\\config\\sam" "../../../etc/hosts"; do
        response=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/search?q=$payload" 2>/dev/null || echo "000")
        echo "Traversal payload '$payload': $response" | tee -a "$AUDIT_FILE"
    done
    echo "" | tee -a "$AUDIT_FILE"
}

# Function to check SSL/TLS configuration
check_ssl_tls() {
    echo "=== SSL/TLS Configuration ===" | tee -a "$AUDIT_FILE"
    echo "" | tee -a "$AUDIT_FILE"
    
    # Check SSL Labs grade (if openssl is available)
    if command -v openssl >/dev/null 2>&1; then
        echo "SSL Certificate Information:" | tee -a "$AUDIT_FILE"
        echo | openssl s_client -servername d1m7nnfj3im4kp.cloudfront.net -connect d1m7nnfj3im4kp.cloudfront.net:443 2>/dev/null | openssl x509 -noout -text | grep -E "(Subject|Issuer|Not Before|Not After)" | tee -a "$AUDIT_FILE"
        echo "" | tee -a "$AUDIT_FILE"
    fi
    
    # Check HTTPS enforcement
    echo "Testing HTTPS enforcement:" | tee -a "$AUDIT_FILE"
    http_response=$(curl -s -w "%{http_code}" -o /dev/null "http://d1m7nnfj3im4kp.cloudfront.net/api/health" 2>/dev/null || echo "000")
    if [ "$http_response" = "301" ] || [ "$http_response" = "302" ]; then
        echo "✅ HTTP to HTTPS redirect: $http_response" | tee -a "$AUDIT_FILE"
    else
        echo "⚠️  HTTP response: $http_response" | tee -a "$AUDIT_FILE"
    fi
    echo "" | tee -a "$AUDIT_FILE"
}

# Function to check rate limiting
check_rate_limiting() {
    echo "=== Rate Limiting Test ===" | tee -a "$AUDIT_FILE"
    echo "" | tee -a "$AUDIT_FILE"
    
    echo "Sending 10 rapid requests to test rate limiting..." | tee -a "$AUDIT_FILE"
    for i in {1..10}; do
        response=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/health" 2>/dev/null || echo "000")
        echo "Request $i: $response" | tee -a "$AUDIT_FILE"
        if [ "$response" = "429" ]; then
            echo "✅ Rate limiting detected at request $i" | tee -a "$AUDIT_FILE"
            break
        fi
    done
    echo "" | tee -a "$AUDIT_FILE"
}

# Function to check CORS configuration
check_cors() {
    echo "=== CORS Configuration ===" | tee -a "$AUDIT_FILE"
    echo "" | tee -a "$AUDIT_FILE"
    
    # Test CORS headers
    cors_response=$(curl -s -I -H "Origin: https://malicious-site.com" "$API_BASE/health")
    echo "CORS test with external origin:" | tee -a "$AUDIT_FILE"
    echo "$cors_response" | grep -i "access-control" | tee -a "$AUDIT_FILE"
    
    if echo "$cors_response" | grep -qi "access-control-allow-origin: \*"; then
        echo "⚠️  CORS allows all origins (*)" | tee -a "$AUDIT_FILE"
    elif echo "$cors_response" | grep -qi "access-control-allow-origin"; then
        echo "✅ CORS configured with specific origins" | tee -a "$AUDIT_FILE"
    else
        echo "✅ No CORS headers found (restrictive)" | tee -a "$AUDIT_FILE"
    fi
    echo "" | tee -a "$AUDIT_FILE"
}

# Run all security checks
echo "Starting comprehensive security audit..." | tee -a "$AUDIT_FILE"
echo "" | tee -a "$AUDIT_FILE"

check_security_headers "/health" "Health Endpoint"
check_security_headers "/terms" "Terms Endpoint"
check_ssl_tls
test_vulnerabilities
check_rate_limiting
check_cors

echo "=== Security Audit Summary ===" | tee -a "$AUDIT_FILE"
echo "" | tee -a "$AUDIT_FILE"
echo "Completed at: $(date)" | tee -a "$AUDIT_FILE"
echo "Full report saved to: $AUDIT_FILE" | tee -a "$AUDIT_FILE"
echo "" | tee -a "$AUDIT_FILE"

echo "Security audit completed. Check $AUDIT_FILE for full results."