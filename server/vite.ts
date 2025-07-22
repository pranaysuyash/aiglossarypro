import fs from 'node:fs';
import type { Server } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import { nanoid } from 'nanoid';
import { createLogger, createServer as createViteServer } from 'vite';
import viteConfig from '../scripts/vite.config';
import { log as logger } from './utils/logger';

// Get current directory in a way that works with both CommonJS and ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = 'express') {
  logger.info(message, { source });
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: 'custom',
  });

  app.use(vite.middlewares);
  // Only serve HTML for non-API routes
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes, they should be handled by the API handlers
    if (url.startsWith('/api/')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(__dirname, '..', 'client', 'index.html');

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, '..', 'dist', 'public');

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}
