const esbuild = require('esbuild');
const path = require('path');

async function build() {
  console.log('🚀 Building production bundle...');
  
  try {
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: 'dist/index.js',
      minify: true,
      sourcemap: false,
      external: [
        // Native modules that can't be bundled
        'bcrypt',
        'sharp',
        '@prisma/client',
        'pg-native',
        'canvas',
        'bufferutil',
        'utf-8-validate',
        // AWS SDK
        '@aws-sdk/*',
        'aws-sdk',
      ],
      loader: {
        '.ts': 'ts',
        '.node': 'file',
      },
      resolveExtensions: ['.ts', '.js', '.json'],
      logLevel: 'info',
    });
    
    console.log('✅ Production build completed!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();