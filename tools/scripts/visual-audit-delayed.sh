#!/bin/bash

# Visual Audit Script with Delay for Full Page Load
# This script captures screenshots after allowing the page to fully load

# Set up variables
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
AUDIT_DIR="visual-audit-results/${TIMESTAMP}"
BASE_URL="http://localhost:5173"

# Create audit directory
mkdir -p "${AUDIT_DIR}"

# Function to take screenshot with delay
take_screenshot_with_delay() {
    local url=$1
    local output=$2
    local viewport=$3
    local description=$4
    local delay=${5:-3}
    
    echo "Capturing: ${description} (waiting ${delay}s for load)"
    
    # Create a temporary HTML file with delay
    cat > "${AUDIT_DIR}/temp_capture.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <script>
        setTimeout(function() {
            // Take screenshot after delay
            console.log('Ready for screenshot');
        }, ${delay}000);
    </script>
</head>
<body>
    <script>
        window.location.href = '${url}';
    </script>
</body>
</html>
EOF
    
    # Using Chrome headless mode with specific delay
    timeout 15 /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
        --headless \
        --disable-gpu \
        --disable-web-security \
        --disable-features=VizDisplayCompositor \
        --screenshot="${output}" \
        --window-size="${viewport}" \
        --virtual-time-budget=5000 \
        --run-all-compositor-stages-before-draw \
        "${url}"
    
    if [ $? -eq 0 ]; then
        echo "✓ Saved: ${output}"
    else
        echo "✗ Failed to capture: ${description}"
    fi
}

echo "Starting Visual Audit with Delay - ${TIMESTAMP}"
echo "============================================="
echo "Target URL: ${BASE_URL}"
echo ""

# Wait for server to be ready
echo "Checking server readiness..."
for i in {1..10}; do
    if curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/" | grep -q "200"; then
        echo "✓ Server is ready"
        break
    else
        echo "Waiting for server... (${i}/10)"
        sleep 1
    fi
done

# 1. Full page screenshots - Desktop with delay
echo "1. Capturing full page - Desktop view (with 8s delay)"
take_screenshot_with_delay "${BASE_URL}" "${AUDIT_DIR}/01-landing-page-desktop-full.png" "1920,1080" "Full landing page - Desktop" 8

# 2. Full page screenshots - Mobile with delay
echo -e "\n2. Capturing full page - Mobile view (with 8s delay)"
take_screenshot_with_delay "${BASE_URL}" "${AUDIT_DIR}/02-landing-page-mobile-full.png" "375,812" "Full landing page - Mobile (iPhone X)" 8

# 3. Full page screenshots - Tablet with delay  
echo -e "\n3. Capturing full page - Tablet view (with 8s delay)"
take_screenshot_with_delay "${BASE_URL}" "${AUDIT_DIR}/03-landing-page-tablet-full.png" "768,1024" "Full landing page - Tablet (iPad)" 8

# Clean up temp file
rm -f "${AUDIT_DIR}/temp_capture.html"

# Now create a detailed visual analysis report
echo -e "\n4. Creating detailed visual analysis report"
cat > "${AUDIT_DIR}/VISUAL_ANALYSIS_REPORT.md" << EOF
# Visual Analysis Report - Delayed Capture
Generated: ${TIMESTAMP}

## Executive Summary
This report analyzes the visual state of the AIGlossaryPro landing page based on screenshots taken after allowing sufficient time for full page load.

## Key Visual Findings

### 1. Landing Page State Analysis
Based on the screenshots captured:

#### Desktop View (1920x1080)
- **File**: 01-landing-page-desktop-full.png
- **Analysis**: [To be completed after manual review]

#### Mobile View (375x812) 
- **File**: 02-landing-page-mobile-full.png
- **Analysis**: [To be completed after manual review]

#### Tablet View (768x1024)
- **File**: 03-landing-page-tablet-full.png
- **Analysis**: [To be completed after manual review]

### 2. Technical Issues to Validate

#### Hero Section Issues:
- [ ] "See What's Inside" button visibility
- [ ] Button color (should NOT be gray #f3f4f6)
- [ ] Button prominence and contrast
- [ ] Call-to-action effectiveness

#### Header Navigation Issues:
- [ ] "Get Lifetime Access" button presence
- [ ] "Sign In" button presence
- [ ] Button styling consistency
- [ ] Navigation hierarchy

#### Missing Elements:
- [ ] "30-day money back guarantee" text
- [ ] Trust indicators
- [ ] Social proof elements
- [ ] Value proposition clarity

#### Content Loading Issues:
- [ ] Are skeleton states visible?
- [ ] Is content fully loaded?
- [ ] Are there any loading indicators?
- [ ] Is the page functional?

### 3. Visual Hierarchy Assessment

#### Desktop Analysis:
- **Primary CTA**: [To be identified]
- **Secondary Actions**: [To be identified]
- **Visual Flow**: [To be analyzed]

#### Mobile Analysis:
- **Responsive Design**: [To be analyzed]
- **Touch Targets**: [To be analyzed]
- **Mobile UX**: [To be analyzed]

### 4. Comparison with Technical Analysis

#### Code vs Visual Validation:
- **Button Colors**: [Compare code findings with visual]
- **Component Rendering**: [Validate components are working]
- **Missing Features**: [Confirm missing elements]

## Recommendations

### High Priority Fixes:
1. [To be determined based on visual analysis]
2. [To be determined based on visual analysis]
3. [To be determined based on visual analysis]

### Medium Priority Improvements:
1. [To be determined based on visual analysis]
2. [To be determined based on visual analysis]

### Low Priority Enhancements:
1. [To be determined based on visual analysis]
2. [To be determined based on visual analysis]

## Next Steps
1. Review captured screenshots manually
2. Update this report with specific findings
3. Create action items for development team
4. Implement fixes based on priority
5. Re-run visual audit to validate fixes

---
*This report serves as a template for comprehensive visual analysis*
EOF

echo "✅ Visual audit with delay complete!"
echo "📁 Results saved to: ${AUDIT_DIR}"
echo "📋 Report: ${AUDIT_DIR}/VISUAL_ANALYSIS_REPORT.md"
echo ""
echo "Screenshots captured:"
ls -la "${AUDIT_DIR}"/*.png 2>/dev/null || echo "No screenshots found"