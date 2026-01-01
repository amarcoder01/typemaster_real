import fs from "node:fs";
import { type Server } from "node:http";
import path from "node:path";

import express, { type Express, type Request, type Response } from "express";

import runApp, { log } from "./app";
import { startLeaderboardRefreshScheduler } from "./jobs/schedule-leaderboard-refresh.js";
import { leaderboardWS } from "./leaderboard-websocket.js";

// Cache durations for different file types
const CACHE_DURATIONS = {
  // Hashed assets (JS, CSS with content hash) - cache for 1 year
  immutable: 31536000,
  // Static assets (images, fonts) - cache for 1 week
  static: 604800,
  // HTML files - no cache (always fresh for SPA routing)
  html: 0,
  // Service worker - short cache for updates
  sw: 3600,
};

export async function serveStatic(app: Express, server: Server) {
  // Initialize WebSocket services
  leaderboardWS.initialize(server);
  
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files with optimized caching
  app.use(express.static(distPath, {
    etag: true,
    lastModified: true,
    maxAge: 0, // Default, will be overridden by setHeaders
    setHeaders: (res: Response, filePath: string) => {
      const ext = path.extname(filePath).toLowerCase();
      
      // Hashed assets (Vite adds content hash) - immutable cache
      if (filePath.includes('/assets/') && (ext === '.js' || ext === '.css')) {
        res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATIONS.immutable}, immutable`);
        return;
      }
      
      // Service worker - short cache for quick updates
      if (filePath.endsWith('service-worker.js') || filePath.endsWith('sw.js')) {
        res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATIONS.sw}`);
        return;
      }
      
      // Images and fonts - long cache
      if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2'].includes(ext)) {
        res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATIONS.static}`);
        return;
      }
      
      // HTML files - no cache (SPA routing needs fresh HTML)
      if (ext === '.html' || ext === '') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return;
      }
      
      // JSON files (manifest, etc.) - short cache
      if (ext === '.json') {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return;
      }
      
      // Default: short cache
      res.setHeader('Cache-Control', 'public, max-age=3600');
    },
  }));

  // SPA fallback - serve index.html for all unmatched routes
  app.use("*", (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

(async () => {
  try {
    await runApp(serveStatic);
    
    // Start background jobs after server is running
    await startLeaderboardRefreshScheduler();
    
    log("Production server fully initialized", "startup", "INFO");
  } catch (error) {
    log(`Failed to start server: ${error}`, "startup", "ERROR");
    process.exit(1);
  }
})();
