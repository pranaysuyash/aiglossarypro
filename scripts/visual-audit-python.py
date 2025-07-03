#!/usr/bin/env python3

import os
import time
import subprocess
import sys
from datetime import datetime

def capture_screenshot_with_delay(url, output_file, viewport, description, delay=5):
    """Capture screenshot with delay using Chrome headless"""
    
    print(f"Capturing: {description} (waiting {delay}s for load)")
    
    # Chrome command with delay
    cmd = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '--headless',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--screenshot=' + output_file,
        '--window-size=' + viewport,
        '--virtual-time-budget=8000',
        '--run-all-compositor-stages-before-draw',
        url
    ]
    
    try:
        # Run the command
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        
        # Wait a bit more for the file to be written
        time.sleep(2)
        
        # Check if file was created
        if os.path.exists(output_file):
            file_size = os.path.getsize(output_file)
            print(f"✓ Saved: {output_file} ({file_size} bytes)")
            return True
        else:
            print(f"✗ File not created: {output_file}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"✗ Timeout capturing: {description}")
        return False
    except Exception as e:
        print(f"✗ Error capturing {description}: {str(e)}")
        return False

def main():
    # Set up variables
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    audit_dir = f"visual-audit-results/{timestamp}"
    base_url = "http://localhost:5173"
    
    # Create audit directory
    os.makedirs(audit_dir, exist_ok=True)
    
    print(f"Starting Visual Audit - {timestamp}")
    print("=" * 40)
    print(f"Target URL: {base_url}")
    print()
    
    # Check if server is ready
    print("Checking server readiness...")
    for i in range(10):
        try:
            import urllib.request
            with urllib.request.urlopen(base_url, timeout=5) as response:
                if response.status == 200:
                    print("✓ Server is ready")
                    break
        except:
            print(f"Waiting for server... ({i+1}/10)")
            time.sleep(1)
    else:
        print("✗ Server not ready, proceeding anyway...")
    
    # Capture screenshots
    screenshots = [
        {
            'url': base_url,
            'output': f"{audit_dir}/01-landing-page-desktop-full.png",
            'viewport': "1920,1080",
            'description': "Full landing page - Desktop"
        },
        {
            'url': base_url,
            'output': f"{audit_dir}/02-landing-page-mobile-full.png", 
            'viewport': "375,812",
            'description': "Full landing page - Mobile (iPhone X)"
        },
        {
            'url': base_url,
            'output': f"{audit_dir}/03-landing-page-tablet-full.png",
            'viewport': "768,1024", 
            'description': "Full landing page - Tablet (iPad)"
        }
    ]
    
    success_count = 0
    for i, screenshot in enumerate(screenshots, 1):
        print(f"\n{i}. Capturing {screenshot['description']}")
        if capture_screenshot_with_delay(
            screenshot['url'],
            screenshot['output'],
            screenshot['viewport'],
            screenshot['description'],
            delay=8
        ):
            success_count += 1
    
    # Create analysis report
    print(f"\n4. Creating analysis report")
    
    with open(f"{audit_dir}/VISUAL_ANALYSIS_REPORT.md", "w") as f:
        f.write(f"""# Visual Analysis Report
Generated: {timestamp}

## Screenshots Captured
Total screenshots: {len(screenshots)}
Successful captures: {success_count}

## Files Generated:
""")
        
        for screenshot in screenshots:
            filename = os.path.basename(screenshot['output'])
            if os.path.exists(screenshot['output']):
                size = os.path.getsize(screenshot['output'])
                f.write(f"- **{filename}** ({size} bytes) - {screenshot['description']}\n")
            else:
                f.write(f"- **{filename}** (FAILED) - {screenshot['description']}\n")
        
        f.write(f"""
## Technical Issues to Validate

### Header Navigation:
- [ ] "Get Lifetime Access" button styling and color
- [ ] "Sign In" button styling and color
- [ ] Button consistency and hierarchy

### Hero Section:
- [ ] Main hero content visibility
- [ ] Primary call-to-action prominence
- [ ] Visual hierarchy effectiveness

### Content Loading:
- [ ] Are skeleton loaders visible?
- [ ] Is content fully loaded?
- [ ] Are there loading states?

### Mobile Responsiveness:
- [ ] Mobile navigation functionality
- [ ] Touch targets appropriate size
- [ ] Content layout on mobile

## Next Steps:
1. Review captured screenshots manually
2. Compare with technical code analysis
3. Identify specific issues for fixing
4. Create prioritized action items

---
*Generated by visual audit script*
""")
    
    print(f"\n✅ Visual audit complete!")
    print(f"📁 Results saved to: {audit_dir}")
    print(f"📋 Report: {audit_dir}/VISUAL_ANALYSIS_REPORT.md")
    print()
    
    # List generated files
    print("Files generated:")
    for file in os.listdir(audit_dir):
        if file.endswith('.png'):
            filepath = os.path.join(audit_dir, file)
            size = os.path.getsize(filepath)
            print(f"  - {file} ({size} bytes)")

if __name__ == "__main__":
    main()