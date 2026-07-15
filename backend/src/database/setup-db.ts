import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config({ override: true });

const schemaPath = path.join(__dirname, './schema.sql');

async function runSetup() {
  const shouldReset = process.argv.includes('--reset');
  const dbName = process.env.DB_NAME || 'stock_alert';

  logger.info(`Connecting to MySQL database for migrations: host=${process.env.DB_HOST}, db=${dbName}`);
  
  // 1. Ensure target database exists
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
    logger.warn(`Could not verify/create database via admin connection: ${err.message || err}.`);
  } finally {
    await adminConnection.end();
  }

  // 2. Connect to the target database and execute migrations
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: dbName,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    if (shouldReset) {
      logger.info('Reset flag detected. Dropping existing tables...');
      // Disable foreign key checks to safely drop tables in order
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('DROP TABLE IF EXISTS history');
      await connection.query('DROP TABLE IF EXISTS alerts');
      await connection.query('DROP TABLE IF EXISTS products');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      logger.info('Existing tables dropped.');
    }

    logger.info(`Applying schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schemaSql by ';' and run statements individually
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      await connection.query(statement);
    }
    
    logger.info('Schema migration executed successfully.');

  } catch (err: any) {
    logger.error(`Database setup failed: ${err.message || err}`);
    process.exit(1);
  } finally {
    await connection.end();
    logger.info('Database migration runner completed and connection closed.');
  }
}

runSetup();
