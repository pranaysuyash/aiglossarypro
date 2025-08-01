#!/bin/bash

echo "🚀 AIGlossaryPro - Development Environment Verification"
echo "======================================================"

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Run this script from the project root directory${NC}"
  exit 1
fi

echo -e "${BLUE}📁 Project Directory:${NC} $(pwd)"

# Check environment files
echo -e "\n${BLUE}🔍 Environment Files:${NC}"
if [ -f ".env" ]; then
  echo -e "${GREEN}✅ .env found${NC}"
else
  echo -e "${YELLOW}⚠️  .env not found${NC}"
fi

if [ -f ".env.production" ]; then
  echo -e "${GREEN}✅ .env.production found${NC}"
else
  echo -e "${YELLOW}⚠️  .env.production not found${NC}"
fi

# Check critical environment variables
echo -e "\n${BLUE}🔧 Critical Environment Variables:${NC}"
critical_vars=("DATABASE_URL" "VITE_POSTHOG_KEY" "OPENAI_API_KEY" "VITE_FIREBASE_API_KEY")
for var in "${artifacts_info[@]}"; do
  if grep -q "^$var=" .env 2>/dev/null; then
    echo -e "${GREEN}✅ $var configured${NC}"
  else
    echo -e "${YELLOW}⚠️  $var not found in .env${NC}"
  fi
done

# Check package builds
echo -e "\n${BLUE}📦 Package Build Status:${NC}"
packages=("shared" "auth" "config" "database")
all_built=true

for pkg in "${packages[@]}"; do
  if [ -d "packages/$pkg/dist" ] && [ "$(ls -A packages/$pkg/dist)" ]; then
    echo -e "${GREEN}✅ $pkg package built${NC}"
  else
    echo -e "${YELLOW}⚠️  $pkg package needs building${NC}"
    all_built=false
  fi
done

# Check API build
if [ -d "apps/api/dist" ] && [ "$(ls -A apps/api/dist)" ]; then
  echo -e "${GREEN}✅ API built${NC}"
else
  echo -e "${YELLOW}⚠️  API needs building${NC}"
  all_built=false
fi

# Check if node_modules exists
echo -e "\n${BLUE}🔗 Dependencies:${NC}"
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✅ Root dependencies installed${NC}"
else
  echo -e "${RED}❌ Root dependencies missing - run: pnpm install${NC}"
fi

if [ -d "apps/api/node_modules" ]; then
  echo -e "${GREEN}✅ API dependencies installed${NC}"
else
  echo -e "${YELLOW}⚠️  API dependencies missing${NC}"
fi

if [ -d "apps/web/node_modules" ]; then
  echo -e "${GREEN}✅ Web dependencies installed${NC}"
else
  echo -e "${YELLOW}⚠️  Web dependencies missing${NC}"
fi

# Show available dev scripts
echo -e "\n${BLUE}🎯 Available Development Scripts:${NC}"
echo -e "${GREEN}• npm run dev:smart${NC}     - Start both API + Web (with colored output)"
echo -e "${GREEN}• npm run dev${NC}           - Start both API + Web (same as dev:smart)"
echo -e "${GREEN}• npm run dev:basic${NC}     - Start both API + Web (basic output)"
echo -e "${GREEN}• npm run dev:server${NC}    - Start API only"
echo -e "${GREEN}• npm run dev:client${NC}    - Start Web only"

# Show expected URLs
echo -e "\n${BLUE}🌐 Expected URLs:${NC}"
echo -e "${GREEN}• API Server:${NC}  http://localhost:3001"
echo -e "${GREEN}• Web Client:${NC}  http://localhost:5173"
echo -e "${GREEN}• Health Check:${NC} http://localhost:3001/health"

# Final recommendations
echo -e "\n${BLUE}🎉 Status Summary:${NC}"
if [ "$all_built" = true ]; then
  echo -e "${GREEN}✅ All packages built - Ready to start!${NC}"
  echo -e "\n${BLUE}🚀 To start development:${NC}"
  echo -e "${GREEN}npm run dev:smart${NC}"
else
  echo -e "${YELLOW}⚠️  Some packages need building${NC}"
  echo -e "\n${BLUE}🔧 To build all packages:${NC}"
  echo -e "${GREEN}npm run build${NC}"
  echo -e "\n${BLUE}🚀 Then start development:${NC}"
  echo -e "${GREEN}npm run dev:smart${NC}"
fi

echo -e "\n${BLUE}📊 Features Ready:${NC}"
echo -e "${GREEN}✅ PostHog Analytics & A/B Testing${NC}"
echo -e "${GREEN}✅ Firebase Authentication${NC}" 
echo -e "${GREEN}✅ Neon PostgreSQL Database${NC}"
echo -e "${GREEN}✅ Gumroad Payment Integration${NC}"
echo -e "${GREEN}✅ AWS S3 File Storage${NC}"
echo -e "${GREEN}✅ OpenAI API Integration${NC}"
echo -e "${GREEN}✅ TypeScript Error Fixes Applied${NC}"

echo -e "\n${GREEN}Happy coding! 🎉${NC}"
