import "dotenv/config";
import { type Server } from "node:http";

import compression from "compression";
import cors from "cors";
import express, { type Express, type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { requestIdMiddleware, errorHandler, notFoundHandler } from "./error-middleware";
import { metricsCollector } from "./metrics";
import { registerShutdownHandlers } from "./graceful-shutdown";

const isProduction = process.env.NODE_ENV === "production";

// Cloud Run structured logging format
// https://cloud.google.com/run/docs/logging
export function log(message: string, source = "express", severity: "INFO" | "WARNING" | "ERROR" = "INFO") {
  if (isProduction) {
    // Cloud Run structured logging (JSON format)
    const logEntry = {
      severity,
      message: `[${source}] ${message}`,
      timestamp: new Date().toISOString(),
      "logging.googleapis.com/sourceLocation": {
        file: "app.ts",
        function: source,
      },
    };
    console.log(JSON.stringify(logEntry));
  } else {
    // Development: human-readable format
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
  }
}

export const app = express();

// Trust proxy for Cloud Run (load balancer)
// Cloud Run uses a single hop, so trust proxy = 1
app.set('trust proxy', 1);

// Enable gzip compression for all responses
// Significantly reduces bandwidth and improves load times
app.use(compression({
  level: 6, // Balanced compression level (1-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if the request includes 'x-no-compression' header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression's default filter (compresses text-based content)
    return compression.filter(req, res);
  },
}));

// CORS configuration for Cloud Run
// Allows requests from custom domains and Cloud Run URLs
const allowedOrigins = process.env.APP_URL 
  ? [process.env.APP_URL, 'https://typemasterai.com', 'https://www.typemasterai.com']
  : ['http://localhost:5000', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (!isProduction) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list or matches Cloud Run pattern
    const isAllowed = allowedOrigins.some(allowed => origin === allowed) ||
      origin.endsWith('.run.app') || // Cloud Run URLs
      origin.endsWith('.web.app') || // Firebase Hosting
      origin.includes('localhost');
    
    if (isAllowed) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies for session-based auth
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400, // Cache preflight for 24 hours
}));

app.use(requestIdMiddleware);

app.use((req, _res, next) => {
  (req as any).startTime = Date.now();
  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
  limit: '10mb',
  // Accept any JSON content type, regardless of charset case (UTF-8, utf-8, etc.)
  type: (req) => {
    const contentType = req.headers['content-type'] || '';
    return contentType.toLowerCase().includes('application/json');
  },
}));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  metricsCollector.recordRequest();

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    metricsCollector.recordResponseTime(duration);

    if (res.statusCode >= 500) {
      metricsCollector.recordError();
    }

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

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  metricsCollector.initialize();

  const server = await registerRoutes(app);

  registerShutdownHandlers(server);

  app.use("/api/*", notFoundHandler);

  app.use(errorHandler);

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Cloud Run sets PORT=8080 automatically. Default to 8080 for production compatibility.
  // For local development, you can set PORT=5000 in your .env file.
  // This serves both the API and the client.
  const port = parseInt(process.env.PORT || '8080', 10);
  const listenOptions: any = { port, host: "0.0.0.0" };
  if (process.platform !== 'win32') {
    listenOptions.reusePort = true;
  }
  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
}
