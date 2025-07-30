"use strict";
/**
 * Sentry Configuration for Production Error Tracking
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sentry = exports.sentryErrorHandler = exports.sentryTracingHandler = exports.sentryRequestHandler = void 0;
exports.initializeSentry = initializeSentry;
exports.captureException = captureException;
exports.captureMessage = captureMessage;
exports.startTransaction = startTransaction;
exports.addBreadcrumb = addBreadcrumb;
exports.setUser = setUser;
exports.setTag = setTag;
exports.isSentryEnabled = isSentryEnabled;
exports.flushSentry = flushSentry;
const Sentry = __importStar(require("@sentry/node"));
exports.Sentry = Sentry;
const profiling_node_1 = require("@sentry/profiling-node");
const node_1 = require("@sentry/node");
const logger_1 = require("../utils/logger");
/**
 * Initialize Sentry error tracking
 */
function initializeSentry() {
    const config = {
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        release: process.env.SENTRY_RELEASE || process.env.npm_package_version || '1.0.0',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        enabled: !!(process.env.SENTRY_DSN && process.env.NODE_ENV === 'production'),
    };
    if (!config.dsn) {
        logger_1.log.info('Sentry DSN not configured - error tracking disabled');
        return;
    }
    if (!config.enabled) {
        logger_1.log.info('Sentry disabled in development mode');
        return;
    }
    try {
        Sentry.init({
            dsn: config.dsn,
            environment: config.environment,
            release: config.release,
            // Performance monitoring
            tracesSampleRate: config.tracesSampleRate,
            profilesSampleRate: config.profilesSampleRate,
            // Integrations
            integrations: [
                // Node.js performance profiling
                (0, profiling_node_1.nodeProfilingIntegration)(),
                // HTTP integration for Express
                (0, node_1.httpIntegration)(),
                // Express integration
                (0, node_1.expressIntegration)(),
                // Console integration
                (0, node_1.consoleIntegration)(),
                // Local variables in stack traces
                (0, node_1.localVariablesIntegration)({
                    captureAllExceptions: false,
                }),
            ],
            // Error filtering
            beforeSend(event, hint) {
                // Filter out development/test errors
                if (config.environment !== 'production') {
                    return null;
                }
                // Filter out known non-critical errors
                const error = hint.originalException;
                if (error instanceof Error) {
                    // Skip CORS errors
                    if (error.message.includes('CORS')) {
                        return null;
                    }
                    // Skip client disconnect errors
                    if (error.message.includes('ECONNRESET') ||
                        error.message.includes('EPIPE') ||
                        error.message.includes('Client disconnected')) {
                        return null;
                    }
                    // Skip rate limit errors (they're expected)
                    if (error.message.includes('Too many requests')) {
                        return null;
                    }
                }
                return event;
            },
            // Transaction filtering
            beforeSendTransaction(event) {
                // Only send in production
                if (config.environment !== 'production') {
                    return null;
                }
                // Filter out health check transactions
                if (event.transaction?.includes('/health') || event.transaction?.includes('/monitoring')) {
                    return null;
                }
                return event;
            },
            // Set user context
            initialScope: {
                tags: {
                    component: 'server',
                    service: 'ai-glossary-pro',
                },
            },
        });
        logger_1.log.info('Sentry error tracking initialized', {
            environment: config.environment,
            release: config.release,
            tracesSampleRate: config.tracesSampleRate,
        });
    }
    catch (error) {
        logger_1.log.error('Failed to initialize Sentry:', error);
    }
}
/**
 * Express middleware for Sentry request tracking
 */
// Request handler is no longer needed in newer Sentry versions
const sentryRequestHandler = (_req, _res, next) => next();
exports.sentryRequestHandler = sentryRequestHandler;
/**
 * Express middleware for Sentry tracing
 */
// Tracing handler is no longer needed in newer Sentry versions  
const sentryTracingHandler = (_req, _res, next) => next();
exports.sentryTracingHandler = sentryTracingHandler;
/**
 * Express error handler for Sentry
 */
// Use express error handler instead
exports.sentryErrorHandler = Sentry.expressErrorHandler({
    shouldHandleError(_error) {
        // Only handle errors in production
        return process.env.NODE_ENV === 'production';
    },
});
/**
 * Manually capture exception with context
 */
function captureException(error, context) {
    if (process.env.NODE_ENV !== 'production') {
        logger_1.log.error('Exception (Sentry disabled):', { error: error, ...context });
        return undefined;
    }
    return Sentry.withScope(scope => {
        if (context?.user) {
            scope.setUser(context.user);
        }
        if (context?.tags) {
            Object.entries(context.tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });
        }
        if (context?.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }
        if (context?.level) {
            scope.setLevel(context.level);
        }
        return Sentry.captureException(error);
    });
}
/**
 * Capture custom message with context
 */
function captureMessage(message, level = 'info', context) {
    if (process.env.NODE_ENV !== 'production') {
        logger_1.log.info('Message (Sentry disabled):', { message, level, ...context });
        return undefined;
    }
    return Sentry.withScope(scope => {
        if (context?.user) {
            scope.setUser(context.user);
        }
        if (context?.tags) {
            Object.entries(context.tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });
        }
        if (context?.extra) {
            Object.entries(context.extra).forEach(([key, value]) => {
                scope.setExtra(key, value);
            });
        }
        scope.setLevel(level);
        return Sentry.captureMessage(message);
    });
}
/**
 * Start a transaction for performance monitoring
 */
function startTransaction(name, op, description) {
    if (process.env.NODE_ENV !== 'production') {
        return undefined;
    }
    return (0, node_1.startSpan)({
        name,
        op,
        attributes: {
            description: description || '',
        },
    }, () => { });
}
/**
 * Add breadcrumb for debugging
 */
function addBreadcrumb(message, category = 'default', level = 'info', data) {
    if (process.env.NODE_ENV !== 'production') {
        logger_1.log.debug('Breadcrumb (Sentry disabled):', { message, category, level, data });
        return;
    }
    Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000,
    });
}
/**
 * Set user context for current scope
 */
function setUser(user) {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }
    Sentry.setUser(user);
}
/**
 * Set tag for current scope
 */
function setTag(key, value) {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }
    Sentry.setTag(key, value);
}
/**
 * Check if Sentry is configured and enabled
 */
function isSentryEnabled() {
    return !!(process.env.SENTRY_DSN && process.env.NODE_ENV === 'production');
}
/**
 * Flush Sentry data (useful for serverless or before shutdown)
 */
async function flushSentry(timeout = 2000) {
    if (!isSentryEnabled()) {
        return true;
    }
    try {
        return await Sentry.flush(timeout);
    }
    catch (error) {
        logger_1.log.error('Error flushing Sentry:', error);
        return false;
    }
}
//# sourceMappingURL=sentry.js.map