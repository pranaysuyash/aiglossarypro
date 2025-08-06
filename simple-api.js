import express from 'express';

const app = express();
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

const port = parseInt(process.env.PORT || '8080', 10);
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

app.listen(port, host, () => {
  console.log(`[HTTP] Server listening on ${host}:${port}`);
  console.log('✅ API endpoints ready: /health, /api/health, /api/terms, /api/categories');
});