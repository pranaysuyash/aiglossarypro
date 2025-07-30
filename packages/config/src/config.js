"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = exports.config = exports.features = void 0;
exports.getRequiredEnvVar = getRequiredEnvVar;
exports.getOptionalEnvVar = getOptionalEnvVar;
exports.getDatabaseConfig = getDatabaseConfig;
exports.getS3Config = getS3Config;
exports.getOpenAIConfig = getOpenAIConfig;
exports.getSessionConfig = getSessionConfig;
exports.getServerConfig = getServerConfig;
exports.logConfigStatus = logConfigStatus;
exports.sanitizeLogData = sanitizeLogData;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Simple logger for config package
const logger = {
    info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
    error: (message, error) => console.error(`[ERROR] ${message}`, error || ''),
    warn: (message, data) => console.warn(`[WARN] ${message}`, data || '')
};
// Environment variable validation
function validateEnvironment() {
    const config = {};
    const errors = [];
    // Required environment variables
    const requiredVars = ['DATABASE_URL', 'SESSION_SECRET', 'NODE_ENV', 'PORT'];
    // Conditionally required variables based on features
    // const conditionallyRequired: Record<string, string[]> = {
    //   s3_enabled: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'],
    //   openai_enabled: ['OPENAI_API_KEY'],
    // };
    // Validate required variables
    for (const varName of requiredVars) {
        const value = process.env[varName];
        if (!value) {
            errors.push(`Missing required environment variable: ${varName}`);
        }
        else {
            config[varName] = value;
        }
    }
    // Validate optional variables with defaults
    config.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
    config.NODE_ENV = process.env.NODE_ENV || 'development';
    config.PORT = process.env.PORT || '8080';
    // Optional variables
    const optionalVars = [
        'PGDATABASE',
        'PGHOST',
        'PGPORT',
        'PGUSER',
        'PGPASSWORD',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'S3_BUCKET_NAME',
        'OPENAI_API_KEY',
        'GOOGLE_DRIVE_API_KEY',
        'JWT_SECRET',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REDIRECT_URI',
        'GITHUB_CLIENT_ID',
        'GITHUB_CLIENT_SECRET',
        'GITHUB_REDIRECT_URI',
    ];
    for (const varName of optionalVars) {
        const value = process.env[varName];
        if (value) {
            config[varName] = value;
        }
    }
    // Check for S3 configuration consistency
    const hasS3Keys = config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY;
    const hasS3Bucket = config.S3_BUCKET_NAME;
    if ((hasS3Keys && !hasS3Bucket) || (!hasS3Keys && hasS3Bucket)) {
        logger.warn('Warning: Incomplete S3 configuration detected. Ensure all S3 variables are set for full functionality.');
    }
    // Check for authentication configuration
    const hasSimpleAuth = config.JWT_SECRET && (config.GOOGLE_CLIENT_ID || config.GITHUB_CLIENT_ID);
    if (config.NODE_ENV === 'production' && !hasSimpleAuth) {
        logger.warn('Warning: No authentication configured. Set up JWT_SECRET with Google/GitHub OAuth.');
    }
    if (errors.length > 0) {
        logger.error('Environment validation failed:');
        errors.forEach(error => logger.error(`  - ${error}`));
        throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }
    return config;
}
// Configuration object with validation
const config = validateEnvironment();
exports.config = config;
// Feature flags based on environment variables
exports.features = {
    s3Enabled: !!(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY && config.S3_BUCKET_NAME),
    openaiEnabled: !!config.OPENAI_API_KEY,
    googleDriveEnabled: !!config.GOOGLE_DRIVE_API_KEY,
    simpleAuthEnabled: !!(config.JWT_SECRET && (config.GOOGLE_CLIENT_ID || config.GITHUB_CLIENT_ID)),
    firebaseAuthEnabled: !!(process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_BASE64)),
    analyticsEnabled: true, // Analytics is always enabled for now
    isDevelopment: config.NODE_ENV === 'development',
    isProduction: config.NODE_ENV === 'production',
};
// Helper functions for configuration
function getRequiredEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
}
function getOptionalEnvVar(name, defaultValue = '') {
    return process.env[name] || defaultValue;
}
// Database configuration helper
function getDatabaseConfig() {
    return {
        connectionString: config.DATABASE_URL,
        ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    };
}
// S3 configuration helper
function getS3Config() {
    if (!exports.features.s3Enabled) {
        throw new Error('S3 is not properly configured. Check AWS credentials and bucket name.');
    }
    return {
        region: config.AWS_REGION,
        credentials: {
            accessKeyId: config.AWS_ACCESS_KEY_ID,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },
        bucketName: config.S3_BUCKET_NAME,
    };
}
// OpenAI configuration helper
function getOpenAIConfig() {
    if (!exports.features.openaiEnabled) {
        throw new Error('OpenAI is not configured. Check OPENAI_API_KEY.');
    }
    return {
        apiKey: config.OPENAI_API_KEY,
    };
}
// Session configuration helper
function getSessionConfig() {
    return {
        secret: config.SESSION_SECRET,
        databaseUrl: config.DATABASE_URL,
    };
}
// Server configuration helper
function getServerConfig() {
    return {
        port: parseInt(config.PORT, 10),
        host: process.env.NODE_ENV === 'development' ? '127.0.0.1' : '0.0.0.0',
        nodeEnv: config.NODE_ENV,
    };
}
// Security utility to redact sensitive information from logs
function redactSensitiveInfo(value) {
    if (!value) {
        return 'Not set';
    }
    if (value.length <= 8) {
        return '***';
    }
    return `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
}
// Log configuration status (without sensitive data)
function logConfigStatus() {
    logger.info('🔧 Environment Configuration Status:');
    logger.info(`  - Node Environment: ${config.NODE_ENV}`);
    logger.info(`  - Server Port: ${config.PORT}`);
    logger.info(`  - Database: ${config.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
    logger.info(`  - Session Secret: ${config.SESSION_SECRET ? '✅ Configured' : '❌ Missing'}`);
    if (exports.features.s3Enabled) {
        logger.info(`  - S3 Integration: ✅ Enabled`);
        logger.info(`    - Region: ${config.AWS_REGION}`);
        logger.info(`    - Bucket: ${config.S3_BUCKET_NAME}`);
        logger.info(`    - Access Key: ${redactSensitiveInfo(config.AWS_ACCESS_KEY_ID || '')}`);
    }
    else {
        logger.info(`  - S3 Integration: ⚠️  Disabled`);
    }
    logger.info(`  - OpenAI Integration: ${exports.features.openaiEnabled ? '✅ Enabled' : '⚠️  Disabled'}`);
    if (exports.features.openaiEnabled) {
        logger.info(`    - API Key: ${redactSensitiveInfo(config.OPENAI_API_KEY || '')}`);
    }
    logger.info(`  - Google Drive Integration: ${exports.features.googleDriveEnabled ? '✅ Enabled' : '⚠️  Disabled'}`);
    logger.info('');
}
// Security helper to check if any sensitive data might be logged
function sanitizeLogData(data) {
    if (typeof data !== 'object' || data === null) {
        return data;
    }
    const sensitiveKeys = [
        'password',
        'secret',
        'token',
        'key',
        'auth',
        'credential',
        'AWS_SECRET_ACCESS_KEY',
        'OPENAI_API_KEY',
        'SESSION_SECRET',
        'GOOGLE_DRIVE_API_KEY',
    ];
    const sanitized = { ...data };
    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
            sanitized[key] = redactSensitiveInfo(String(sanitized[key] || ''));
        }
        else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitizeLogData(sanitized[key]);
        }
    }
    return sanitized;
}
exports.appConfig = {
    // Server Configuration
    port: process.env.PORT || '8080',
    nodeEnv: process.env.NODE_ENV || 'development',
    // Database Configuration
    database: {
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production',
    },
    // Session Configuration
    session: {
        secret: process.env.SESSION_SECRET || 'your-session-secret-here',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    // S3 Configuration
    s3: {
        enabled: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        region: process.env.AWS_REGION || 'ap-south-1',
        bucket: process.env.S3_BUCKET_NAME || 'aimlglossary',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    // OpenAI Configuration
    openai: {
        enabled: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY,
    },
    // Google Drive Configuration
    googleDrive: {
        enabled: !!(process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET),
        clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI,
    },
    // Feature Flags
    features: {
        authRoutes: true,
        categoriesRoutes: true,
        termsRoutes: true,
        searchRoutes: true,
        userRoutes: true,
        adminRoutes: true,
        analyticsRoutes: true,
        excelAutoLoad: false, // Disabled due to memory issues
        apiDocumentation: true,
    },
    // Performance Configuration
    performance: {
        // Request caching (in milliseconds)
        cache: {
            categories: 5 * 60 * 1000, // 5 minutes
            featuredTerms: 10 * 60 * 1000, // 10 minutes
            terms: 2 * 60 * 1000, // 2 minutes
            search: 1 * 60 * 1000, // 1 minute
            analytics: 15 * 60 * 1000, // 15 minutes
        },
        // Request deduplication
        deduplication: {
            enabled: true,
            windowMs: 5000, // 5 seconds
        },
        // Database connection pooling
        database: {
            maxConnections: 20,
            idleTimeoutMs: 30000,
            connectionTimeoutMs: 10000,
        },
    },
    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableRequestLogging: process.env.NODE_ENV === 'development',
    },
};
