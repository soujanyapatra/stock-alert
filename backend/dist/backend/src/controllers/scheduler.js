"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScheduler = void 0;
const scheduler_1 = require("../scheduler");
const logger_1 = require("../utils/logger");
const runScheduler = async (req, res) => {
    const { productId } = req.body;
    try {
        logger_1.logger.info(productId ? `Manual trigger for product ID ${productId} check received.` : 'Manual trigger for scheduler run received.');
        const parsedProductId = productId ? parseInt(productId, 10) : undefined;
        const result = await (0, scheduler_1.runSchedulerCheck)(isNaN(parsedProductId) ? undefined : parsedProductId);
        res.json({
            message: 'Scheduler job run completed.',
            ...result
        });
    }
    catch (error) {
        logger_1.logger.error('Error triggering scheduler manually:', error.message || error);
        res.status(500).json({ error: 'Failed to run scheduler check.' });
    }
};
exports.runScheduler = runScheduler;
