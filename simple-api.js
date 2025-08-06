import express from 'express';

const app = express();

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://d1m7nnfj3im4kp.cloudfront.net',
    'https://aiglossarypro.com',
    'https://www.aiglossarypro.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());

// Health check endpoints
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Basic API endpoints
app.get('/api/terms', (_req, res) => {
  res.status(200).json({
    message: 'Terms endpoint working',
    status: 'success',
    timestamp: new Date().toISOString(),
    data: [
      { id: 1, name: 'Artificial Intelligence', definition: 'Sample definition' },
      { id: 2, name: 'Machine Learning', definition: 'Sample definition' }
    ]
  });
});

app.get('/api/categories', (_req, res) => {
  res.status(200).json({
    message: 'Categories endpoint working',
    status: 'success',
    timestamp: new Date().toISOString(),
    data: [
      { id: 1, name: 'AI Fundamentals' },
      { id: 2, name: 'Machine Learning' }
    ]
  });
});

// Auth endpoints
app.get('/api/auth/status', (_req, res) => {
  res.status(200).json({
    isAuthenticated: false,
    user: null,
    status: 'success',
    timestamp: new Date().toISOString(),
    message: 'Auth status endpoint working'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Email and password are required',
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock login logic
  res.status(200).json({
    status: 'success',
    message: 'Login endpoint working (mock)',
    timestamp: new Date().toISOString(),
    user: {
      id: 1,
      email: email,
      name: 'Test User',
      role: 'user'
    },
    token: 'mock-jwt-token'
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({
      status: 'error',
      message: 'Email, password, and name are required',
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock registration logic
  res.status(201).json({
    status: 'success',
    message: 'Registration endpoint working (mock)',
    timestamp: new Date().toISOString(),
    user: {
      id: 2,
      email: email,
      name: name,
      role: 'user'
    }
  });
});

// Search endpoint
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({
      status: 'error',
      message: 'Query parameter "q" is required',
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock search results
  const mockResults = [
    { id: 1, name: 'Artificial Intelligence', definition: 'Sample definition', relevance: 0.95 },
    { id: 2, name: 'Machine Learning', definition: 'Sample definition', relevance: 0.85 }
  ].filter(item => 
    item.name.toLowerCase().includes(q.toLowerCase()) ||
    item.definition.toLowerCase().includes(q.toLowerCase())
  );
  
  res.status(200).json({
    message: 'Search endpoint working',
    status: 'success',
    timestamp: new Date().toISOString(),
    query: q,
    results: mockResults,
    total: mockResults.length
  });
});

// User profile endpoint
app.get('/api/user/profile', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'User profile endpoint working (mock)',
    timestamp: new Date().toISOString(),
    user: {
      id: 1,
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
      preferences: {
        theme: 'light',
        language: 'en'
      }
    }
  });
});

// Additional endpoints for full API compatibility
app.post('/api/terms', (req, res) => {
  res.status(201).json({
    status: 'success',
    message: 'Term created (mock)',
    timestamp: new Date().toISOString(),
    data: { id: Date.now(), ...req.body }
  });
});

app.put('/api/terms/:id', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Term updated (mock)',
    timestamp: new Date().toISOString(),
    data: { id: req.params.id, ...req.body }
  });
});

app.delete('/api/terms/:id', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Term deleted (mock)',
    timestamp: new Date().toISOString(),
    data: { id: req.params.id }
  });
});

app.post('/api/categories', (req, res) => {
  res.status(201).json({
    status: 'success',
    message: 'Category created (mock)',
    timestamp: new Date().toISOString(),
    data: { id: Date.now(), ...req.body }
  });
});

app.get('/api/tags', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Tags endpoint working',
    timestamp: new Date().toISOString(),
    data: [
      { id: 1, name: 'machine-learning' },
      { id: 2, name: 'deep-learning' },
      { id: 3, name: 'neural-networks' }
    ]
  });
});

app.get('/api/glossary', (_req, res) => {
  // Redirect to terms for compatibility
  res.redirect('/api/terms');
});

const port = parseInt(process.env.PORT || '8080', 10);
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

app.listen(port, host, () => {
  console.log(`[HTTP] Server listening on ${host}:${port}`);
  console.log('✅ API endpoints ready: /health, /api/health, /api/terms, /api/categories');
});