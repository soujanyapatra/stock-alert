"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAlert = exports.updateAlert = exports.createAlert = exports.getAlerts = void 0;
const db_1 = __importDefault(require("../database/db"));
const registry_1 = require("../providers/registry");
const logger_1 = require("../utils/logger");
const getAlerts = (req, res) => {
    try {
        const alerts = db_1.default.prepare(`
      SELECT 
        a.id as alertId, a.customName, a.enabled, a.createdAt,
        p.id as productId, p.asin, p.url, p.name, p.image, p.currentPrice, p.stockStatus, p.lastChecked
      FROM alerts a
      JOIN products p ON a.productId = p.id
      ORDER BY a.createdAt DESC
    `).all();
        // Format output to match frontend interface
        const formattedAlerts = alerts.map((row) => ({
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching alerts:', error.message || error);
        res.status(500).json({ error: 'Failed to retrieve alerts' });
    }
};
exports.getAlerts = getAlerts;
const createAlert = async (req, res) => {
    const { url, customName } = req.body;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid product URL is required' });
    }
    const provider = registry_1.providerRegistry.getProviderForUrl(url);
    if (!provider) {
        return res.status(400).json({ error: 'Scraper provider not found. Only Amazon URLs are supported for now.' });
    }
    const asin = provider.extractAsin(url);
    if (!asin) {
        return res.status(400).json({ error: 'Could not extract unique product ID (ASIN) from URL.' });
    }
    try {
        // 1. Check if product already exists
        let product = db_1.default.prepare('SELECT * FROM products WHERE asin = ?').get(asin);
        if (product) {
            // Check if an alert already exists for this product
            const existingAlert = db_1.default.prepare('SELECT * FROM alerts WHERE productId = ?').get(product.id);
            if (existingAlert) {
                return res.status(400).json({ error: 'An alert for this product already exists.' });
            }
        }
        // 2. If product does not exist, scrape it first
        if (!product) {
            logger_1.logger.info(`Scraping new product for ASIN: ${asin}`);
            const scraped = await provider.fetchProduct(url);
            const timestamp = new Date().toISOString();
            // Save product and its first history entry in a transaction
            const createProductTx = db_1.default.transaction(() => {
                const stmt = db_1.default.prepare(`
          INSERT INTO products (asin, url, name, image, currentPrice, stockStatus, lastChecked)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
                const result = stmt.run(asin, scraped.url, scraped.name, scraped.image, scraped.currentPrice, scraped.stockStatus, timestamp);
                const productId = result.lastInsertRowid;
                // Insert first history entry
                db_1.default.prepare(`
          INSERT INTO history (productId, price, stockStatus, checkedAt)
          VALUES (?, ?, ?, ?)
        `).run(productId, scraped.currentPrice, scraped.stockStatus, timestamp);
                return productId;
            });
            const newProductId = createProductTx();
            product = db_1.default.prepare('SELECT * FROM products WHERE id = ?').get(newProductId);
        }
        // 3. Create the alert
        const createdAt = new Date().toISOString();
        const insertAlertStmt = db_1.default.prepare(`
      INSERT INTO alerts (productId, customName, enabled, createdAt)
      VALUES (?, ?, ?, ?)
    `);
        const result = insertAlertStmt.run(product.id, customName || null, 1, createdAt);
        const alertId = result.lastInsertRowid;
        const formattedAlert = {
            id: alertId,
            productId: product.id,
            customName: customName || undefined,
            enabled: true,
            createdAt,
            product
        };
        logger_1.logger.info(`Alert ID ${alertId} created successfully for ASIN ${asin}`);
        res.status(201).json(formattedAlert);
    }
    catch (error) {
        logger_1.logger.error('Error creating alert:', error.message || error);
        res.status(500).json({ error: error.message || 'Failed to create alert.' });
    }
};
exports.createAlert = createAlert;
const updateAlert = (req, res) => {
    const { id } = req.params;
    const { enabled, customName } = req.body;
    try {
        const alert = db_1.default.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        let updateFields = [];
        let params = [];
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
        db_1.default.prepare(`
      UPDATE alerts
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...params);
        // Retrieve updated alert
        const updatedRow = db_1.default.prepare(`
      SELECT 
        a.id as alertId, a.customName, a.enabled, a.createdAt,
        p.id as productId, p.asin, p.url, p.name, p.image, p.currentPrice, p.stockStatus, p.lastChecked
      FROM alerts a
      JOIN products p ON a.productId = p.id
      WHERE a.id = ?
    `).get(id);
        const formattedAlert = {
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
    }
    catch (error) {
        logger_1.logger.error(`Error updating alert ID ${id}:`, error.message || error);
        res.status(500).json({ error: 'Failed to update alert' });
    }
};
exports.updateAlert = updateAlert;
const deleteAlert = (req, res) => {
    const { id } = req.params;
    try {
        const alert = db_1.default.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }
        const productId = alert.productId;
        // Delete alert and then check if the product has other alerts. If none, delete the product.
        const deleteTx = db_1.default.transaction(() => {
            // 1. Delete the alert
            db_1.default.prepare('DELETE FROM alerts WHERE id = ?').run(id);
            // 2. Check if product has other alerts
            const otherAlerts = db_1.default.prepare('SELECT COUNT(*) as count FROM alerts WHERE productId = ?').get(productId);
            if (otherAlerts.count === 0) {
                logger_1.logger.info(`Cleaning up orphaned product ID ${productId}`);
                db_1.default.prepare('DELETE FROM products WHERE id = ?').run(productId);
            }
        });
        deleteTx();
        res.json({ message: 'Alert deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error(`Error deleting alert ID ${id}:`, error.message || error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
};
exports.deleteAlert = deleteAlert;
