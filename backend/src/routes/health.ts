import { Router, Request, Response } from 'express';
import db from '../database/db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'UP', db: 'connected', timestamp: new Date().toISOString(), uptime: process.uptime() });
  } catch (err: any) {
    res.json({
      status: 'UP',
      db: 'disconnected',
      error: err.message || err,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
});

export default router;
