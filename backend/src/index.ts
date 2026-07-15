import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { logger } from './utils/logger';
import db from './database/db';
import { initScheduler } from './scheduler';

// Import routes
import alertRoutes from './routes/alert';
import productRoutes from './routes/product';
import schedulerRoutes from './routes/scheduler';
import healthRoutes from './routes/health';

// Load environment variables
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProduction ? false : '*', // In production, same origin — no CORS needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve built frontend in production
let frontendDist = '';
if (isProduction) {
  // Check typical production Docker layout relative path first, then local build dev layout path
  const pathsToTry = [
    path.join(__dirname, '../../../../frontend/dist'),
    path.join(__dirname, '../../../frontend/dist'),
    path.join(__dirname, '../../frontend/dist')
  ];
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      frontendDist = p;
      break;
    }
  }
  if (frontendDist) {
    app.use(express.static(frontendDist));
  } else {
    logger.warn('Could not locate frontend dist directory for static serving.');
  }
}

// Routes
app.use('/api/alerts', alertRoutes);
app.use('/api/products', productRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/health', healthRoutes);

// SPA fallback — all non-API routes serve index.html for Vue Router
if (isProduction && frontendDist) {
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled request error:', err.message || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize and Start Server
let server: any;

db.initDb().then(() => {
  // Initialize Cron Scheduler
  initScheduler();

  server = app.listen(PORT, () => {
    logger.info(`Stock Alert Backend running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize database on startup. Exiting...', err.message || err);
  process.exit(1);
});

// Graceful Shutdown
const handleShutdown = () => {
  logger.info('Shutting down backend server...');
  const closeDbAndExit = async () => {
    try {
      await db.pool.end();
      logger.info('Database connection pool closed.');
    } catch (e: any) {
      logger.error('Error closing database pool:', e.message || e);
    }
    process.exit(0);
  };

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await closeDbAndExit();
    });
  } else {
    closeDbAndExit();
  }
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
