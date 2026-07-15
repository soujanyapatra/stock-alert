import cron from 'node-cron';
import db from '../database/db';
import { providerRegistry } from '../providers/registry';
import { logger } from '../utils/logger';
import { Product, StockStatus } from '../../../shared/types';

let isChecking = false;

/**
 * Runs a check on all active products.
 * An active product is one that has at least one enabled alert.
 */
export async function runSchedulerCheck(productId?: number): Promise<{ processed: number; errors: number; changes: number }> {
  if (isChecking) {
    logger.warn('Scheduler check is already running. Skipping this cycle.');
    return { processed: 0, errors: 0, changes: 0 };
  }

  isChecking = true;
  logger.info(productId ? `Starting single-product refresh check for ID: ${productId}...` : 'Starting scheduled product availability check...');

  let processedCount = 0;
  let errorCount = 0;
  let changeCount = 0;

  try {
    // 1. Get products to check
    let activeProducts: Product[] = [];
    if (productId) {
      const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as Product | undefined;
      if (prod) {
        activeProducts = [prod];
      }
    } else {
      activeProducts = db.prepare(`
        SELECT DISTINCT p.* FROM products p
        JOIN alerts a ON p.id = a.productId
        WHERE a.enabled = 1
      `).all() as Product[];
    }

    logger.info(`Found ${activeProducts.length} active products to check.`);

    for (const product of activeProducts) {
      try {
        const provider = providerRegistry.getProviderForUrl(product.url);
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
        const updateTx = db.transaction(() => {
          // Update product info
          db.prepare(`
            UPDATE products 
            SET currentPrice = ?, stockStatus = ?, lastChecked = ?, name = ?, image = ?
            WHERE id = ?
          `).run(newPrice, newStatus, timestamp, result.name, result.image, product.id);

          // Add history entry
          db.prepare(`
            INSERT INTO history (productId, price, stockStatus, checkedAt)
            VALUES (?, ?, ?, ?)
          `).run(product.id, newPrice, newStatus, timestamp);
        });

        updateTx();

        processedCount++;

        if (oldStatus !== newStatus) {
          changeCount++;
          logger.info(`Stock status changed for "${product.name}" (ASIN: ${product.asin}): ${oldStatus} -> ${newStatus}`);
        }

        // Wait brief delay between products to avoid aggressive crawling blocks
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (err: any) {
        errorCount++;
        logger.error(`Failed to update product ID ${product.id} (ASIN: ${product.asin}):`, err.message || err);
      }
    }

    logger.info(`Product check completed. Processed: ${processedCount}, Changes detected: ${changeCount}, Errors: ${errorCount}`);
  } catch (err: any) {
    logger.error('General failure in scheduler cycle:', err.message || err);
  } finally {
    isChecking = false;
  }

  return { processed: processedCount, errors: errorCount, changes: changeCount };
}

/**
 * Initializes the scheduler to run every 10 minutes.
 */
export function initScheduler() {
  logger.info('Registering cron job: run every 10 minutes.');
  // Every 10 minutes: */10 * * * *
  cron.schedule('*/10 * * * *', async () => {
    logger.info('Cron trigger fired.');
    await runSchedulerCheck();
  });
}
