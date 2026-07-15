"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("./utils/logger");
const db_1 = __importDefault(require("./database/db"));
const scheduler_1 = require("./scheduler");
// Import routes
const alert_1 = __importDefault(require("./routes/alert"));
const product_1 = __importDefault(require("./routes/product"));
const scheduler_2 = __importDefault(require("./routes/scheduler"));
const health_1 = __importDefault(require("./routes/health"));
// Load environment variables
dotenv_1.default.config({ override: true });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
const isProduction = process.env.NODE_ENV === 'production';
app.use((0, cors_1.default)({
    origin: isProduction ? false : '*', // In production, same origin — no CORS needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve built frontend in production
let frontendDist = '';
if (isProduction) {
    // Check typical production Docker layout relative path first, then local build dev layout path
    const pathsToTry = [
        path_1.default.join(__dirname, '../../../../frontend/dist'),
        path_1.default.join(__dirname, '../../../frontend/dist'),
        path_1.default.join(__dirname, '../../frontend/dist')
    ];
    for (const p of pathsToTry) {
        if (fs_1.default.existsSync(p)) {
            frontendDist = p;
            break;
        }
    }
    if (frontendDist) {
        app.use(express_1.default.static(frontendDist));
    }
    else {
        logger_1.logger.warn('Could not locate frontend dist directory for static serving.');
    }
}
// Routes
app.use('/api/alerts', alert_1.default);
app.use('/api/products', product_1.default);
app.use('/api/scheduler', scheduler_2.default);
app.use('/api/health', health_1.default);
// SPA fallback — all non-API routes serve index.html for Vue Router
if (isProduction && frontendDist) {
    app.get(/^(?!\/api).*/, (_req, res) => {
        res.sendFile(path_1.default.join(frontendDist, 'index.html'));
    });
}
// Global Error Handler
app.use((err, req, res, next) => {
    logger_1.logger.error('Unhandled request error:', err.message || err);
    res.status(500).json({ error: 'Internal Server Error' });
});
// Initialize and Start Server
let server;
db_1.default.initDb().then(() => {
    // Initialize Cron Scheduler
    (0, scheduler_1.initScheduler)();
    server = app.listen(PORT, () => {
        logger_1.logger.info(`Stock Alert Backend running on port ${PORT}`);
    });
}).catch((err) => {
    logger_1.logger.error('Failed to initialize database on startup. Exiting...', err.message || err);
    process.exit(1);
});
// Graceful Shutdown
const handleShutdown = () => {
    logger_1.logger.info('Shutting down backend server...');
    const closeDbAndExit = async () => {
        try {
            await db_1.default.pool.end();
            logger_1.logger.info('Database connection pool closed.');
        }
        catch (e) {
            logger_1.logger.error('Error closing database pool:', e.message || e);
        }
        process.exit(0);
    };
    if (server) {
        server.close(async () => {
            logger_1.logger.info('HTTP server closed.');
            await closeDbAndExit();
        });
    }
    else {
        closeDbAndExit();
    }
};
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
