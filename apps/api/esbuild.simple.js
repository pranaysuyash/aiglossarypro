const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const isProduction = process.env.NODE_ENV === 'production';

// Simple build configuration - just transpile TypeScript to JavaScript
const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: false, // Don't bundle, just transpile
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outdir: 'dist',
  outExtension: { '.js': '.js' },
  minify: false, // Don't minify for better debugging
  sourcemap: !isProduction,
  // Preserve the directory structure
  outbase: 'src',
  // Handle TypeScript
  loader: {
    '.ts': 'ts',
    '.node': 'file',
  },
  resolveExtensions: ['.ts', '.js', '.json'],
  logLevel: 'info',
};

async function build() {
  const start = Date.now();
  
  try {
    console.log('🚀 Starting esbuild (simple transpilation)...');
    
    // Clean dist directory
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
    }
    
    // Get all TypeScript files
    const getAllTsFiles = (dir, files = []) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
          getAllTsFiles(fullPath, files);
        } else if (entry.isFile() && entry.name.endsWith('.ts') && 
                   !entry.name.endsWith('.test.ts') && 
                   !entry.name.endsWith('.spec.ts') &&
                   !fullPath.includes('__tests__')) {
          files.push(fullPath);
        }
      }
      
      return files;
    };
    
    const srcPath = path.join(__dirname, 'src');
    const allTsFiles = getAllTsFiles(srcPath);
    
    console.log(`Found ${allTsFiles.length} TypeScript files to transpile`);
    
    // Build with all files
    await esbuild.build({
      ...buildOptions,
      entryPoints: allTsFiles,
    });
    
    const duration = Date.now() - start;
    console.log(`✅ Build completed in ${duration}ms`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build
build();