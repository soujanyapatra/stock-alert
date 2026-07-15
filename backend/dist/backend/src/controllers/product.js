"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProduct = exports.getProductDetails = void 0;
const db_1 = __importDefault(require("../database/db"));
const registry_1 = require("../providers/registry");
const logger_1 = require("../utils/logger");
// Helpers to format lowercase PG column names to camelCase typescript types
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
const formatHistoryEntry = (row) => ({
    id: row.id,
    productId: row.productid,
    price: Number(row.price),
    stockStatus: row.stockstatus,
    checkedAt: row.checkedat,
});
const getProductDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const productResult = await db_1.default.query('SELECT * FROM products WHERE id = ?', [id]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const product = formatProduct(productResult.rows[0]);
        const historyResult = await db_1.default.query('SELECT * FROM history WHERE productid = ? ORDER BY checkedat DESC', [id]);
        const history = historyResult.rows.map(formatHistoryEntry);
        res.json({
            product,
            history
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching product details for ID ${id}:`, error.message || error);
        res.status(500).json({ error: 'Failed to retrieve product details' });
    }
};
exports.getProductDetails = getProductDetails;
const checkProduct = async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'A valid product URL is required' });
    }
    const provider = registry_1.providerRegistry.getProviderForUrl(url);
    if (!provider) {
        return res.status(400).json({ error: 'Scraper provider not found. Only Amazon URLs are supported for now.' });
    }
    try {
        logger_1.logger.info(`On-demand check requested for URL: ${url}`);
        const result = await provider.fetchProduct(url);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error(`Failed on-demand check for URL ${url}:`, error.message || error);
        res.status(500).json({ error: error.message || 'Failed to check product. Please verify the URL.' });
    }
};
exports.checkProduct = checkProduct;
