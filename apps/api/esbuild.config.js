const esbuild = require('esbuild');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// Build configuration
const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs', // CommonJS for AWS App Runner compatibility
  outfile: 'dist/index.js',
  minify: isProduction,
  sourcemap: !isProduction,
  // Don't bundle dependencies - let Node.js handle them
  packages: 'external',
  // Handle TypeScript paths
  resolveExtensions: ['.ts', '.js', '.json'],
  // Optimize for size and speed
  treeShaking: true,
  // Handle workspace packages and subpath imports
  alias: {
    '@aiglossarypro/shared': path.resolve(__dirname, '../../packages/shared/dist/index.js'),
    '@aiglossarypro/database': path.resolve(__dirname, '../../packages/database/dist/index.js'),
    '@aiglossarypro/auth': path.resolve(__dirname, '../../packages/auth/dist/index.js'),
    '@aiglossarypro/config': path.resolve(__dirname, '../../packages/config/dist/index.js'),
    // Handle subpath imports
    '@aiglossarypro/config/analytics': path.resolve(__dirname, '../../packages/config/dist/config/analytics.js'),
    '@aiglossarypro/config/sentry': path.resolve(__dirname, '../../packages/config/dist/config/sentry.js'),
  },
  // Handle native modules
  loader: {
    '.node': 'file',
  },
  // Log level
  logLevel: 'info',
  // Measure build time
  metafile: true,
};

// Build function
async function build() {
  const start = Date.now();
  
  try {
    console.log('🚀 Starting esbuild...');
    const result = await esbuild.build(buildOptions);
    
    const duration = Date.now() - start;
    console.log(`✅ Build completed in ${duration}ms`);
    
    // Optionally analyze the bundle
    if (result.metafile) {
      const text = await esbuild.analyzeMetafile(result.metafile);
      console.log('\n📊 Bundle analysis:');
      console.log(text);
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build
build();