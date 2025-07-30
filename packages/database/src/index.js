"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoolMetrics = exports.checkDatabaseHealth = exports.monitoredPool = exports.monitoredDb = exports.pool = exports.db = void 0;
// Database package exports
// Export default db connection
var db_js_1 = require("./db.js");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return db_js_1.db; } });
Object.defineProperty(exports, "pool", { enumerable: true, get: function () { return db_js_1.pool; } });
// Export monitored db and functions
var db_monitored_js_1 = require("./db-monitored.js");
Object.defineProperty(exports, "monitoredDb", { enumerable: true, get: function () { return db_monitored_js_1.db; } });
Object.defineProperty(exports, "monitoredPool", { enumerable: true, get: function () { return db_monitored_js_1.pool; } });
Object.defineProperty(exports, "checkDatabaseHealth", { enumerable: true, get: function () { return db_monitored_js_1.checkDatabaseHealth; } });
Object.defineProperty(exports, "getPoolMetrics", { enumerable: true, get: function () { return db_monitored_js_1.getPoolMetrics; } });
// Export db directory modules
__exportStar(require("./db/pool-monitor.js"), exports);
__exportStar(require("./db/support-schema.js"), exports);
//# sourceMappingURL=index.js.map