const esbuild = require('esbuild');
const path = require('path');
const { spawn } = require('child_process');

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
    // Main package exports
    '@aiglossarypro/shared': path.resolve(__dirname, '../../packages/shared/dist/index.js'),
    '@aiglossarypro/database': path.resolve(__dirname, '../../packages/database/dist/index.js'),
    '@aiglossarypro/auth': path.resolve(__dirname, '../../packages/auth/dist/index.js'),
    '@aiglossarypro/config': path.resolve(__dirname, '../../packages/config/dist/index.js'),
    
    // Shared subpath imports
    '@aiglossarypro/shared/schema': path.resolve(__dirname, '../../packages/shared/dist/schema.js'),
    '@aiglossarypro/shared/enhancedSchema': path.resolve(__dirname, '../../packages/shared/dist/enhancedSchema.js'),
    '@aiglossarypro/shared/types': path.resolve(__dirname, '../../packages/shared/dist/types.js'),
    '@aiglossarypro/shared/abTestingSchema': path.resolve(__dirname, '../../packages/shared/dist/abTestingSchema.js'),
    '@aiglossarypro/shared/featureFlags': path.resolve(__dirname, '../../packages/shared/dist/featureFlags.js'),
    '@aiglossarypro/shared/errorManager': path.resolve(__dirname, '../../packages/shared/dist/errorManager.js'),
    '@aiglossarypro/shared/295ColumnStructure': path.resolve(__dirname, '../../packages/shared/dist/295ColumnStructure.js'),
    '@aiglossarypro/shared/completeColumnStructure': path.resolve(__dirname, '../../packages/shared/dist/completeColumnStructure.js'),
    
    // Database subpath imports
    '@aiglossarypro/database/db': path.resolve(__dirname, '../../packages/database/dist/db.js'),
    '@aiglossarypro/database/db/support-schema': path.resolve(__dirname, '../../packages/database/dist/db/support-schema.js'),
    
    // Config subpath imports
    '@aiglossarypro/config/config/analytics': path.resolve(__dirname, '../../packages/config/dist/config/analytics.js'),
    '@aiglossarypro/config/config/sentry': path.resolve(__dirname, '../../packages/config/dist/config/sentry.js'),
    '@aiglossarypro/config/config/redis': path.resolve(__dirname, '../../packages/config/dist/config/redis.js'),
    '@aiglossarypro/config/analytics': path.resolve(__dirname, '../../packages/config/dist/config/analytics.js'),
    '@aiglossarypro/config/sentry': path.resolve(__dirname, '../../packages/config/dist/config/sentry.js'),
  },
  // Handle native modules
  loader: {
    '.node': 'file',
  },
  logLevel: 'info',
};

let serverProcess = null;

function startServer() {
  if (serverProcess) {
    console.log('🔄 Restarting server...');
    serverProcess.kill();
  }
  
  console.log('🚀 Starting Node.js server...');
  // Load env from root directory
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
  
  serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
    cwd: __dirname
  });
  
  serverProcess.on('error', (err) => {
    console.error('❌ Server process error:', err);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.log(`⚠️  Server exited with code ${code}`);
    }
  });
}

async function watch() {
  console.log('👀 Starting esbuild in watch mode with server restart...\n');
  
  try {
    const context = await esbuild.context({
      ...devOptions,
      plugins: [
        {
          name: 'server-restart',
          setup(build) {
            build.onEnd(result => {
              if (result.errors.length === 0) {
                console.log('✅ Build completed, starting/restarting server...');
                startServer();
              } else {
                console.log('❌ Build failed, server not started');
              }
            });
          },
        },
      ],
    });
    
    // Enable watch mode
    await context.watch();
    
    console.log('✅ Watching for changes...');
    console.log('Press Ctrl+C to stop\n');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\n👋 Stopping watch mode and server...');
      if (serverProcess) {
        serverProcess.kill();
      }
      await context.dispose();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n👋 Stopping watch mode and server...');
      if (serverProcess) {
        serverProcess.kill();
      }
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