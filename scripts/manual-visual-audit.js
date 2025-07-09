const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

async function runVisualAudit() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = path.join(process.cwd(), 'visual-audits', timestamp);

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('📸 Visual Audit Started');
  console.log(`Output directory: ${outputDir}`);

  const browser = await chromium.launch({ headless: true });

  const configs = [
    { name: '01-homepage-desktop', url: '/', viewport: { width: 1920, height: 1080 } },
    { name: '02-terms-desktop', url: '/terms', viewport: { width: 1920, height: 1080 } },
    { name: '03-categories-desktop', url: '/categories', viewport: { width: 1920, height: 1080 } },
    { name: '04-homepage-mobile', url: '/', viewport: { width: 375, height: 812 } },
    { name: '05-terms-mobile', url: '/terms', viewport: { width: 375, height: 812 } },
    { name: '06-homepage-tablet', url: '/', viewport: { width: 768, height: 1024 } },
  ];

  console.log(`Taking ${configs.length} screenshots...`);

  for (const config of configs) {
    console.log(`  📸 ${config.name}...`);

    const page = await browser.newPage();

    if (config.viewport) {
      await page.setViewportSize(config.viewport);
    }

    try {
      await page.goto(`${baseUrl}${config.url}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Wait for body to ensure page is rendered
      await page.waitForSelector('body', { timeout: 10000 });

      // Wait a bit more for content to load
      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({
        path: path.join(outputDir, `${config.name}.png`),
        fullPage: !config.name.includes('mobile'),
      });

      console.log(`    ✅ ${config.name} captured`);
    } catch (error) {
      console.error(`    ❌ Error capturing ${config.name}:`, error.message);
    }

    await page.close();
  }

  await browser.close();
  console.log('✅ Screenshots completed');

  // Generate simple report template
  const reportPath = path.join(outputDir, 'visual-audit-report.md');
  const reportTemplate = `# Visual Audit Report
Date: ${new Date().toLocaleDateString()}

## Screenshots Captured
${configs.map((config) => `- ${config.name}.png - ${config.url} (${config.viewport.width}x${config.viewport.height})`).join('\n')}

## Issues Found
<!-- Fill in your findings here -->

### Critical Issues
1. 

### High Priority Issues
1. 

### Medium Priority Issues
1. 

### Low Priority Issues
1. 

## Recommendations
<!-- Add your recommendations here -->
`;

  fs.writeFileSync(reportPath, reportTemplate);
  console.log(`✅ Report template generated: ${reportPath}`);
  console.log('\nNext steps:');
  console.log(`1. Review screenshots in: ${outputDir}`);
  console.log(`2. Fill out the report: ${reportPath}`);
}

runVisualAudit().catch(console.error);
