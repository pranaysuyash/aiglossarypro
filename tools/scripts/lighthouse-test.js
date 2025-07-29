/**
 * Simple Lighthouse Performance Test
 * Quick test for core performance metrics
 */

import { spawn } from 'child_process';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import path from 'path';

// Ensure reports directory exists
const reportsDir = path.join(process.cwd(), 'performance-reports');
if (!existsSync(reportsDir)) {
  mkdirSync(reportsDir, { recursive: true });
}

// Run Lighthouse with basic configuration
const runLighthouse = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportsDir, `lighthouse-${timestamp}.html`);

  console.log('🔍 Running Lighthouse performance audit...');
  console.log(`📊 Report will be saved to: ${reportPath}`);

  const lighthouse = spawn(
    'npx',
    [
      'lighthouse',
      'http://localhost:5173',
      '--output=html',
      `--output-path=${reportPath}`,
      '--chrome-flags=--headless --no-sandbox --disable-gpu',
      '--throttling-method=provided',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--disable-device-emulation',
      '--quiet',
    ],
    {
      stdio: 'inherit',
      shell: true,
    }
  );

  lighthouse.on('close', code => {
    if (code === 0) {
      console.log('✅ Lighthouse audit completed successfully!');
      console.log(`📊 View report: file://${reportPath}`);

      // Basic performance metrics summary
      console.log('\n🚀 Performance Summary:');
      console.log('- Report generated with Core Web Vitals');
      console.log('- Includes Performance, Accessibility, Best Practices, SEO');
      console.log('- Desktop optimization focus');
      console.log('\n💡 Optimization tips:');
      console.log('- Check for unused JavaScript and CSS');
      console.log('- Optimize images for modern formats');
      console.log('- Minimize render-blocking resources');
      console.log('- Ensure good Core Web Vitals scores');
    } else {
      console.error('❌ Lighthouse audit failed with code:', code);
      console.log('💡 Try running: npm run dev first, then run this script');
    }
  });

  lighthouse.on('error', error => {
    console.error('❌ Error running Lighthouse:', error.message);
    console.log('💡 Make sure lighthouse is installed: npm install -g lighthouse');
  });
};

// Check if development server is running
const checkServer = () => {
  console.log('🔍 Checking if development server is running...');

  const check = spawn('curl', ['-s', 'http://localhost:5173'], {
    stdio: 'pipe',
  });

  check.on('close', code => {
    if (code === 0) {
      console.log('✅ Development server is running');
      runLighthouse();
    } else {
      console.log('❌ Development server not running');
      console.log('💡 Please run: npm run dev');
      console.log('💡 Then run this script again');
    }
  });
};

// Start the test
checkServer();
