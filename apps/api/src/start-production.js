console.log('🚀 Production server starting...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Set a timeout to prevent hanging
const STARTUP_TIMEOUT = 30000; // 30 seconds
const startupTimer = setTimeout(() => {
  console.error('❌ Server startup timeout - exiting');
  process.exit(1);
}, STARTUP_TIMEOUT);

// Start the server
try {
  console.log('Loading server module...');
  await import('../dist/index.js');
  
  // Clear the timeout if server starts successfully
  setTimeout(() => {
    clearTimeout(startupTimer);
    console.log('✅ Server startup timeout cleared');
  }, 5000);
} catch (error) {
  console.error('❌ Failed to start server:', error);
  clearTimeout(startupTimer);
  process.exit(1);
}