"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSchedulerCheck = runSchedulerCheck;
exports.initScheduler = initScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("../database/db"));
const registry_1 = require("../providers/registry");
const logger_1 = require("../utils/logger");
let isChecking = false;
/**
 * Runs a check on all active products.
 * An active product is one that has at least one enabled alert.
 */
async function runSchedulerCheck() {
    if (isChecking) {
        logger_1.logger.warn('Scheduler check is already running. Skipping this cycle.');
        return { processed: 0, errors: 0, changes: 0 };
    }
    isChecking = true;
    logger_1.logger.info('Starting scheduled product availability check...');
    let processedCount = 0;
    let errorCount = 0;
    let changeCount = 0;
    try {
        // 1. Get unique products that have active alerts
        const activeProducts = db_1.default.prepare(`
      SELECT DISTINCT p.* FROM products p
      JOIN alerts a ON p.id = a.productId
      WHERE a.enabled = 1
    `).all();
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
                // Start transaction for DB updates
                const updateTx = db_1.default.transaction(() => {
                    // Update product info
                    db_1.default.prepare(`
            UPDATE products 
            SET currentPrice = ?, stockStatus = ?, lastChecked = ?, name = ?, image = ?
            WHERE id = ?
          `).run(newPrice, newStatus, timestamp, result.name, result.image, product.id);
                    // Add history entry
                    db_1.default.prepare(`
            INSERT INTO history (productId, price, stockStatus, checkedAt)
            VALUES (?, ?, ?, ?)
          `).run(product.id, newPrice, newStatus, timestamp);
                });
                updateTx();
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
