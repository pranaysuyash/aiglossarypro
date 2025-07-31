import type { Express } from 'express';
import express from 'express';
import { nanoid } from 'nanoid';
import * as fs from 'node:fs';
import type { Server } from 'node:http';
import * as path from 'node:path';
import * as vite from 'vite';
import { log as logger } from './utils/logger';

// __dirname is not available in ES modules but since we're compiling to CommonJS,
// we can use a workaround
declare const __dirname: string;

// Logger is now handled internally by Vite

export function log(message: string, source = 'express') {
  logger.info(message, { source });
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as true,
  };

  const viteServer = await (vite as any).createServer({
    configFile: false,
    root: path.resolve(__dirname, '../client'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../client/src'),
        '@shared': path.resolve(__dirname, '../shared'),
        '@assets': path.resolve(__dirname, '../attached_assets'),
      },
    },
    server: serverOptions,
    appType: 'custom',
  });

  app.use(viteServer.middlewares);
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
      const page = await viteServer.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      viteServer.ssrFixStacktrace(e as Error);
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
