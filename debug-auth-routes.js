#!/usr/bin/env node

/**
 * Debug script to test authentication routes
 */

const http = require('http');
const https = require('https');
const { log: logger } = require('./server/utils/logger');

const SERVER_URL = 'http://localhost:3001';

// Test different authentication routes
const routes = [
  '/api/auth/providers',
  '/api/auth/check',
  '/api/auth/me',
  '/api/auth/firebase/login',
  '/api/auth/firebase/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/user',
  '/api/health',
];

async function testRoute(route) {
  return new Promise(resolve => {
    const url = `${SERVER_URL}${route}`;
    const client = url.startsWith('https') ? https : http;

    logger.info('Testing route', { route });

    const req = client.request(url, { method: 'GET' }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        logger.info('Route response', {
          route,
          status: res.statusCode,
          headers: res.headers,
          response:
            res.statusCode === 200
              ? (() => {
                  try {
                    return JSON.parse(data);
                  } catch (e) {
                    return data.substring(0, 200) + '...';
                  }
                })()
              : data,
        });
        resolve({ route, status: res.statusCode, response: data });
      });
    });

    req.on('error', err => {
      logger.error('Route test error', { route, error: err.message });
      resolve({ route, error: err.message });
    });

    req.end();
  });
}

async function main() {
  logger.info('Starting authentication routes test');

  for (const route of routes) {
    await testRoute(route);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }

  logger.info('Route testing complete');
}

main().catch(console.error);
