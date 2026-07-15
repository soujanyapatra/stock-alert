import { Request, Response } from 'express';
import db from '../database/db';
import { providerRegistry } from '../providers/registry';
import { logger } from '../utils/logger';
import { Alert, Product } from '../../../shared/types';

export const getAlerts = (req: Request, res: Response) => {
  try {
    const alerts = db.prepare(`
      SELECT 
        a.id as alertId, a.customName, a.enabled, a.createdAt,
        p.id as productId, p.asin, p.url, p.name, p.image, p.currentPrice, p.stockStatus, p.lastChecked
      FROM alerts a
      JOIN products p ON a.productId = p.id
      ORDER BY a.createdAt DESC
    `).all() as any[];

    // Format output to match frontend interface
    const formattedAlerts: Alert[] = alerts.map((row) => ({
      id: row.alertId,
      productId: row.productId,
      customName: row.customName || undefined,
      enabled: row.enabled === 1,
      createdAt: row.createdAt,
      product: {
        id: row.productId,
        asin: row.asin,
        url: row.url,
        name: row.name,
        image: row.image,
        currentPrice: row.currentPrice,
        stockStatus: row.stockStatus,
        lastChecked: row.lastChecked,
      },
    }));

    res.json(formattedAlerts);
  } catch (error: any) {
    logger.error('Error fetching alerts:', error.message || error);
    res.status(500).json({ error: 'Failed to retrieve alerts' });
  }
};

export const createAlert = async (req: Request, res: Response) => {
  const { url, customName } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid product URL is required' });
  }

  const provider = providerRegistry.getProviderForUrl(url);
  if (!provider) {
    return res.status(400).json({ error: 'Scraper provider not found. Only Amazon URLs are supported for now.' });
  }

  const asin = provider.extractAsin(url);
  if (!asin) {
    return res.status(400).json({ error: 'Could not extract unique product ID (ASIN) from URL.' });
  }

  try {
    // 1. Check if product already exists
    let product = db.prepare('SELECT * FROM products WHERE asin = ?').get(asin) as Product | undefined;
    
    if (product) {
      // Check if an alert already exists for this product
      const existingAlert = db.prepare('SELECT * FROM alerts WHERE productId = ?').get(product.id);
      if (existingAlert) {
        return res.status(400).json({ error: 'An alert for this product already exists.' });
      }
    }

    // 2. If product does not exist, scrape it first
    if (!product) {
      logger.info(`Scraping new product for ASIN: ${asin}`);
      const scraped = await provider.fetchProduct(url);
      
      const timestamp = new Date().toISOString();
      
      // Save product and its first history entry in a transaction
      const createProductTx = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT INTO products (asin, url, name, image, currentPrice, stockStatus, lastChecked)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(asin, scraped.url, scraped.name, scraped.image, scraped.currentPrice, scraped.stockStatus, timestamp);
        const productId = result.lastInsertRowid as number;

        // Insert first history entry
        db.prepare(`
          INSERT INTO history (productId, price, stockStatus, checkedAt)
          VALUES (?, ?, ?, ?)
        `).run(productId, scraped.currentPrice, scraped.stockStatus, timestamp);

        return productId;
      });

      const newProductId = createProductTx();
      product = db.prepare('SELECT * FROM products WHERE id = ?').get(newProductId) as Product;
    }

    // 3. Create the alert
    const createdAt = new Date().toISOString();
    const insertAlertStmt = db.prepare(`
      INSERT INTO alerts (productId, customName, enabled, createdAt)
      VALUES (?, ?, ?, ?)
    `);
    const result = insertAlertStmt.run(product.id, customName || null, 1, createdAt);
    const alertId = result.lastInsertRowid as number;

    const formattedAlert: Alert = {
      id: alertId,
      productId: product.id,
      customName: customName || undefined,
      enabled: true,
      createdAt,
      product
    };

    logger.info(`Alert ID ${alertId} created successfully for ASIN ${asin}`);
    res.status(201).json(formattedAlert);
  } catch (error: any) {
    logger.error('Error creating alert:', error.message || error);
    res.status(500).json({ error: error.message || 'Failed to create alert.' });
  }
};

export const updateAlert = (req: Request, res: Response) => {
  const { id } = req.params;
  const { enabled, customName } = req.body;

  try {
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as any;
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    let updateFields: string[] = [];
    let params: any[] = [];

    if (enabled !== undefined) {
      updateFields.push('enabled = ?');
      params.push(enabled ? 1 : 0);
    }

    if (customName !== undefined) {
      updateFields.push('customName = ?');
      params.push(customName || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    params.push(id);

    db.prepare(`
      UPDATE alerts
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...params);

    // Retrieve updated alert
    const updatedRow = db.prepare(`
      SELECT 
        a.id as alertId, a.customName, a.enabled, a.createdAt,
        p.id as productId, p.asin, p.url, p.name, p.image, p.currentPrice, p.stockStatus, p.lastChecked
      FROM alerts a
      JOIN products p ON a.productId = p.id
      WHERE a.id = ?
    `).get(id) as any;

    const formattedAlert: Alert = {
      id: updatedRow.alertId,
      productId: updatedRow.productId,
      customName: updatedRow.customName || undefined,
      enabled: updatedRow.enabled === 1,
      createdAt: updatedRow.createdAt,
      product: {
        id: updatedRow.productId,
        asin: updatedRow.asin,
        url: updatedRow.url,
        name: updatedRow.name,
        image: updatedRow.image,
        currentPrice: updatedRow.currentPrice,
        stockStatus: updatedRow.stockStatus,
        lastChecked: updatedRow.lastChecked,
      }
    };

    res.json(formattedAlert);
  } catch (error: any) {
    logger.error(`Error updating alert ID ${id}:`, error.message || error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

export const deleteAlert = (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as any;
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const productId = alert.productId;

    // Delete alert and then check if the product has other alerts. If none, delete the product.
    const deleteTx = db.transaction(() => {
      // 1. Delete the alert
      db.prepare('DELETE FROM alerts WHERE id = ?').run(id);

      // 2. Check if product has other alerts
      const otherAlerts = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE productId = ?').get(productId) as { count: number };
      
      if (otherAlerts.count === 0) {
        logger.info(`Cleaning up orphaned product ID ${productId}`);
        db.prepare('DELETE FROM products WHERE id = ?').run(productId);
      }
    });

    deleteTx();

    res.json({ message: 'Alert deleted successfully' });
  } catch (error: any) {
    logger.error(`Error deleting alert ID ${id}:`, error.message || error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};
