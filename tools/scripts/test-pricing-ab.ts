#!/usr/bin/env tsx

/**
 * Test Pricing System and A/B Testing Features
 * Validates Phase 1 implementation: Dynamic pricing, Exit-intent, A/B tests
 */

import chalk from 'chalk';
import 'dotenv/config';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const WEB_BASE = process.env.WEB_URL || 'http://localhost:5173';

console.log(chalk.blue.bold('🚀 Testing AIGlossaryPro Pricing & A/B Testing System\n'));

interface TestResult {
  test: string;
  status: 'passed' | 'failed' | 'warning';
  message?: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(test: string, status: TestResult['status'], message?: string, details?: any) {
  const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
  const color = status === 'passed' ? chalk.green : status === 'failed' ? chalk.red : chalk.yellow;
  
  console.log(`${icon} ${color(test)}`);
  if (message) console.log(`   ${chalk.gray(message)}`);
  if (details) console.log(`   ${chalk.gray(JSON.stringify(details, null, 2))}`);
  
  results.push({ test, status, message, details });
}

// Test 1: API Endpoints
async function testPricingAPI() {
  console.log(chalk.cyan('\n📡 Testing Pricing API Endpoints...\n'));

  try {
    // Test phase status endpoint
    const statusRes = await fetch(`${API_BASE}/api/pricing/phase-status`);
    const statusData = await statusRes.json();
    
    if (statusRes.ok && statusData.success) {
      logTest('GET /api/pricing/phase-status', 'passed', 
        `Current phase: ${statusData.data.currentPhase}`, statusData.data);
    } else {
      logTest('GET /api/pricing/phase-status', 'failed', 'Failed to fetch phase status');
    }

    // Test sales count endpoint
    const salesRes = await fetch(`${API_BASE}/api/pricing/sales-count`);
    const salesData = await salesRes.json();
    
    if (salesRes.ok && salesData.success) {
      logTest('GET /api/pricing/sales-count', 'passed', 
        `Total sales: ${salesData.data.totalSales}`);
    } else {
      logTest('GET /api/pricing/sales-count', 'failed');
    }

    // Test phase transition (should fail without auth)
    const transitionRes = await fetch(`${API_BASE}/api/pricing/transition-phase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPhase: 'early', toPhase: 'launch' })
    });
    
    if (transitionRes.status === 403 || transitionRes.status === 401) {
      logTest('POST /api/pricing/transition-phase (auth check)', 'passed', 
        'Correctly requires authentication');
    } else {
      logTest('POST /api/pricing/transition-phase (auth check)', 'warning', 
        'Should require authentication');
    }

  } catch (error) {
    logTest('Pricing API', 'failed', `Error: ${error.message}`);
  }
}

// Test 2: Pricing Display
async function testPricingDisplay() {
  console.log(chalk.cyan('\n💰 Testing Pricing Display...\n'));

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(WEB_BASE, { waitUntil: 'networkidle0' });

    // Check for pricing elements
    const pricingSection = await page.$('#pricing');
    if (pricingSection) {
      logTest('Pricing section exists', 'passed');
    } else {
      logTest('Pricing section exists', 'failed', 'Could not find #pricing element');
    }

    // Check for phase-specific pricing
    const priceElements = await page.$$eval('.text-3xl.font-bold.text-purple-900', 
      elements => elements.map(el => el.textContent));
    
    if (priceElements.length > 0) {
      const prices = priceElements.filter(p => p?.includes('$'));
      logTest('Price display', 'passed', `Found prices: ${prices.join(', ')}`);
      
      // Verify price matches phase
      const currentPhase = process.env.NEXT_PUBLIC_PRICING_PHASE || 'early';
      const expectedPrices = {
        beta: '$124',
        early: '$162',
        launch: '$199',
        regular: '$249'
      };
      
      if (prices.some(p => p?.includes(expectedPrices[currentPhase]))) {
        logTest('Phase-specific pricing', 'passed', 
          `Showing ${currentPhase} phase price: ${expectedPrices[currentPhase]}`);
      } else {
        logTest('Phase-specific pricing', 'warning', 
          `Expected ${expectedPrices[currentPhase]} for ${currentPhase} phase`);
      }
    } else {
      logTest('Price display', 'failed', 'No prices found');
    }

    // Check for discount messaging
    const discountElements = await page.$$eval('.line-through', 
      elements => elements.map(el => el.textContent));
    
    if (discountElements.length > 0) {
      logTest('Discount display', 'passed', 'Original price with strikethrough found');
    } else {
      logTest('Discount display', 'warning', 'No strikethrough pricing found');
    }

    // Check for urgency/slots messaging
    const urgencyText = await page.$eval('body', el => el.textContent);
    if (urgencyText?.includes('claimed') || urgencyText?.includes('spots')) {
      logTest('Urgency messaging', 'passed', 'Slots/urgency messaging found');
    } else {
      logTest('Urgency messaging', 'warning', 'No urgency messaging found');
    }

  } catch (error) {
    logTest('Pricing display', 'failed', `Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Test 3: Exit-Intent Popup
async function testExitIntent() {
  console.log(chalk.cyan('\n🚪 Testing Exit-Intent Popup...\n'));

  const browser = await puppeteer.launch({ 
    headless: false, // Need to see mouse movement
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto(WEB_BASE, { waitUntil: 'networkidle0' });
    
    // Wait for 5 seconds (exit-intent delay)
    await page.waitForTimeout(5500);
    
    // Simulate exit intent by moving mouse to top
    await page.mouse.move(400, 0);
    
    // Wait for popup
    await page.waitForTimeout(500);
    
    // Check if popup appeared
    const popup = await page.$('.fixed.inset-0.z-50');
    if (popup) {
      logTest('Exit-intent trigger', 'passed', 'Popup appeared on mouse exit');
      
      // Check for phase-aware pricing
      const popupText = await page.$eval('.fixed.inset-0.z-50', el => el.textContent);
      if (popupText?.includes('$') && popupText?.includes('Special')) {
        logTest('Exit-intent pricing', 'passed', 'Shows special pricing');
      } else {
        logTest('Exit-intent pricing', 'warning', 'No special pricing found');
      }
      
      // Test close button
      const closeButton = await page.$('button[class*="absolute right-4 top-4"]');
      if (closeButton) {
        await closeButton.click();
        await page.waitForTimeout(500);
        
        const popupGone = await page.$('.fixed.inset-0.z-50');
        if (!popupGone) {
          logTest('Exit-intent close', 'passed', 'Popup closes properly');
        } else {
          logTest('Exit-intent close', 'failed', 'Popup did not close');
        }
      }
    } else {
      logTest('Exit-intent trigger', 'failed', 'Popup did not appear');
    }
    
    // Test frequency capping
    await page.reload();
    await page.waitForTimeout(5500);
    await page.mouse.move(400, 0);
    await page.waitForTimeout(500);
    
    const secondPopup = await page.$('.fixed.inset-0.z-50');
    if (!secondPopup) {
      logTest('Exit-intent frequency capping', 'passed', 'Popup correctly suppressed on reload');
    } else {
      logTest('Exit-intent frequency capping', 'failed', 'Popup appeared again');
    }

  } catch (error) {
    logTest('Exit-intent popup', 'failed', `Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Test 4: A/B Testing
async function testABTesting() {
  console.log(chalk.cyan('\n🧪 Testing A/B Testing System...\n'));

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Inject PostHog check
    await page.evaluateOnNewDocument(() => {
      window.addEventListener('load', () => {
        // @ts-ignore
        window.__posthogLoaded = !!window.posthog;
      });
    });
    
    await page.goto(WEB_BASE, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000); // Wait for PostHog to load
    
    // Check if PostHog is loaded
    const posthogLoaded = await page.evaluate(() => {
      // @ts-ignore
      return window.__posthogLoaded;
    });
    
    if (posthogLoaded) {
      logTest('PostHog loaded', 'passed');
      
      // Check for experiment flags
      const experiments = await page.evaluate(() => {
        // @ts-ignore
        if (!window.posthog) return null;
        
        const flags = [
          'landingPageHeadline',
          'exitIntentVariant',
          'pricingDisplay',
          'socialProofPlacement',
          'landingPageCTA'
        ];
        
        const results = {};
        flags.forEach(flag => {
          // @ts-ignore
          results[flag] = window.posthog.getFeatureFlag(flag);
        });
        
        return results;
      });
      
      if (experiments && Object.keys(experiments).length > 0) {
        logTest('A/B test experiments', 'passed', 'Experiments active', experiments);
      } else {
        logTest('A/B test experiments', 'warning', 'No experiments found');
      }
      
      // Check for tracking events
      const networkRequests = [];
      page.on('request', request => {
        if (request.url().includes('posthog') || request.url().includes('/e/')) {
          networkRequests.push(request.url());
        }
      });
      
      // Trigger some actions
      const ctaButton = await page.$('button[class*="bg-purple-600"]');
      if (ctaButton) {
        await ctaButton.click();
        await page.waitForTimeout(1000);
        
        const trackingEvents = networkRequests.filter(url => 
          url.includes('event') || url.includes('capture'));
        
        if (trackingEvents.length > 0) {
          logTest('Event tracking', 'passed', 
            `${trackingEvents.length} tracking events captured`);
        } else {
          logTest('Event tracking', 'warning', 'No tracking events captured');
        }
      }
      
    } else {
      logTest('PostHog loaded', 'warning', 'PostHog not detected - check configuration');
    }

  } catch (error) {
    logTest('A/B testing', 'failed', `Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Test 5: Mobile Experience
async function testMobileExperience() {
  console.log(chalk.cyan('\n📱 Testing Mobile Experience...\n'));

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
      isMobile: true,
      hasTouch: true
    });
    
    await page.goto(WEB_BASE, { waitUntil: 'networkidle0' });
    
    // Check responsive design
    const viewportTest = await page.evaluate(() => {
      const body = document.body;
      const isScrollable = body.scrollHeight > window.innerHeight;
      const hasHorizontalScroll = body.scrollWidth > window.innerWidth;
      
      return {
        isScrollable,
        hasHorizontalScroll,
        viewportWidth: window.innerWidth,
        bodyWidth: body.scrollWidth
      };
    });
    
    if (!viewportTest.hasHorizontalScroll) {
      logTest('Mobile responsive design', 'passed', 'No horizontal scroll');
    } else {
      logTest('Mobile responsive design', 'failed', 
        'Horizontal scroll detected', viewportTest);
    }
    
    // Check touch targets
    const buttons = await page.$$eval('button', buttons => {
      return buttons.map(btn => {
        const rect = btn.getBoundingClientRect();
        return {
          text: btn.textContent?.trim().substring(0, 30),
          width: rect.width,
          height: rect.height,
          isValidSize: rect.width >= 44 && rect.height >= 44
        };
      });
    });
    
    const invalidButtons = buttons.filter(btn => !btn.isValidSize);
    if (invalidButtons.length === 0) {
      logTest('Mobile touch targets', 'passed', 'All buttons ≥44x44px');
    } else {
      logTest('Mobile touch targets', 'warning', 
        `${invalidButtons.length} buttons too small`, invalidButtons);
    }
    
    // Test mobile exit-intent (scroll velocity)
    await page.waitForTimeout(5500);
    
    // Simulate rapid upward scroll
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    await page.waitForTimeout(500);
    
    const mobilePopup = await page.$('.fixed.inset-0.z-50');
    if (mobilePopup) {
      logTest('Mobile exit-intent', 'passed', 'Popup triggered on scroll velocity');
    } else {
      logTest('Mobile exit-intent', 'warning', 'Popup not triggered on mobile');
    }

  } catch (error) {
    logTest('Mobile experience', 'failed', `Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const skipAPI = args.includes('--skip-api');
  const skipBrowser = args.includes('--skip-browser');
  const onlyAPI = args.includes('--only-api');
  const onlyBrowser = args.includes('--only-browser');
  
  if (!skipAPI && !onlyBrowser) {
    await testPricingAPI();
  }
  
  if (!skipBrowser && !onlyAPI) {
    await testPricingDisplay();
    await testExitIntent();
    await testABTesting();
    await testMobileExperience();
  }
  
  // Summary
  console.log(chalk.cyan('\n📊 Test Summary\n'));
  
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  
  console.log(chalk.green(`✅ Passed: ${passed}`));
  console.log(chalk.yellow(`⚠️  Warnings: ${warnings}`));
  console.log(chalk.red(`❌ Failed: ${failed}`));
  
  if (failed > 0) {
    console.log(chalk.red.bold('\n❌ Some tests failed!'));
    process.exit(1);
  } else if (warnings > 0) {
    console.log(chalk.yellow.bold('\n⚠️  Tests passed with warnings'));
  } else {
    console.log(chalk.green.bold('\n🎉 All tests passed!'));
  }
}

// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(chalk.blue.bold('🚀 Pricing & A/B Testing Test Script\n'));
  console.log('Usage:');
  console.log('  npm run test:pricing-ab              # Run all tests');
  console.log('  npm run test:pricing-ab --only-api   # Test only API endpoints');
  console.log('  npm run test:pricing-ab --only-browser # Test only browser features');
  console.log('  npm run test:pricing-ab --skip-api   # Skip API tests');
  console.log('  npm run test:pricing-ab --skip-browser # Skip browser tests');
  console.log('  npm run test:pricing-ab --help       # Show this help\n');
  console.log('Requirements:');
  console.log('  - API server running on port 3000');
  console.log('  - Web server running on port 5173');
  console.log('  - Chrome/Chromium installed (for Puppeteer)\n');
  process.exit(0);
}

main().catch(console.error);