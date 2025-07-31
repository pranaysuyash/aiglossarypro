#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Starting optimized build process...\n');

// Step 1: Type checking (optional, can be skipped in production)
if (process.env.SKIP_TYPE_CHECK !== 'true') {
  console.log('📝 Running TypeScript type checking...');
  try {
    execSync('tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ Type checking passed!\n');
  } catch (error) {
    console.error('❌ Type checking failed!');
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️  Continuing with build despite type errors (production mode)');
    } else {
      process.exit(1);
    }
  }
}

// Step 2: Clean dist directory
console.log('🧹 Cleaning dist directory...');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

// Step 3: Run esbuild
console.log('⚡ Building with esbuild...');
try {
  execSync('node esbuild.simple.js', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' }
  });
  console.log('✅ Build completed successfully!\n');
} catch (error) {
  console.error('❌ Build failed!');
  process.exit(1);
}

// Step 4: Copy non-JS files if needed (e.g., JSON files, etc.)
console.log('📁 Copying additional files...');
const filesToCopy = [
  // Add any non-JS files that need to be copied to dist
  // Example: 'src/config/standardSections.json'
];

filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  if (fs.existsSync(src)) {
    const relativePath = path.relative(path.join(__dirname, 'src'), src);
    const dest = path.join(distPath, relativePath);
    const destDir = path.dirname(dest);
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${file}`);
  }
});

console.log('\n🎉 Build process completed!');