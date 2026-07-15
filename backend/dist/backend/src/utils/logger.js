"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (message, ...args) => {
        console.log(`[${new Date().toISOString()}] [INFO] ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, ...args);
    },
    error: (message, ...args) => {
        console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, ...args);
    },
    debug: (message, ...args) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${new Date().toISOString()}] [DEBUG] ${message}`, ...args);
        }
    }
};
