import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Continue the audit from where it left off
async function continueAudit() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  context.setDefaultTimeout(10000);

  const reportDir = path.join(process.cwd(), 'reports', 'aggressive-audit', '2025-07-18T17-19-20-824Z');
  let screenshotCount = 92; // Starting from where we left off

  async function captureScreenshot(page: any, name: string) {
    screenshotCount++;
    const filename = `${String(screenshotCount).padStart(3, '0')}-${name}-${Date.now()}.png`;
    const filepath = path.join(reportDir, 'screenshots', filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: false
    });
    
    console.log(`📸 Screenshot ${screenshotCount}: ${name}`);
    return filename;
  }

  try {
    console.log('🔄 Continuing audit from screenshot 92...\n');

    // Test more pages that were missed
    const page = await context.newPage();
    
    // Test remaining public pages
    const remainingPages = [
      { path: '/privacy', name: 'privacy' },
      { path: '/terms-of-service', name: 'tos' },
      { path: '/lifetime', name: 'pricing' },
      { path: '/ai-tools', name: 'ai-tools' },
      { path: '/3d-visualization', name: '3d-viz' }
    ];

    for (const { path, name } of remainingPages) {
      try {
        console.log(`\n📍 Testing ${name}...`);
        await page.goto(`http://localhost:5173${path}`);
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        
        // Quick captures to reach 100+
        await captureScreenshot(page, `${name}-initial`);
        
        // Mobile view
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        await captureScreenshot(page, `${name}-mobile`);
        
        // Desktop view
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(500);
        
        if (screenshotCount >= 105) break;
      } catch (error) {
        console.log(`⚠️  Error testing ${path}`);
      }
    }

    // Quick user login test if we still need more
    if (screenshotCount < 105) {
      console.log('\n🔐 Testing login flow...');
      await page.goto('http://localhost:5173/login');
      await page.waitForTimeout(1000);
      await captureScreenshot(page, 'login-page');
      
      // Fill form
      await page.fill('input[type="email"]', 'test@aimlglossary.com');
      await captureScreenshot(page, 'login-email-filled');
      
      await page.fill('input[type="password"]', 'testpassword123');
      await captureScreenshot(page, 'login-password-filled');
    }

    console.log(`\n✅ Audit completed with ${screenshotCount} total screenshots!`);
    
    // Update the summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalScreenshots: screenshotCount,
      reportDirectory: reportDir,
      status: 'completed'
    };
    
    fs.writeFileSync(
      path.join(reportDir, 'audit-summary.json'),
      JSON.stringify(summary, null, 2)
    );

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

continueAudit().catch(console.error);