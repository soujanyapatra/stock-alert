import { Request, Response } from 'express';
import db from '../database/db';
import { providerRegistry } from '../providers/registry';
import { logger } from '../utils/logger';
import { Product, HistoryEntry } from '../../../shared/types';

export const getProductDetails = (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product | undefined;
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const history = db.prepare(`
      SELECT * FROM history 
      WHERE productId = ? 
      ORDER BY checkedAt DESC
    `).all(id) as HistoryEntry[];

    res.json({
      product,
      history
    });
  } catch (error: any) {
    logger.error(`Error fetching product details for ID ${id}:`, error.message || error);
    res.status(500).json({ error: 'Failed to retrieve product details' });
  }
};

export const checkProduct = async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid product URL is required' });
  }

  const provider = providerRegistry.getProviderForUrl(url);
  if (!provider) {
    return res.status(400).json({ error: 'Scraper provider not found. Only Amazon URLs are supported for now.' });
  }

  try {
    logger.info(`On-demand check requested for URL: ${url}`);
    const result = await provider.fetchProduct(url);
    res.json(result);
  } catch (error: any) {
    logger.error(`Failed on-demand check for URL ${url}:`, error.message || error);
    res.status(500).json({ error: error.message || 'Failed to check product. Please verify the URL.' });
  }
};
