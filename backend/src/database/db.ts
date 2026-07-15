import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config({ override: true });

logger.info(`Connecting to MySQL database: host=${process.env.DB_HOST}, port=${process.env.DB_PORT}, db=${process.env.DB_NAME}, user=${process.env.DB_USER}`);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'stock_alert',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const query = async (text: string, params?: any[]): Promise<any> => {
  const [rows] = await pool.query(text, params);
  return { rows };
};

export const initDb = async () => {
  const dbName = process.env.DB_NAME || 'stock_alert';

  // Ensure target database exists by connecting to MySQL without selecting a database first
  const adminConnection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    logger.info(`Verifying/creating database "${dbName}"...`);
    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    logger.info(`Database "${dbName}" verified/created successfully.`);
  } catch (err: any) {
    logger.warn(`Could not verify/create database on startup: ${err.message || err}`);
  } finally {
    await adminConnection.end();
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  logger.info(`Reading schema SQL from: ${schemaPath}`);
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schemaSql by ';' and run statements individually for compatibility
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
    }

    logger.info('MySQL schema initialized successfully.');
  } catch (err: any) {
    logger.error(`Failed to initialize database schema: ${err.message || err}`);
    throw err;
  }
};

export default {
  query,
  pool,
  initDb,
};
