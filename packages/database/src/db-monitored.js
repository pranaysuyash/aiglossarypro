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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoredPool = exports.db = exports.pool = void 0;
exports.checkDatabaseHealth = checkDatabaseHealth;
exports.getPoolMetrics = getPoolMetrics;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const serverless_1 = require("@neondatabase/serverless");
const neon_serverless_1 = require("drizzle-orm/neon-serverless");
const ws_1 = __importDefault(require("ws"));
const schema = __importStar(require("@aiglossarypro/shared/enhancedSchema"));
const pool_monitor_1 = require("./db/pool-monitor");
// Simple logger for now
const logger = {
    info: (...args) => console.log('[database]', ...args),
    warn: (...args) => console.warn('[database]', ...args),
    error: (...args) => console.error('[database]', ...args),
};
serverless_1.neonConfig.webSocketConstructor = ws_1.default;
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}
// Create monitored pool with configuration
exports.pool = (0, pool_monitor_1.createMonitoredPool)({
    connectionString: process.env.DATABASE_URL,
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
});
// Create drizzle instance
exports.db = (0, neon_serverless_1.drizzle)({ client: exports.pool, schema });
// Health check function
async function checkDatabaseHealth() {
    try {
        // Test query
        await exports.db.execute((0, drizzle_orm_1.sql) `SELECT 1`);
        const stats = exports.pool.getStats();
        const recommendations = [];
        // Generate recommendations based on stats
        if (stats.avgAcquireTime > 500) {
            recommendations.push('Consider increasing pool size due to high acquire times');
        }
        if (stats.waitingRequests > 5) {
            recommendations.push('High number of waiting requests - scale up pool or optimize queries');
        }
        const recommendedSize = exports.pool.getRecommendedPoolSize();
        const currentMax = parseInt(process.env.DB_POOL_MAX || '20');
        if (recommendedSize.max > currentMax) {
            recommendations.push(`Consider increasing DB_POOL_MAX from ${currentMax} to ${recommendedSize.max}`);
        }
        return {
            status: stats.healthStatus,
            stats,
            recommendations: recommendations.length > 0 ? recommendations : undefined
        };
    }
    catch (error) {
        logger.error('Database health check failed', error);
        return {
            status: 'critical',
            stats: exports.pool.getStats(),
            recommendations: ['Database connection failed - check connection string and network']
        };
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing database pool...');
    await exports.pool.end();
});
process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing database pool...');
    await exports.pool.end();
});
// Export monitoring utilities
var pool_monitor_2 = require("./db/pool-monitor");
Object.defineProperty(exports, "MonitoredPool", { enumerable: true, get: function () { return pool_monitor_2.MonitoredPool; } });
// Helper to get connection pool metrics endpoint data
function getPoolMetrics() {
    return exports.pool.getStats();
}
// Import sql from drizzle
const drizzle_orm_1 = require("drizzle-orm");
