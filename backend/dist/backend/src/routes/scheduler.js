"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scheduler_1 = require("../controllers/scheduler");
const router = (0, express_1.Router)();
router.post('/run', scheduler_1.runScheduler);
exports.default = router;
