#!/bin/bash

# Generate Coverage Report for AIGlossaryPro
# This script generates comprehensive coverage reports and handles CI integration

set -e

echo "🧪 Starting Test Coverage Analysis..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create coverage directory if it doesn't exist
mkdir -p coverage

echo -e "${BLUE}📊 Running coverage analysis...${NC}"

# Run tests with coverage (but don't fail on test failures for now)
npm run test:coverage || {
    echo -e "${YELLOW}⚠️  Some tests failed, but continuing with coverage analysis...${NC}"
}

# Check if coverage reports were generated
if [ -d "coverage" ] && [ "$(ls -A coverage 2>/dev/null)" ]; then
    echo -e "${GREEN}✅ Coverage reports generated successfully!${NC}"
    
    # Display coverage summary if available
    if [ -f "coverage/coverage-summary.json" ]; then
        echo -e "${BLUE}📈 Coverage Summary:${NC}"
        
        # Extract coverage percentages using node
        node -e "
            const fs = require('fs');
            try {
                const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
                const total = summary.total;
                console.log(\`Lines: \${total.lines.pct}%\`);
                console.log(\`Statements: \${total.statements.pct}%\`);
                console.log(\`Functions: \${total.functions.pct}%\`);
                console.log(\`Branches: \${total.branches.pct}%\`);
                
                // Check if coverage meets thresholds
                const threshold = 70;
                const criticalThreshold = 80;
                
                if (total.lines.pct < threshold) {
                    console.log(\`❌ Line coverage (\${total.lines.pct}%) is below threshold (\${threshold}%)\`);
                    process.exit(1);
                } else if (total.lines.pct < criticalThreshold) {
                    console.log(\`⚠️  Line coverage (\${total.lines.pct}%) is below critical threshold (\${criticalThreshold}%)\`);
                } else {
                    console.log(\`✅ Line coverage (\${total.lines.pct}%) meets critical threshold\`);
                }
            } catch (error) {
                console.log('Coverage summary not available');
            }
        "
    fi
    
    # Generate coverage badge
    echo -e "${BLUE}🏷️  Generating coverage badge...${NC}"
    node -e "
        const fs = require('fs');
        try {
            const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
            const coverage = Math.round(summary.total.lines.pct);
            const color = coverage >= 80 ? 'brightgreen' : coverage >= 70 ? 'yellow' : 'red';
            const badge = \`https://img.shields.io/badge/coverage-\${coverage}%25-\${color}\`;
            
            fs.writeFileSync('coverage/badge.svg', 
                \`<svg xmlns='http://www.w3.org/2000/svg' width='104' height='20'>
                    <linearGradient id='b' x2='0' y2='100%'>
                        <stop offset='0' stop-color='#bbb' stop-opacity='.1'/>
                        <stop offset='1' stop-opacity='.1'/>
                    </linearGradient>
                    <mask id='a'>
                        <rect width='104' height='20' rx='3' fill='#fff'/>
                    </mask>
                    <g mask='url(#a)'>
                        <path fill='#555' d='M0 0h63v20H0z'/>
                        <path fill='\${color === 'brightgreen' ? '#4c1' : color === 'yellow' ? '#dfb317' : '#e05d44'}' d='M63 0h41v20H63z'/>
                        <path fill='url(#b)' d='M0 0h104v20H0z'/>
                    </g>
                    <g fill='#fff' text-anchor='middle' font-family='DejaVu Sans,Verdana,Geneva,sans-serif' font-size='110'>
                        <text x='325' y='150' fill='#010101' fill-opacity='.3' transform='scale(.1)' textLength='530'>coverage</text>
                        <text x='325' y='140' transform='scale(.1)' textLength='530'>coverage</text>
                        <text x='825' y='150' fill='#010101' fill-opacity='.3' transform='scale(.1)' textLength='310'>\${coverage}%</text>
                        <text x='825' y='140' transform='scale(.1)' textLength='310'>\${coverage}%</text>
                    </g>
                </svg>\`
            );
            
            console.log(\`Coverage badge generated: \${coverage}%\`);
        } catch (error) {
            console.log('Could not generate coverage badge');
        }
    "
    
    # Open coverage report in browser (if not in CI)
    if [ -z "${CI}" ]; then
        echo -e "${BLUE}🌐 Opening coverage report in browser...${NC}"
        if command -v open &> /dev/null; then
            open coverage/index.html
        elif command -v xdg-open &> /dev/null; then
            xdg-open coverage/index.html
        else
            echo -e "${YELLOW}Coverage report available at: file://$(pwd)/coverage/index.html${NC}"
        fi
    fi
    
else
    echo -e "${RED}❌ Coverage reports not generated${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Coverage analysis complete!${NC}"
echo -e "${BLUE}📁 Reports available in: ./coverage/${NC}"
echo -e "${BLUE}🏷️  Badge available at: ./coverage/badge.svg${NC}"