"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = exports.query = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
// Load environment variables
dotenv_1.default.config({ override: true });
logger_1.logger.info(`Connecting to MySQL database: host=${process.env.DB_HOST}, port=${process.env.DB_PORT}, db=${process.env.DB_NAME}, user=${process.env.DB_USER}`);
const pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME || 'stock_alert',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
const query = async (text, params) => {
    const [rows] = await pool.query(text, params);
    return { rows };
};
exports.query = query;
const initDb = async () => {
    const maxRetries = 10;
    const retryDelay = 3000; // 3 seconds
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            const dbName = process.env.DB_NAME || 'stock_alert';
            // Ensure target database exists by connecting to MySQL without selecting a database first
            const adminConnection = await promise_1.default.createConnection({
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306', 10),
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || 'password',
            });
            try {
                logger_1.logger.info(`Verifying/creating database "${dbName}"...`);
                await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
                logger_1.logger.info(`Database "${dbName}" verified/created successfully.`);
            }
            catch (err) {
                logger_1.logger.warn(`Could not verify/create database on startup: ${err.message || err}`);
            }
            finally {
                await adminConnection.end();
            }
            const schemaPath = path_1.default.join(__dirname, 'schema.sql');
            logger_1.logger.info(`Reading schema SQL from: ${schemaPath}`);
            const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
            // Split the schemaSql by ';' and run statements individually for compatibility
            const statements = schemaSql
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0);
            for (const statement of statements) {
                await pool.query(statement);
            }
            logger_1.logger.info('MySQL schema initialized successfully.');
            return; // Success, exit the retry loop
        }
        catch (err) {
            attempts++;
            logger_1.logger.warn(`Database connection/init attempt ${attempts}/${maxRetries} failed: ${err.message || err}`);
            if (attempts >= maxRetries) {
                logger_1.logger.error(`Database initialization failed after ${maxRetries} attempts.`);
                throw err;
            }
            logger_1.logger.info(`Waiting ${retryDelay / 1000} seconds before retrying...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
};
exports.initDb = initDb;
exports.default = {
    query: exports.query,
    pool,
    initDb: exports.initDb,
};
