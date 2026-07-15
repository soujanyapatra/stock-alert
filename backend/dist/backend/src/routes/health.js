"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../database/db"));
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    try {
        await db_1.default.query('SELECT 1');
        res.json({ status: 'UP', db: 'connected', timestamp: new Date().toISOString(), uptime: process.uptime() });
    }
    catch {
        res.status(503).json({ status: 'DOWN', db: 'disconnected', timestamp: new Date().toISOString() });
    }
});
exports.default = router;
