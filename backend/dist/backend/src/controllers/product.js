"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProduct = exports.getProductDetails = void 0;
const db_1 = __importDefault(require("../database/db"));
const registry_1 = require("../providers/registry");
const logger_1 = require("../utils/logger");
const getProductDetails = (req, res) => {
    const { id } = req.params;
    try {
        const product = db_1.default.prepare('SELECT * FROM products WHERE id = ?').get(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const history = db_1.default.prepare(`
      SELECT * FROM history 
      WHERE productId = ? 
      ORDER BY checkedAt DESC
    `).all(id);
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
