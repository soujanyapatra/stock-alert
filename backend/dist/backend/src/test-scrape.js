"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amazon_1 = require("./providers/amazon");
const logger_1 = require("./utils/logger");
async function testScrape() {
    const provider = new amazon_1.AmazonProvider();
    const testUrl = 'https://www.amazon.com/dp/B0863TXGM3'; // Sony WH-1000XM4 headphones
    logger_1.logger.info(`Starting test scrape for URL: ${testUrl}`);
    try {
        const result = await provider.fetchProduct(testUrl);
        logger_1.logger.info('Test Scrape Result:', JSON.stringify(result, null, 2));
    }
    catch (err) {
        logger_1.logger.error('Test Scrape Failed:', err.message || err);
    }
}
testScrape();
