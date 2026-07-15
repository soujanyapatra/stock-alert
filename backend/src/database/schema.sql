-- SQL Schema for Stock Availability Tracker (MySQL Compatible)

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    asin VARCHAR(255) UNIQUE NOT NULL,
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    currentprice DOUBLE NOT NULL,
    stockstatus VARCHAR(50) NOT NULL,         -- 'in_stock', 'out_of_stock', 'unknown'
    lastchecked VARCHAR(100) NOT NULL,        -- ISO 8601 string
    INDEX idx_products_asin (asin)
);

-- 2. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(255) PRIMARY KEY,
    productid VARCHAR(255) NOT NULL,
    customname VARCHAR(255),
    enabled INT NOT NULL DEFAULT 1,            -- 0 (disabled) or 1 (enabled)
    createdat VARCHAR(100) NOT NULL,          -- ISO 8601 string
    INDEX idx_alerts_product (productid),
    CONSTRAINT fk_alerts_product FOREIGN KEY (productid) REFERENCES products(id) ON DELETE CASCADE
);

-- 3. History Table
CREATE TABLE IF NOT EXISTS history (
    id VARCHAR(255) PRIMARY KEY,
    productid VARCHAR(255) NOT NULL,
    price DOUBLE NOT NULL,
    stockstatus VARCHAR(50) NOT NULL,         -- 'in_stock', 'out_of_stock', 'unknown'
    checkedat VARCHAR(100) NOT NULL,          -- ISO 8601 string
    INDEX idx_history_product (productid),
    CONSTRAINT fk_history_product FOREIGN KEY (productid) REFERENCES products(id) ON DELETE CASCADE
);
