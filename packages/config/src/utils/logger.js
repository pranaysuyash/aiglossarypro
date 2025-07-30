"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
// Simple logger for config package
exports.log = {
    info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
    error: (message, error) => console.error(`[ERROR] ${message}`, error || ''),
    warn: (message, data) => console.warn(`[WARN] ${message}`, data || ''),
    debug: (message, data) => console.log(`[DEBUG] ${message}`, data || '')
};
exports.default = exports.log;
