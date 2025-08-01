console.log('Starting test server on port 3001...');

const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(3001, '127.0.0.1', () => {
  console.log('Test server running on http://127.0.0.1:3001');
});