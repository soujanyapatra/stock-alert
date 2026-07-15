"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_1 = require("../controllers/product");
const router = (0, express_1.Router)();
router.get('/:id', product_1.getProductDetails);
router.post('/check', product_1.checkProduct);
exports.default = router;
