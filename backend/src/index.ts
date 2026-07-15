import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets in production (optional, future-proofing)
// app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Routes
app.use('/api/alerts', alertRoutes);
app.use('/api/products', productRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/health', healthRoutes);

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
