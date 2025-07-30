"use strict";
// Auth package exports
// Firebase authentication is handled in the config package
// This package provides auth-related utilities and middleware
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLogger = void 0;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.extractBearerToken = extractBearerToken;
exports.hasAuthToken = hasAuthToken;
// Simple logger for now
const logger = {
    info: (...args) => console.log('[auth]', ...args),
    warn: (...args) => console.warn('[auth]', ...args),
    error: (...args) => console.error('[auth]', ...args),
};
exports.authLogger = logger;
/**
 * Middleware to check if user is authenticated
 * This is a placeholder - actual authentication is handled by firebaseAuth middleware
 */
function requireAuth(req, res, next) {
    const authReq = req;
    if (!authReq.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
    }
    next();
}
/**
 * Middleware to check if user is admin
 */
function requireAdmin(req, res, next) {
    const authReq = req;
    if (!authReq.user || !authReq.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Admin privileges required',
        });
    }
    next();
}
/**
 * Extract bearer token from request
 */
function extractBearerToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Check cookies as fallback
    return req.cookies?.firebaseToken || req.cookies?.auth_token || null;
}
/**
 * Check if request has valid auth token (without verifying it)
 */
function hasAuthToken(req) {
    return extractBearerToken(req) !== null;
}
//# sourceMappingURL=index.js.map