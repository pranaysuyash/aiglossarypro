const express = require('express');
const app = express();

const PORT = process.env.PORT || 3001;

app.get('/api/health', (req, res) => {
  console.log('Health check hit');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

app.get('/', (req, res) => {
  res.send('AI Glossary Pro - Simple Test Server');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple test server running on port ${PORT}`);
});