import { Request, Response } from 'express';
import { runSchedulerCheck } from '../scheduler';
import { logger } from '../utils/logger';

export const runScheduler = async (req: Request, res: Response) => {
  const { productId } = req.body;
  
  try {
    logger.info(productId ? `Manual trigger for product ID ${productId} check received.` : 'Manual trigger for scheduler run received.');
    
    const result = await runSchedulerCheck(productId ? String(productId) : undefined);
    
    res.json({
      message: 'Scheduler job run completed.',
      ...result
    });
  } catch (error: any) {
    logger.error('Error triggering scheduler manually:', error.message || error);
    res.status(500).json({ error: 'Failed to run scheduler check.' });
  }
};
