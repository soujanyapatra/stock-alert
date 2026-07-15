import { Request, Response } from 'express';
import db from '../database/db';
import { providerRegistry } from '../providers/registry';
import { logger } from '../utils/logger';
import { Product, HistoryEntry } from '../../../shared/types';

// Helpers to format lowercase PG column names to camelCase typescript types
const formatProduct = (row: any): Product => ({
  id: row.id,
  asin: row.asin,
  url: row.url,
  name: row.name,
  image: row.image,
  currentPrice: Number(row.currentprice),
  stockStatus: row.stockstatus,
  lastChecked: row.lastchecked,
});

const formatHistoryEntry = (row: any): HistoryEntry => ({
  id: row.id,
  productId: row.productid,
  price: Number(row.price),
  stockStatus: row.stockstatus,
  checkedAt: row.checkedat,
});

export const getProductDetails = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const productResult = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = formatProduct(productResult.rows[0]);

    const historyResult = await db.query(
      'SELECT * FROM history WHERE productid = ? ORDER BY checkedat DESC',
      [id]
    );

    const history = historyResult.rows.map(formatHistoryEntry);

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
