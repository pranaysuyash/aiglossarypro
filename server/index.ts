import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { checkAndLoadExcelData } from "./autoLoadExcel";
import { getServerConfig, logConfigStatus } from "./config";

const app = express();
const wsInstance = expressWs(app);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Load and validate configuration
  logConfigStatus();
  
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Get server configuration
  const serverConfig = getServerConfig();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (serverConfig.nodeEnv === "development") {
    // For now, skip Vite setup to get basic server working
    // TODO: Re-enable Vite setup after basic functionality is confirmed
    serveStatic(app);
  } else {
    serveStatic(app);
  }

  // Use configurable port (fallback to 5000 for Replit compatibility)
  const port = process.env.REPLIT_ENVIRONMENT ? 5000 : serverConfig.port;
  
  const server = app.listen(port, '127.0.0.1', () => {
    log(`🚀 Server running on http://127.0.0.1:${port} in ${serverConfig.nodeEnv} mode`);
    log(`🔍 Server address: ${JSON.stringify(server.address())}`);
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
  });
    
  // Temporarily disable auto-loading to fix SQL issues first
  console.log("⚠️  Excel auto-loading temporarily disabled - fixing SQL issues first");
})();
