import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { checkAndSmartLoadExcelData } from "./smartExcelLoader";
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

  // Use configurable port (fallback to 5000 for Replit compatibility)
  const port = process.env.REPLIT_ENVIRONMENT ? 5000 : serverConfig.port;
  
  // Create HTTP server instance
  const { createServer } = await import('http');
  const server = createServer(app);
  
  // Setup Vite dev server in development, static files in production
  if (serverConfig.nodeEnv === "development") {
    log("🔧 Setting up Vite dev server for development...");
    try {
      await setupVite(app, server);
      log("✅ Vite dev server setup complete");
    } catch (error) {
      console.error("❌ Error setting up Vite dev server:", error);
      process.exit(1);
    }
  } else {
    log("📦 Setting up static file serving for production...");
    try {
      serveStatic(app);
      log("✅ Static file serving setup complete");
    } catch (error) {
      console.error("❌ Error setting up static file serving:", error);
      process.exit(1);
    }
  }
  
  // Start listening
  server.listen(port, '127.0.0.1', () => {
    log(`🚀 Server running on http://127.0.0.1:${port} in ${serverConfig.nodeEnv} mode`);
    log(`🔍 Server address: ${JSON.stringify(server.address())}`);
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
  });
    
  // Use smart caching system for Excel processing
  console.log("🚀 Starting smart Excel data loading with caching...");
  checkAndSmartLoadExcelData({
    chunkSize: 500,
    enableProgress: true,
    resumeProcessing: false
  }).catch(err => {
    console.error('❌ Error loading Excel data:', err);
  });
})();
