const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    service: 'enhanced-api'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    service: 'enhanced-api'
  });
});

// Core API endpoints
app.get('/api', (_req, res) => {
  res.json({
    message: 'AIGlossaryPro Enhanced API',
    version: '2.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      terms: '/api/terms',
      categories: '/api/categories',
      search: '/api/search',
      user: '/api/user/*',
      admin: '/api/admin/*'
    }
  });
});

// Terms endpoints
app.get('/api/terms', (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  res.json({
    data: [],
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: 0,
      totalPages: 0
    },
    filters: { category, search }
  });
});

app.get('/api/terms/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Mock Term',
    definition: 'Mock definition',
    category: 'AI',
    sections: []
  });
});

app.post('/api/terms', (req, res) => {
  res.status(201).json({
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  });
});

// Categories
app.get('/api/categories', (_req, res) => {
  res.json({
    data: [
      { id: '1', name: 'Machine Learning', termCount: 0 },
      { id: '2', name: 'Deep Learning', termCount: 0 },
      { id: '3', name: 'Natural Language Processing', termCount: 0 },
      { id: '4', name: 'Computer Vision', termCount: 0 }
    ]
  });
});

// Search
app.get('/api/search', (req, res) => {
  const { q = '', type = 'all' } = req.query;
  res.json({
    query: q,
    type,
    results: [],
    total: 0,
    facets: {}
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    res.json({
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: '1',
        email,
        role: 'user'
      }
    });
  } else {
    res.status(400).json({ error: 'Email and password required' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  const authHeader = req.headers.authorization;
  res.json({
    authenticated: !!authHeader,
    user: authHeader ? { id: '1', email: 'user@example.com' } : null
  });
});

// User endpoints
app.get('/api/user/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({
    id: '1',
    email: 'user@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString()
  });
});

app.get('/api/user/progress', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({
    totalTermsViewed: 0,
    completedTerms: 0,
    favoriteTerms: 0,
    learningStreak: 0
  });
});

// Admin endpoints
app.get('/api/admin/stats', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({
    totalUsers: 100,
    totalTerms: 500,
    totalViews: 10000,
    activeUsers: 50
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Enhanced API server listening on 0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SIGTERM] Shutting down gracefully...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

module.exports = app;