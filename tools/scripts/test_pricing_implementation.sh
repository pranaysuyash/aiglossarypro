#!/bin/bash

# Test Script for $249 Pricing Implementation
echo "🚀 Testing AIGlossaryPro $249 Pricing Implementation"
echo "=============================================="

echo "📁 Checking if all required files exist..."

# Check if key files exist
files=(
  "client/src/hooks/useCountryPricing.ts"
  "client/src/components/landing/PPPBanner.tsx"
  "client/src/components/landing/PriceDisplay.tsx"
  "client/src/components/landing/Pricing.tsx"
  "client/src/components/landing/HeroSection.tsx"
  "client/src/components/landing/FinalCTA.tsx"
  "client/src/components/landing/LandingHeader.tsx"
  "client/src/components/landing/ContentPreview.tsx"
)

missing_files=()
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file missing"
    missing_files+=("$file")
  fi
done

echo ""
echo "🔧 Next Steps:"
echo "=============="

if [ ${#missing_files[@]} -eq 0 ]; then
  echo "✅ All files created successfully!"
  echo ""
  echo "🎯 Manual Steps Required:"
  echo "1. Create Gumroad product at https://gumroad.com/products/new"
  echo "   - Set price to \$249"
  echo "   - Enable PPP"
  echo "   - Copy product URL"
  echo ""
  echo "2. Update Gumroad URLs in the code:"
  echo "   - Search for 'gumroad.com/l/' in your codebase"
  echo "   - Replace with your actual product URL"
  echo ""
  echo "3. Test the implementation:"
  echo "   npm run dev"
  echo "   - Check pricing displays correctly"
  echo "   - Test country detection (use VPN)"
  echo "   - Verify buy buttons work"
  echo ""
  echo "4. Deploy to production when ready"
else
  echo "❌ Some files are missing. Please check the above list."
fi

echo ""
echo "🌍 Expected Pricing Examples:"
echo "============================="
echo "🇺🇸 United States: \$249 (full price)"
echo "🇮🇳 India: \$100 (60% PPP discount)"
echo "🇧🇷 Brazil: \$112 (55% PPP discount)"
echo "🇲🇽 Mexico: \$125 (50% PPP discount)"
echo ""
echo "💰 Revenue Projections:"
echo "======================"
echo "Conservative (Month 1): \$3,500"
echo "Optimistic (Month 6): \$31,000+"
echo "Annual potential: \$375K-656K"
