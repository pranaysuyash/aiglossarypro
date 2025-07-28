import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/api/health', (req, res) => {
  console.log(`Health check request received on port ${PORT}`);
  res.json({ status: 'ok', port: PORT, env_port: process.env.PORT });
});

app.get('/', (req, res) => {
  res.send(`Server running on port ${PORT}`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server listening on 0.0.0.0:${PORT}`);
  console.log(`Environment PORT: ${process.env.PORT}`);
  console.log(`Using PORT: ${PORT}`);
});