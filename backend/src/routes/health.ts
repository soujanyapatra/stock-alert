import { Router, Request, Response } from 'express';
import db from '../database/db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'UP', db: 'connected', timestamp: new Date().toISOString(), uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: 'DOWN', db: 'disconnected', timestamp: new Date().toISOString() });
  }
});

export default router;
