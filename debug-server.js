import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Debug Server Starting...');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY_BASE64:', process.env.FIREBASE_PRIVATE_KEY_BASE64 ? 'set' : 'not set');

import express from 'express';
import { features } from './server/config';
import { registerFirebaseAuthRoutesDebug } from './server/routes/firebaseAuthDebug';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Debug route
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Debug server is running',
    timestamp: new Date().toISOString(),
    features: features,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      firebaseEnabled: features.firebaseAuthEnabled,
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Register debug auth routes
registerFirebaseAuthRoutesDebug(app);

// Catch all for unmatched routes
app.all('/api/*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      '/api/debug',
      '/api/health', 
      '/api/auth/test',
      '/api/auth/providers',
      '/api/auth/check',
      '/api/auth/firebase/login',
      '/api/auth/login'
    ]
  });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`🚀 Debug server running on http://localhost:${port}`);
  console.log('🔍 Available routes:');
  console.log('  - GET /api/debug');
  console.log('  - GET /api/health');
  console.log('  - GET /api/auth/test');
  console.log('  - GET /api/auth/providers');
  console.log('  - GET /api/auth/check');
  console.log('  - POST /api/auth/firebase/login');
  console.log('  - POST /api/auth/login');
});
