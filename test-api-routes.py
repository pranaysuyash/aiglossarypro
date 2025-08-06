#\!/usr/bin/env python3
import requests
import json
from datetime import datetime

ALB_URL = "http://aiglossarypro-api-alb-1884179415.us-east-1.elb.amazonaws.com"
CF_URL = "https://d1m7nnfj3im4kp.cloudfront.net"

# Color codes
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'

def test_endpoint(name, method, url, data=None, headers=None):
    """Test a single endpoint"""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=5)
        else:
            response = requests.request(method, url, json=data, headers=headers, timeout=5)
        
        status = response.status_code
        
        # Try to parse JSON response
        try:
            body = response.json()
            body_str = json.dumps(body, ensure_ascii=False)[:100]
        except:
            body_str = response.text[:100]
        
        # Color based on status
        if 200 <= status < 300:
            print(f"{GREEN}✓{RESET} {name}: {status} - {body_str}...")
        elif 400 <= status < 500:
            print(f"{YELLOW}⚠{RESET} {name}: {status} - {body_str}...")
        else:
            print(f"{RED}✗{RESET} {name}: {status} - {body_str}...")
            
        return status, body_str
    except Exception as e:
        print(f"{RED}✗{RESET} {name}: ERROR - {str(e)}")
        return 0, str(e)

def test_all_routes():
    """Test all API routes"""
    print(f"{BLUE}=== API Route Testing - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ==={RESET}\n")
    
    # Define all routes to test
    routes = [
        # Core routes
        ("Terms List", "GET", "/api/terms"),
        ("Term by ID", "GET", "/api/terms/1"),
        ("Invalid Term", "GET", "/api/terms/99999"),
        
        # Search routes
        ("Search with query", "GET", "/api/search?q=Machine"),
        ("Search empty query", "GET", "/api/search?q="),
        ("Search no param", "GET", "/api/search"),
        
        # Category routes
        ("Categories List", "GET", "/api/categories"),
        ("Category by slug", "GET", "/api/categories/machine-learning"),
        
        # Auth routes
        ("Auth Status", "GET", "/api/auth/status"),
        ("Login", "POST", "/api/auth/login", {"email": "test@example.com", "password": "test123"}),
        ("Logout", "POST", "/api/auth/logout"),
        
        # User routes
        ("User Profile", "GET", "/api/user/profile"),
        ("User Favorites", "GET", "/api/user/favorites"),
        ("User Progress", "GET", "/api/user/progress"),
        
        # Content routes
        ("Content Accessibility", "GET", "/api/content/accessibility/term/1"),
        ("Beginner Terms", "GET", "/api/content/beginner-friendly"),
        
        # Analytics routes
        ("Analytics Overview", "GET", "/api/analytics/overview"),
        ("Popular Terms", "GET", "/api/analytics/popular"),
        ("Search Analytics", "GET", "/api/analytics/search"),
        
        # Section routes
        ("Sections List", "GET", "/api/sections"),
        ("Section by ID", "GET", "/api/sections/1"),
        
        # Daily terms routes
        ("Today's Term", "GET", "/api/daily-terms/today"),
        ("Daily History", "GET", "/api/daily-terms/history"),
        
        # Export routes
        ("Export JSON", "GET", "/api/export/terms?format=json"),
        ("Export CSV", "GET", "/api/export/terms?format=csv"),
        
        # Admin routes (should require auth)
        ("Admin Stats", "GET", "/api/admin/stats"),
        ("Admin Users", "GET", "/api/admin/users"),
        
        # AI routes
        ("Generate Definition", "POST", "/api/ai/generate-definition", {"term": "Neural Network"}),
        ("Generate Examples", "POST", "/api/ai/generate-examples", {"termId": "1"}),
        
        # Feedback routes
        ("Submit Feedback", "POST", "/api/feedback", {"termId": "1", "type": "improvement", "content": "Test"}),
        ("Get Feedback", "GET", "/api/feedback/term/1"),
    ]
    
    # Test CloudFront endpoints
    print(f"{BLUE}CloudFront Endpoints ({CF_URL}):{RESET}")
    print("=" * 60)
    cf_results = []
    for name, method, path, *args in routes:
        data = args[0] if args else None
        status, body = test_endpoint(name, method, CF_URL + path, data)
        cf_results.append((name, status))
    
    print(f"\n{BLUE}Direct ALB Endpoints ({ALB_URL}):{RESET}")
    print("=" * 60)
    alb_results = []
    for name, method, path, *args in routes:
        data = args[0] if args else None
        status, body = test_endpoint(name, method, ALB_URL + path, data)
        alb_results.append((name, status))
    
    # Summary
    print(f"\n{BLUE}=== Summary ==={RESET}")
    cf_success = sum(1 for _, status in cf_results if 200 <= status < 300)
    alb_success = sum(1 for _, status in alb_results if 200 <= status < 300)
    
    print(f"CloudFront: {cf_success}/{len(cf_results)} endpoints successful")
    print(f"ALB Direct: {alb_success}/{len(alb_results)} endpoints successful")
    
    # List working endpoints
    print(f"\n{BLUE}Working CloudFront Endpoints:{RESET}")
    for name, status in cf_results:
        if 200 <= status < 300:
            print(f"  {GREEN}✓{RESET} {name}")
    
    print(f"\n{BLUE}Failed CloudFront Endpoints:{RESET}")
    for name, status in cf_results:
        if status == 0 or status >= 400:
            print(f"  {RED}✗{RESET} {name} ({status})")

if __name__ == "__main__":
    test_all_routes()
