"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const dbDir = path_1.default.join(__dirname, '../../data');
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path_1.default.join(dbDir, 'database.sqlite');
logger_1.logger.info(`Initializing database at ${dbPath}`);
const db = new better_sqlite3_1.default(dbPath);
// Enable foreign keys
db.pragma('foreign_keys = ON');
// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asin TEXT UNIQUE NOT NULL,
    url TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    currentPrice REAL NOT NULL,
    stockStatus TEXT NOT NULL,
    lastChecked TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    customName TEXT,
    enabled INTEGER NOT NULL DEFAULT 1, -- 0 or 1
    createdAt TEXT NOT NULL,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    price REAL NOT NULL,
    stockStatus TEXT NOT NULL,
    checkedAt TEXT NOT NULL,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
  CREATE INDEX IF NOT EXISTS idx_alerts_product ON alerts(productId);
  CREATE INDEX IF NOT EXISTS idx_history_product ON history(productId);
`);
logger_1.logger.info('Database schema verified.');
exports.default = db;
