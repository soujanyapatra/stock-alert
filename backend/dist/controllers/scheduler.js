"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScheduler = void 0;
const scheduler_1 = require("../scheduler");
const logger_1 = require("../utils/logger");
const runScheduler = async (req, res) => {
    try {
        logger_1.logger.info('Manual trigger for scheduler run received.');
        const result = await (0, scheduler_1.runSchedulerCheck)();
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
