import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../database/db';
import { providerRegistry } from '../providers/registry';
import { logger } from '../utils/logger';
import { Alert, Product } from '../../../shared/types';

// Helper to format lowercase DB column names to camelCase typescript types
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

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT 
        a.id as alertid, a.customname, a.enabled, a.createdat,
        p.id as productid, p.asin, p.url, p.name, p.image, p.currentprice, p.stockstatus, p.lastchecked
      FROM alerts a
      JOIN products p ON a.productid = p.id
      ORDER BY a.createdat DESC
    `);

    const formattedAlerts: Alert[] = result.rows.map((row: any) => ({
      id: row.alertid,
      productId: row.productid,
      customName: row.customname || undefined,
      enabled: row.enabled === 1,
      createdAt: row.createdat,
      product: {
        id: row.productid,
        asin: row.asin,
        url: row.url,
        name: row.name,
        image: row.image,
        currentPrice: Number(row.currentprice),
        stockStatus: row.stockstatus,
        lastChecked: row.lastchecked,
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
    const productResult = await db.query('SELECT * FROM products WHERE asin = ?', [asin]);
    let product = productResult.rows[0] ? formatProduct(productResult.rows[0]) : undefined;
    
    if (product) {
      // Check if an alert already exists for this product
      const existingAlertResult = await db.query('SELECT * FROM alerts WHERE productid = ?', [product.id]);
      if (existingAlertResult.rows.length > 0) {
        return res.status(400).json({ error: 'An alert for this product already exists.' });
      }
    }

    // 2. If product does not exist, scrape it first
    if (!product) {
      logger.info(`Scraping new product for ASIN: ${asin}`);
      const scraped = await provider.fetchProduct(url);
      
      const timestamp = new Date().toISOString();
      const productId = randomUUID();
      const historyId = randomUUID();
      
      // Save product and its first history entry inside a MySQL transaction
      const connection = await db.pool.getConnection();
      try {
        await connection.beginTransaction();
        
        await connection.query(`
          INSERT INTO products (id, asin, url, name, image, currentprice, stockstatus, lastchecked)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [productId, asin, scraped.url, scraped.name, scraped.image, scraped.currentPrice, scraped.stockStatus, timestamp]);

        // Insert first history entry
        await connection.query(`
          INSERT INTO history (id, productid, price, stockstatus, checkedat)
          VALUES (?, ?, ?, ?, ?)
        `, [historyId, productId, scraped.currentPrice, scraped.stockStatus, timestamp]);

        await connection.commit();
      } catch (txErr) {
        await connection.rollback();
        throw txErr;
      } finally {
        connection.release();
      }

      const prodResult = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
      product = formatProduct(prodResult.rows[0]);
    }

    // 3. Create the alert
    const createdAt = new Date().toISOString();
    const alertId = randomUUID();
    
    await db.query(`
      INSERT INTO alerts (id, productid, customname, enabled, createdat)
      VALUES (?, ?, ?, ?, ?)
    `, [alertId, product.id, customName || null, 1, createdAt]);

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

export const updateAlert = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { enabled, customName } = req.body;

  try {
    const alertResult = await db.query('SELECT * FROM alerts WHERE id = ?', [id]);
    if (alertResult.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    let updateFields: string[] = [];
    let params: any[] = [];

    if (enabled !== undefined) {
      updateFields.push('enabled = ?');
      params.push(enabled ? 1 : 0);
    }

    if (customName !== undefined) {
      updateFields.push('customname = ?');
      params.push(customName || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    params.push(id);
    const queryText = `
      UPDATE alerts
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await db.query(queryText, params);

    // Retrieve updated alert
    const updatedResult = await db.query(`
      SELECT 
        a.id as alertid, a.customname, a.enabled, a.createdat,
        p.id as productid, p.asin, p.url, p.name, p.image, p.currentprice, p.stockstatus, p.lastchecked
      FROM alerts a
      JOIN products p ON a.productid = p.id
      WHERE a.id = ?
    `, [id]);

    const row = updatedResult.rows[0];
    const formattedAlert: Alert = {
      id: row.alertid,
      productId: row.productid,
      customName: row.customname || undefined,
      enabled: row.enabled === 1,
      createdAt: row.createdat,
      product: {
        id: row.productid,
        asin: row.asin,
        url: row.url,
        name: row.name,
        image: row.image,
        currentPrice: Number(row.currentprice),
        stockStatus: row.stockstatus,
        lastChecked: row.lastchecked,
      }
    };

    res.json(formattedAlert);
  } catch (error: any) {
    logger.error(`Error updating alert ID ${id}:`, error.message || error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
};

export const deleteAlert = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const alertResult = await db.query('SELECT * FROM alerts WHERE id = ?', [id]);
    if (alertResult.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const alert = alertResult.rows[0];
    const productId = alert.productid;

    // Delete alert and orphaned product inside a MySQL transaction
    const connection = await db.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 1. Delete the alert
      await connection.query('DELETE FROM alerts WHERE id = ?', [id]);

      // 2. Check if product has other alerts
      const [otherAlertsResult]: any = await connection.query('SELECT COUNT(*) as count FROM alerts WHERE productid = ?', [productId]);
      const otherAlertsCount = parseInt(otherAlertsResult[0].count, 10);
      
      if (otherAlertsCount === 0) {
        logger.info(`Cleaning up orphaned product ID ${productId}`);
        await connection.query('DELETE FROM products WHERE id = ?', [productId]);
      }

      await connection.commit();
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }

    res.json({ message: 'Alert deleted successfully' });
  } catch (error: any) {
    logger.error(`Error deleting alert ID ${id}:`, error.message || error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};
