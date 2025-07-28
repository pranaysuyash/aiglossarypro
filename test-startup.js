console.log('Starting test...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Not set');

try {
  const config = require('./dist/index.js');
  console.log('Successfully loaded index.js');
} catch (error) {
  console.error('Error loading index.js:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}