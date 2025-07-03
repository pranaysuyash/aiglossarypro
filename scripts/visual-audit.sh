#!/bin/bash

# Visual Audit Script for AIGlossaryPro Landing Page
# This script captures screenshots of the landing page to validate technical findings

# Set up variables
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
AUDIT_DIR="visual-audit-results/${TIMESTAMP}"
BASE_URL="http://localhost:5173"

# Create audit directory
mkdir -p "${AUDIT_DIR}"

# Function to take screenshot using Chrome headless
take_screenshot() {
    local url=$1
    local output=$2
    local viewport=$3
    local description=$4
    
    echo "Capturing: ${description}"
    
    # Using Chrome headless mode with specific viewport
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
        --headless \
        --disable-gpu \
        --screenshot="${output}" \
        --window-size="${viewport}" \
        "${url}"
    
    if [ $? -eq 0 ]; then
        echo "✓ Saved: ${output}"
    else
        echo "✗ Failed to capture: ${description}"
    fi
}

# Function to capture specific element
capture_element() {
    local url=$1
    local output=$2
    local selector=$3
    local description=$4
    
    echo "Capturing element: ${description}"
    
    # Create a temporary HTML file with JavaScript to scroll to and highlight element
    cat > "${AUDIT_DIR}/capture_element.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <script>
        window.onload = function() {
            // Redirect to the actual page with element highlight
            const targetUrl = '${url}';
            const selector = '${selector}';
            
            // Store selector in sessionStorage to use after redirect
            sessionStorage.setItem('highlightSelector', selector);
            window.location.href = targetUrl;
        }
    </script>
</head>
<body>Redirecting...</body>
</html>
EOF
}

echo "Starting Visual Audit - ${TIMESTAMP}"
echo "=================================="
echo "Target URL: ${BASE_URL}"
echo ""

# 1. Full page screenshots - Desktop
echo "1. Capturing full page - Desktop view"
take_screenshot "${BASE_URL}" "${AUDIT_DIR}/01-landing-page-desktop-full.png" "1920,1080" "Full landing page - Desktop"

# 2. Full page screenshots - Mobile
echo -e "\n2. Capturing full page - Mobile view"
take_screenshot "${BASE_URL}" "${AUDIT_DIR}/02-landing-page-mobile-full.png" "375,812" "Full landing page - Mobile (iPhone X)"

# 3. Full page screenshots - Tablet
echo -e "\n3. Capturing full page - Tablet view"
take_screenshot "${BASE_URL}" "${AUDIT_DIR}/03-landing-page-tablet-full.png" "768,1024" "Full landing page - Tablet (iPad)"

# 4. Specific sections with focused viewport
echo -e "\n4. Capturing hero section with focused viewport"
# Capture top portion of the page where hero section is located
take_screenshot "${BASE_URL}" "${AUDIT_DIR}/04-hero-section-desktop.png" "1920,800" "Hero section focus - Desktop"

# 5. Mobile hero section
echo -e "\n5. Capturing mobile hero section"
take_screenshot "${BASE_URL}" "${AUDIT_DIR}/05-hero-section-mobile.png" "375,600" "Hero section focus - Mobile"

# 6. Create a detailed audit report
echo -e "\n6. Creating audit report"
cat > "${AUDIT_DIR}/VISUAL_AUDIT_REPORT.md" << EOF
# Visual Audit Report
Generated: ${TIMESTAMP}

## Audit Scope
This visual audit focuses on validating the technical findings from the codebase analysis:

### Key Issues to Validate:
1. **Hero Section Button**: "See What's Inside" button color and prominence
2. **Header Buttons**: "Get Access" vs "Sign In" consistency
3. **Money-Back Guarantee**: Presence and visibility of "30-day money back guarantee" text
4. **Visual Hierarchy**: Overall design consistency and button styling
5. **Color Consistency**: Button colors across different sections

## Screenshots Captured:

### 1. Full Page Views
- **Desktop (1920x1080)**: 01-landing-page-desktop-full.png
- **Mobile (375x812)**: 02-landing-page-mobile-full.png
- **Tablet (768x1024)**: 03-landing-page-tablet-full.png

### 2. Focused Views
- **Hero Section Desktop**: 04-hero-section-desktop.png
- **Hero Section Mobile**: 05-hero-section-mobile.png

## Technical Findings to Validate:

### Button Styling Issues:
- Hero button uses light gray background (#f3f4f6)
- Should use primary blue (#10B981 or #3B82F6)
- Header shows both "Get Access" and "Sign In" buttons

### Missing Elements:
- No "30-day money back guarantee" text found in codebase
- Trust indicators may be missing

### Visual Hierarchy:
- Hero button may not stand out sufficiently
- Call-to-action prominence needs evaluation

## Next Steps:
1. Review screenshots for visual confirmation of issues
2. Compare actual rendering with code analysis
3. Document any additional issues found
4. Prioritize fixes based on visual impact

---
*This report was generated automatically by the visual audit script*
EOF

# 7. Create a Python script for more detailed analysis
echo -e "\n7. Creating Python analysis script"
cat > "${AUDIT_DIR}/analyze_screenshots.py" << 'EOF'
#!/usr/bin/env python3
"""
Screenshot Analysis Script
Analyzes the captured screenshots for specific visual issues
"""

import os
import sys
from datetime import datetime

def analyze_screenshots(audit_dir):
    """Analyze screenshots in the audit directory"""
    
    print("Screenshot Analysis")
    print("==================")
    print(f"Analyzing screenshots in: {audit_dir}")
    print()
    
    # List all PNG files
    screenshots = [f for f in os.listdir(audit_dir) if f.endswith('.png')]
    
    if not screenshots:
        print("No screenshots found!")
        return
    
    print(f"Found {len(screenshots)} screenshots:")
    for screenshot in sorted(screenshots):
        file_path = os.path.join(audit_dir, screenshot)
        file_size = os.path.getsize(file_path) / 1024  # KB
        print(f"  - {screenshot} ({file_size:.1f} KB)")
    
    print("\n" + "="*50)
    print("Manual Review Checklist:")
    print("="*50)
    
    checklist = [
        "Hero Section 'See What's Inside' Button:",
        "  [ ] Is the button visible?",
        "  [ ] What color is the button background?",
        "  [ ] Does it stand out from the background?",
        "  [ ] Is the text readable?",
        "",
        "Header Navigation:",
        "  [ ] Are 'Get Access' and 'Sign In' both visible?",
        "  [ ] Are they styled consistently?",
        "  [ ] Which one is more prominent?",
        "",
        "Money-Back Guarantee:",
        "  [ ] Is '30-day money back guarantee' visible?",
        "  [ ] Where is it located?",
        "  [ ] Is it prominent enough?",
        "",
        "Overall Visual Hierarchy:",
        "  [ ] Is the primary CTA clear?",
        "  [ ] Are buttons consistent in style?",
        "  [ ] Is the color scheme cohesive?",
        "  [ ] Are there any visual bugs or misalignments?"
    ]
    
    for item in checklist:
        print(item)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        analyze_screenshots(sys.argv[1])
    else:
        print("Usage: python analyze_screenshots.py <audit_directory>")
EOF

chmod +x "${AUDIT_DIR}/analyze_screenshots.py"

# 8. Run the analysis script
echo -e "\n8. Running analysis script"
python3 "${AUDIT_DIR}/analyze_screenshots.py" "${AUDIT_DIR}"

# 9. Create an HTML viewer for easy screenshot review
echo -e "\n9. Creating HTML viewer"
cat > "${AUDIT_DIR}/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Audit Results - ${TIMESTAMP}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1, h2 {
            color: #333;
        }
        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .screenshot-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .screenshot-card img {
            width: 100%;
            height: auto;
            display: block;
            cursor: pointer;
        }
        .screenshot-card h3 {
            margin: 0;
            padding: 15px;
            font-size: 16px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        .fullscreen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: none;
            z-index: 1000;
            cursor: pointer;
        }
        .fullscreen img {
            max-width: 90%;
            max-height: 90%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        .checklist {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .checklist h3 {
            margin-top: 0;
        }
        .checklist ul {
            list-style: none;
            padding-left: 0;
        }
        .checklist li {
            padding: 5px 0;
            display: flex;
            align-items: center;
        }
        .checklist input[type="checkbox"] {
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Visual Audit Results</h1>
        <p>Generated: ${TIMESTAMP}</p>
        
        <div class="checklist">
            <h3>Visual Review Checklist</h3>
            <ul>
                <li><input type="checkbox"> Hero button uses appropriate color (not gray #f3f4f6)</li>
                <li><input type="checkbox"> "See What's Inside" button is prominent and clickable</li>
                <li><input type="checkbox"> Header shows consistent button styling</li>
                <li><input type="checkbox"> "30-day money back guarantee" is visible</li>
                <li><input type="checkbox"> Visual hierarchy guides user attention</li>
                <li><input type="checkbox"> Color scheme is consistent throughout</li>
                <li><input type="checkbox"> Mobile view is properly responsive</li>
                <li><input type="checkbox"> No visual bugs or misalignments</li>
            </ul>
        </div>
        
        <h2>Screenshots</h2>
        <div class="screenshot-grid">
            <div class="screenshot-card">
                <h3>Desktop - Full Page</h3>
                <img src="01-landing-page-desktop-full.png" alt="Desktop Full Page" onclick="showFullscreen(this)">
            </div>
            <div class="screenshot-card">
                <h3>Mobile - Full Page</h3>
                <img src="02-landing-page-mobile-full.png" alt="Mobile Full Page" onclick="showFullscreen(this)">
            </div>
            <div class="screenshot-card">
                <h3>Tablet - Full Page</h3>
                <img src="03-landing-page-tablet-full.png" alt="Tablet Full Page" onclick="showFullscreen(this)">
            </div>
            <div class="screenshot-card">
                <h3>Hero Section - Desktop</h3>
                <img src="04-hero-section-desktop.png" alt="Hero Section Desktop" onclick="showFullscreen(this)">
            </div>
            <div class="screenshot-card">
                <h3>Hero Section - Mobile</h3>
                <img src="05-hero-section-mobile.png" alt="Hero Section Mobile" onclick="showFullscreen(this)">
            </div>
        </div>
    </div>
    
    <div class="fullscreen" onclick="hideFullscreen()">
        <img src="" alt="Fullscreen view">
    </div>
    
    <script>
        function showFullscreen(img) {
            const fullscreen = document.querySelector('.fullscreen');
            const fullscreenImg = fullscreen.querySelector('img');
            fullscreenImg.src = img.src;
            fullscreen.style.display = 'block';
        }
        
        function hideFullscreen() {
            document.querySelector('.fullscreen').style.display = 'none';
        }
        
        // Save checklist state
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                localStorage.setItem('checklist-' + this.parentElement.textContent.trim(), this.checked);
            });
            
            // Restore state
            const saved = localStorage.getItem('checklist-' + checkbox.parentElement.textContent.trim());
            if (saved === 'true') {
                checkbox.checked = true;
            }
        });
    </script>
</body>
</html>
EOF

echo -e "\n✅ Visual audit complete!"
echo "📁 Results saved to: ${AUDIT_DIR}"
echo "📋 Report: ${AUDIT_DIR}/VISUAL_AUDIT_REPORT.md"
echo "🌐 HTML Viewer: ${AUDIT_DIR}/index.html"
echo ""
echo "To view the results:"
echo "  1. Open ${AUDIT_DIR}/index.html in a browser"
echo "  2. Review ${AUDIT_DIR}/VISUAL_AUDIT_REPORT.md"
echo "  3. Check individual screenshots in ${AUDIT_DIR}/"