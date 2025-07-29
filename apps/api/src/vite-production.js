// Production stub for vite functionality
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupVite(app, server) {
  // In production, Vite is not needed
  console.log('Vite setup skipped in production');
}

export function serveStatic(app) {
  // Serve static files from the dist/public directory
  const publicPath = path.join(process.cwd(), 'dist', 'public');
  app.use(express.static(publicPath));
  
  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}