// CommonJS wrapper to handle top-level await
const { config } = require('dotenv');

// Load environment variables in non-production environments
if (process.env.NODE_ENV !== 'production') {
  config();
}

// Import the main server module
(async () => {
  try {
    await import('./index.js');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();