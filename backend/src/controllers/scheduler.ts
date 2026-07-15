import { Request, Response } from 'express';
import { runSchedulerCheck } from '../scheduler';
import { logger } from '../utils/logger';

export const runScheduler = async (req: Request, res: Response) => {
  const { productId } = req.body;
  
  try {
    logger.info(productId ? `Manual trigger for product ID ${productId} check received.` : 'Manual trigger for scheduler run received.');
    
    const parsedProductId = productId ? parseInt(productId, 10) : undefined;
    const result = await runSchedulerCheck(isNaN(parsedProductId as number) ? undefined : parsedProductId);
    
    res.json({
      message: 'Scheduler job run completed.',
      ...result
    });
  } catch (error: any) {
    logger.error('Error triggering scheduler manually:', error.message || error);
    res.status(500).json({ error: 'Failed to run scheduler check.' });
  }
};
