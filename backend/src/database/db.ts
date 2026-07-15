import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');
logger.info(`Initializing database at ${dbPath}`);

const db = new Database(dbPath);

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

logger.info('Database schema verified.');

export default db;
