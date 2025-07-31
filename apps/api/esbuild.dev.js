const esbuild = require('esbuild');
const path = require('path');

// Development configuration with watch mode
const devOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/index.js',
  minify: false,
  sourcemap: true,
  // Don't bundle dependencies - let Node.js handle them
  packages: 'external',
  resolveExtensions: ['.ts', '.js', '.json'],
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
  logLevel: 'info',
};

async function watch() {
  console.log('👀 Starting esbuild in watch mode...\n');
  
  try {
    const context = await esbuild.context(devOptions);
    
    // Enable watch mode
    await context.watch();
    
    console.log('✅ Watching for changes...');
    console.log('Press Ctrl+C to stop\n');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\n👋 Stopping watch mode...');
      await context.dispose();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Watch mode failed:', error);
    process.exit(1);
  }
}

// Run watch mode
watch();