"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSchedulerCheck = runSchedulerCheck;
exports.initScheduler = initScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const crypto_1 = require("crypto");
const db_1 = __importDefault(require("../database/db"));
const registry_1 = require("../providers/registry");
const logger_1 = require("../utils/logger");
const formatProduct = (row) => ({
    id: row.id,
    asin: row.asin,
    url: row.url,
    name: row.name,
    image: row.image,
    currentPrice: Number(row.currentprice),
    stockStatus: row.stockstatus,
    lastChecked: row.lastchecked,
});
let isChecking = false;
/**
 * Runs a check on all active products.
 * An active product is one that has at least one enabled alert.
 */
async function runSchedulerCheck(productId) {
    if (isChecking) {
        logger_1.logger.warn('Scheduler check is already running. Skipping this cycle.');
        return { processed: 0, errors: 0, changes: 0 };
    }
    isChecking = true;
    logger_1.logger.info(productId ? `Starting single-product refresh check for ID: ${productId}...` : 'Starting scheduled product availability check...');
    let processedCount = 0;
    let errorCount = 0;
    let changeCount = 0;
    try {
        // 1. Get products to check
        let activeProducts = [];
        if (productId) {
            const prodResult = await db_1.default.query('SELECT * FROM products WHERE id = ?', [productId]);
            if (prodResult.rows.length > 0) {
                activeProducts = [formatProduct(prodResult.rows[0])];
            }
        }
        else {
            const activeResult = await db_1.default.query(`
        SELECT DISTINCT p.* FROM products p
        JOIN alerts a ON p.id = a.productid
        WHERE a.enabled = 1
      `);
            activeProducts = activeResult.rows.map(formatProduct);
        }
        logger_1.logger.info(`Found ${activeProducts.length} active products to check.`);
        for (const product of activeProducts) {
            try {
                const provider = registry_1.providerRegistry.getProviderForUrl(product.url);
                if (!provider) {
                    throw new Error(`No scraper provider found for URL: ${product.url}`);
                }
                // Fetch latest status
                const result = await provider.fetchProduct(product.url);
                const timestamp = new Date().toISOString();
                const oldStatus = product.stockStatus;
                const newStatus = result.stockStatus;
                const newPrice = result.currentPrice;
                // Perform updates inside a MySQL transaction
                const connection = await db_1.default.pool.getConnection();
                try {
                    await connection.beginTransaction();
                    // Update product info
                    await connection.query(`
            UPDATE products 
            SET currentprice = ?, stockstatus = ?, lastchecked = ?, name = ?, image = ?
            WHERE id = ?
          `, [newPrice, newStatus, timestamp, result.name, result.image, product.id]);
                    // Add history entry
                    const historyId = (0, crypto_1.randomUUID)();
                    await connection.query(`
            INSERT INTO history (id, productid, price, stockstatus, checkedat)
            VALUES (?, ?, ?, ?, ?)
          `, [historyId, product.id, newPrice, newStatus, timestamp]);
                    await connection.commit();
                }
                catch (txErr) {
                    await connection.rollback();
                    throw txErr;
                }
                finally {
                    connection.release();
                }
                processedCount++;
                if (oldStatus !== newStatus) {
                    changeCount++;
                    logger_1.logger.info(`Stock status changed for "${product.name}" (ASIN: ${product.asin}): ${oldStatus} -> ${newStatus}`);
                }
                // Wait brief delay between products to avoid aggressive crawling blocks
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
            catch (err) {
                errorCount++;
                logger_1.logger.error(`Failed to update product ID ${product.id} (ASIN: ${product.asin}):`, err.message || err);
            }
        }
        logger_1.logger.info(`Product check completed. Processed: ${processedCount}, Changes detected: ${changeCount}, Errors: ${errorCount}`);
    }
    catch (err) {
        logger_1.logger.error('General failure in scheduler cycle:', err.message || err);
    }
    finally {
        isChecking = false;
    }
    return { processed: processedCount, errors: errorCount, changes: changeCount };
}
/**
 * Initializes the scheduler to run every 10 minutes.
 */
function initScheduler() {
    logger_1.logger.info('Registering cron job: run every 10 minutes.');
    // Every 10 minutes: */10 * * * *
    node_cron_1.default.schedule('*/10 * * * *', async () => {
        logger_1.logger.info('Cron trigger fired.');
        await runSchedulerCheck();
    });
}
