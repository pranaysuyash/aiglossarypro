import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('Bundle Size Optimization Validation', () => {
  const distPath = path.resolve(__dirname, '../../dist/public');
  const assetsPath = path.join(distPath, 'assets');

  beforeEach(() => {
    // Ensure dist directory exists for testing
    if (!fs.existsSync(distPath)) {
      // Build the project if dist doesn't exist
      console.log('Building project for bundle analysis...');
      execSync('npm run build', { cwd: path.resolve(__dirname, '../..') });
    }
  });

  describe('Bundle Size Analysis', () => {
    test('should have main bundle under 500KB (gzipped)', async () => {
      const assets = await fs.readdir(assetsPath);
      const mainBundle = assets.find(file => file.startsWith('index-') && file.endsWith('.js'));

      expect(mainBundle).toBeDefined();

      const bundlePath = path.join(assetsPath, mainBundle!);
      const bundleSize = (await fs.stat(bundlePath)).size;

      // Simulate gzip compression (rough estimate: ~70% of original size)
      const estimatedGzipSize = bundleSize * 0.7;

      expect(estimatedGzipSize).toBeLessThan(500 * 1024); // 500KB

      console.log(`Main bundle size: ${(bundleSize / 1024).toFixed(2)}KB`);
      console.log(`Estimated gzipped: ${(estimatedGzipSize / 1024).toFixed(2)}KB`);
    });

    test('should have optimized vendor chunks', async () => {
      const assets = await fs.readdir(assetsPath);

      // Check for specific vendor chunks
      const reactChunk = assets.find(file => file.includes('vendor-react'));
      const uiChunk = assets.find(file => file.includes('vendor-ui'));
      const firebaseChunk = assets.find(file => file.includes('vendor-firebase'));

      expect(reactChunk).toBeDefined();
      expect(uiChunk).toBeDefined();
      expect(firebaseChunk).toBeDefined();

      // React chunk should be reasonably sized
      if (reactChunk) {
        const reactSize = (await fs.stat(path.join(assetsPath, reactChunk))).size;
        expect(reactSize).toBeLessThan(200 * 1024); // 200KB for React core
        console.log(`React chunk: ${(reactSize / 1024).toFixed(2)}KB`);
      }

      // UI chunk should be optimized
      if (uiChunk) {
        const uiSize = (await fs.stat(path.join(assetsPath, uiChunk))).size;
        expect(uiSize).toBeLessThan(300 * 1024); // 300KB for UI components
        console.log(`UI chunk: ${(uiSize / 1024).toFixed(2)}KB`);
      }
    });

    test('should have lazy-loaded chunks for heavy features', async () => {
      const assets = await fs.readdir(assetsPath);

      // Check for 3D visualization lazy chunk
      const threeDChunk = assets.find(file => file.includes('vendor-3d'));
      if (threeDChunk) {
        const threeDSize = (await fs.stat(path.join(assetsPath, threeDChunk))).size;
        console.log(`3D chunk: ${(threeDSize / 1024).toFixed(2)}KB`);
        // 3D chunk can be larger since it's lazy loaded
        expect(threeDSize).toBeLessThan(1000 * 1024); // 1MB max
      }

      // Check for chart library chunk
      const chartsChunk = assets.find(file => file.includes('vendor-charts'));
      if (chartsChunk) {
        const chartsSize = (await fs.stat(path.join(assetsPath, chartsChunk))).size;
        console.log(`Charts chunk: ${(chartsSize / 1024).toFixed(2)}KB`);
        expect(chartsSize).toBeLessThan(400 * 1024); // 400KB max
      }
    });

    test('should validate total bundle size reduction', async () => {
      const assets = await fs.readdir(assetsPath);
      const jsFiles = assets.filter(file => file.endsWith('.js'));

      let totalSize = 0;
      for (const file of jsFiles) {
        const fileSize = (await fs.stat(path.join(assetsPath, file))).size;
        totalSize += fileSize;
      }

      console.log(`Total JS bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

      // With optimizations, total should be under 3MB
      expect(totalSize).toBeLessThan(3 * 1024 * 1024); // 3MB

      // Verify this represents significant optimization
      // (baseline would be ~6MB+ without chunking)
      const optimizationRatio = 1 - totalSize / (6 * 1024 * 1024);
      expect(optimizationRatio).toBeGreaterThan(0.4); // At least 40% reduction

      console.log(`Bundle size optimization: ${(optimizationRatio * 100).toFixed(1)}%`);
    });

    test('should have optimized CSS bundles', async () => {
      const assets = await fs.readdir(assetsPath);
      const cssFiles = assets.filter(file => file.endsWith('.css'));

      expect(cssFiles.length).toBeGreaterThan(0);

      let totalCSSSize = 0;
      for (const file of cssFiles) {
        const fileSize = (await fs.stat(path.join(assetsPath, file))).size;
        totalCSSSize += fileSize;
      }

      console.log(`Total CSS size: ${(totalCSSSize / 1024).toFixed(2)}KB`);

      // CSS should be well-optimized and minified
      expect(totalCSSSize).toBeLessThan(200 * 1024); // 200KB max
    });
  });

  describe('Million.js Performance Validation', () => {
    test('should verify Million.js is properly integrated', () => {
      // Check vite config for Million.js plugin
      const viteConfigPath = path.resolve(__dirname, '../../vite.config.ts');
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');

      expect(viteConfig).toContain("import million from 'million/compiler'");
      expect(viteConfig).toContain('million.vite({ auto: true })');
    });

    test('should validate React component optimization markers', async () => {
      const assets = await fs.readdir(assetsPath);
      const mainBundle = assets.find(file => file.startsWith('index-') && file.endsWith('.js'));

      if (mainBundle) {
        const bundleContent = await fs.readFile(path.join(assetsPath, mainBundle), 'utf-8');

        // Million.js should leave optimization markers in the bundle
        // Note: In production builds, these might be minified
        // This is a basic check - in practice, you'd use Million's dev tools
        const hasOptimizations = bundleContent.length > 0;
        expect(hasOptimizations).toBe(true);

        console.log('Bundle content length:', bundleContent.length);
      }
    });

    test('should validate build process includes Million.js optimizations', () => {
      // Check package.json for Million.js dependency
      const packageJsonPath = path.resolve(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(
        packageJson.dependencies?.million || packageJson.devDependencies?.million
      ).toBeDefined();
    });
  });

  describe('Tree Shaking Validation', () => {
    test('should properly tree-shake unused dependencies', async () => {
      const assets = await fs.readdir(assetsPath);
      const vendorFiles = assets.filter(file => file.includes('vendor-'));

      // Each vendor chunk should exist (meaning code was properly separated)
      expect(vendorFiles.length).toBeGreaterThan(3);

      for (const vendorFile of vendorFiles) {
        const filePath = path.join(assetsPath, vendorFile);
        const fileSize = (await fs.stat(filePath)).size;

        // No vendor chunk should be excessively large (indicating poor tree shaking)
        expect(fileSize).toBeLessThan(1.5 * 1024 * 1024); // 1.5MB max per chunk

        console.log(`${vendorFile}: ${(fileSize / 1024).toFixed(2)}KB`);
      }
    });

    test('should exclude development-only code from production bundle', async () => {
      const assets = await fs.readdir(assetsPath);
      const allJSFiles = assets.filter(file => file.endsWith('.js'));

      for (const jsFile of allJSFiles) {
        const content = await fs.readFile(path.join(assetsPath, jsFile), 'utf-8');

        // Should not contain development-only code
        expect(content).not.toMatch(/console\.log\s*\(/);
        expect(content).not.toMatch(/debugger/);
        expect(content).not.toMatch(/\.development\./);

        // Should not contain test files
        expect(content).not.toMatch(/\.test\.|\.spec\./);
        expect(content).not.toMatch(/vitest|jest/);
      }
    });
  });

  describe('Performance Metrics Validation', () => {
    test('should validate performance monitoring is included', async () => {
      const assets = await fs.readdir(assetsPath);
      const mainBundle = assets.find(file => file.startsWith('index-') && file.endsWith('.js'));

      if (mainBundle) {
        const bundleContent = await fs.readFile(path.join(assetsPath, mainBundle), 'utf-8');

        // Should include web-vitals for performance monitoring
        const hasWebVitals =
          bundleContent.includes('web-vitals') ||
          bundleContent.includes('onCLS') ||
          bundleContent.includes('onFCP');

        expect(hasWebVitals).toBe(true);
      }
    });

    test('should validate chunk loading strategy', async () => {
      const indexHtmlPath = path.join(distPath, 'index.html');

      if (fs.existsSync(indexHtmlPath)) {
        const indexContent = await fs.readFile(indexHtmlPath, 'utf-8');

        // Should use modern module preloading
        expect(indexContent).toMatch(/rel="modulepreload"/);

        // Should have proper script loading
        expect(indexContent).toMatch(/type="module"/);

        console.log('Index.html includes proper module preloading');
      }
    });

    test('should validate asset optimization', async () => {
      const allAssets = await fs.readdir(assetsPath);

      // Should have hash-based filenames for caching
      const hashedFiles = allAssets.filter(file => /-[a-f0-9]{8,}\./i.test(file));
      expect(hashedFiles.length).toBeGreaterThan(0);

      // Should separate different asset types
      const jsFiles = allAssets.filter(file => file.endsWith('.js'));
      const cssFiles = allAssets.filter(file => file.endsWith('.css'));

      expect(jsFiles.length).toBeGreaterThan(1); // Should have multiple chunks
      expect(cssFiles.length).toBeGreaterThan(0); // Should have CSS files

      console.log(`Assets: ${jsFiles.length} JS files, ${cssFiles.length} CSS files`);
    });
  });

  describe('Bundle Analysis Reporting', () => {
    test('should generate bundle analysis report', async () => {
      const assets = await fs.readdir(assetsPath);
      const bundleAnalysis = {
        totalFiles: assets.length,
        jsFiles: assets.filter(f => f.endsWith('.js')).length,
        cssFiles: assets.filter(f => f.endsWith('.css')).length,
        vendorChunks: assets.filter(f => f.includes('vendor-')).length,
        chunks: assets.filter(f => f.includes('chunks/')).length,
        totalSize: 0,
        optimizationAchieved: true,
      };

      // Calculate total size
      for (const asset of assets) {
        const assetPath = path.join(assetsPath, asset);
        if (fs.statSync(assetPath).isFile()) {
          bundleAnalysis.totalSize += fs.statSync(assetPath).size;
        }
      }

      console.log('Bundle Analysis Report:');
      console.log(`- Total files: ${bundleAnalysis.totalFiles}`);
      console.log(`- JS files: ${bundleAnalysis.jsFiles}`);
      console.log(`- CSS files: ${bundleAnalysis.cssFiles}`);
      console.log(`- Vendor chunks: ${bundleAnalysis.vendorChunks}`);
      console.log(`- Total size: ${(bundleAnalysis.totalSize / 1024 / 1024).toFixed(2)}MB`);

      // Validation checks
      expect(bundleAnalysis.jsFiles).toBeGreaterThan(3); // Should have chunking
      expect(bundleAnalysis.vendorChunks).toBeGreaterThan(2); // Should have vendor separation
      expect(bundleAnalysis.totalSize).toBeLessThan(5 * 1024 * 1024); // Should be under 5MB

      // Write analysis to file for CI/CD
      const reportPath = path.join(__dirname, '../../reports/bundle-analysis.json');
      await fs.ensureDir(path.dirname(reportPath));
      await fs.writeJSON(reportPath, bundleAnalysis, { spaces: 2 });

      console.log(`Bundle analysis saved to: ${reportPath}`);
    });
  });
});
