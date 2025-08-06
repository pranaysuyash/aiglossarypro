import type { Express } from 'express';
import { log as logger } from '../utils/logger';

export async function registerRoutes(app: Express) {
  logger.info('🚀 Starting minimal route registration');

  // Basic API info route
  app.get('/api', (_req, res) => {
    res.json({
      message: 'AIGlossaryPro API - Minimal Mode',
      version: '1.0.0',
      status: 'operational',
      mode: 'minimal',
      timestamp: new Date().toISOString()
    });
  });

  // Basic API status
  app.get('/api/status', (_req, res) => {
    res.json({
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  });

  // Mock terms endpoint
  app.get('/api/terms', (_req, res) => {
    res.json({
      data: [],
      total: 0,
      page: 1,
      perPage: 10,
      message: 'Terms endpoint - minimal mode'
    });
  });

  // Mock search endpoint
  app.get('/api/search', (_req, res) => {
    res.json({
      results: [],
      total: 0,
      query: _req.query.q || '',
      message: 'Search endpoint - minimal mode'
    });
  });

  // Mock auth endpoints
  app.post('/api/auth/login', (_req, res) => {
    res.json({
      success: true,
      message: 'Mock login - minimal mode',
      token: 'mock-token'
    });
  });

  app.get('/api/auth/status', (_req, res) => {
    res.json({
      authenticated: false,
      message: 'Auth status - minimal mode'
    });
  });

  logger.info('✅ Minimal routes registered successfully');
}