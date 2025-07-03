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
