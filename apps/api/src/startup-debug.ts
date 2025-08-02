// Startup debugging wrapper
console.log('='.repeat(80));
console.log(`[STARTUP] ${new Date().toISOString()} - Starting AIGlossaryPro API`);
console.log(`[STARTUP] Node.js ${process.version} on ${process.platform}`);
console.log(`[STARTUP] Current directory: ${process.cwd()}`);
console.log(`[STARTUP] NODE_ENV: ${process.env.NODE_ENV}`);
console.log('='.repeat(80));

// Add comprehensive error handlers
process.on('uncaughtException', (error) => {
  console.error(`[FATAL] ${new Date().toISOString()} - Uncaught Exception:`, error);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[FATAL] ${new Date().toISOString()} - Unhandled Rejection at:`, promise, 'reason:', reason);
  process.exit(1);
});

process.on('warning', (warning) => {
  console.warn(`[WARN] ${new Date().toISOString()} - Process warning:`, warning);
});

// Set a global timeout for startup
const STARTUP_TIMEOUT = 60000; // 60 seconds
const startupTimer = setTimeout(() => {
  console.error(`[FATAL] ${new Date().toISOString()} - Startup timeout after ${STARTUP_TIMEOUT}ms`);
  console.error('[FATAL] The application failed to start within the timeout period');
  process.exit(1);
}, STARTUP_TIMEOUT);

// Log module loading
const Module = require('module');
const originalRequire = Module.prototype.require;

const criticalModules = [
  '@aiglossarypro/database',
  '@aiglossarypro/config',
  'express',
  'drizzle-orm',
  '@neondatabase/serverless'
];

Module.prototype.require = function(id: string) {
  if (criticalModules.some(mod => id.includes(mod))) {
    console.log(`[MODULE] ${new Date().toISOString()} - Loading: ${id}`);
  }
  
  try {
    const result = originalRequire.apply(this, arguments);
    
    if (criticalModules.some(mod => id.includes(mod))) {
      console.log(`[MODULE] ${new Date().toISOString()} - Loaded successfully: ${id}`);
    }
    
    return result;
  } catch (error) {
    console.error(`[MODULE] ${new Date().toISOString()} - Failed to load: ${id}`, error);
    throw error;
  }
};

console.log(`[INIT] ${new Date().toISOString()} - Loading main application...`);

// Import and start the main application
import('./index').then(() => {
  console.log(`[INIT] ${new Date().toISOString()} - Main application loaded`);
  clearTimeout(startupTimer);
}).catch((error) => {
  console.error(`[FATAL] ${new Date().toISOString()} - Failed to load main application:`, error);
  console.error(error.stack);
  process.exit(1);
});