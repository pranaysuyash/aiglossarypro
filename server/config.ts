import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation interface
interface EnvironmentConfig {
  // Database Configuration
  DATABASE_URL: string;
  PGDATABASE?: string;
  PGHOST?: string;
  PGPORT?: string;
  PGUSER?: string;
  PGPASSWORD?: string;

  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION: string;
  S3_BUCKET_NAME?: string;

  // OpenAI Configuration
  OPENAI_API_KEY?: string;

  // Session Configuration
  SESSION_SECRET: string;

  // Google Drive Configuration (optional)
  GOOGLE_DRIVE_API_KEY?: string;

  // Replit Authentication Configuration
  REPLIT_CLIENT_ID?: string;
  REPLIT_CLIENT_SECRET?: string;
  REPLIT_DOMAINS?: string;
  REPL_ID?: string;
  ISSUER_URL?: string;

  // Application Configuration
  NODE_ENV: string;
  PORT: string;
}

// Environment variable validation
function validateEnvironment(): EnvironmentConfig {
  const config: Partial<EnvironmentConfig> = {};
  const errors: string[] = [];

  // Required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'NODE_ENV',
    'PORT'
  ];

  // Conditionally required variables based on features
  const conditionallyRequired: Record<string, string[]> = {
    's3_enabled': ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'],
    'openai_enabled': ['OPENAI_API_KEY'],
    'replit_auth_enabled': ['REPLIT_DOMAINS', 'REPL_ID']
  };

  // Validate required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
    } else {
      (config as any)[varName] = value;
    }
  }

  // Validate optional variables with defaults
  config.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  config.NODE_ENV = process.env.NODE_ENV || 'development';
  config.PORT = process.env.PORT || '3000';

  // Optional variables
  const optionalVars = [
    'PGDATABASE', 'PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD',
    'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME',
    'OPENAI_API_KEY', 'GOOGLE_DRIVE_API_KEY',
    'REPLIT_CLIENT_ID', 'REPLIT_CLIENT_SECRET', 'REPLIT_DOMAINS', 'REPL_ID', 'ISSUER_URL'
  ];

  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      (config as any)[varName] = value;
    }
  }

  // Check for S3 configuration consistency
  const hasS3Keys = config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY;
  const hasS3Bucket = config.S3_BUCKET_NAME;
  
  if ((hasS3Keys && !hasS3Bucket) || (!hasS3Keys && hasS3Bucket)) {
    console.warn('Warning: Incomplete S3 configuration detected. Ensure all S3 variables are set for full functionality.');
  }

  // Check for Replit auth configuration
  if (config.NODE_ENV === 'production' && !config.REPLIT_DOMAINS) {
    console.warn('Warning: REPLIT_DOMAINS not configured. Authentication may not work properly in production.');
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }

  return config as EnvironmentConfig;
}

// Configuration object with validation
const config = validateEnvironment();

// Feature flags based on environment variables
export const features = {
  s3Enabled: !!(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY && config.S3_BUCKET_NAME),
  openaiEnabled: !!config.OPENAI_API_KEY,
  googleDriveEnabled: !!config.GOOGLE_DRIVE_API_KEY,
  replitAuthEnabled: !!(config.REPLIT_DOMAINS && config.REPL_ID),
  analyticsEnabled: true, // Analytics is always enabled for now
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production'
};

// Export configuration
export { config };

// Helper functions for configuration
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

export function getOptionalEnvVar(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue;
}

// Database configuration helper
export function getDatabaseConfig() {
  return {
    connectionString: config.DATABASE_URL,
    ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
  };
}

// S3 configuration helper
export function getS3Config() {
  if (!features.s3Enabled) {
    throw new Error('S3 is not properly configured. Check AWS credentials and bucket name.');
  }
  
  return {
    region: config.AWS_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID!,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY!
    },
    bucketName: config.S3_BUCKET_NAME!
  };
}

// OpenAI configuration helper
export function getOpenAIConfig() {
  if (!features.openaiEnabled) {
    throw new Error('OpenAI is not configured. Check OPENAI_API_KEY.');
  }
  
  return {
    apiKey: config.OPENAI_API_KEY!
  };
}

// Session configuration helper
export function getSessionConfig() {
  return {
    secret: config.SESSION_SECRET,
    databaseUrl: config.DATABASE_URL
  };
}

// Server configuration helper
export function getServerConfig() {
  return {
    port: parseInt(config.PORT, 10),
    host: process.env.NODE_ENV === 'development' ? '127.0.0.1' : '0.0.0.0',
    nodeEnv: config.NODE_ENV
  };
}

// Authentication configuration helper
export function getAuthConfig() {
  return {
    replitDomains: config.REPLIT_DOMAINS?.split(',') || [],
    replId: config.REPL_ID,
    issuerUrl: config.ISSUER_URL || 'https://replit.com/oidc'
  };
}

// Security utility to redact sensitive information from logs
function redactSensitiveInfo(value: string): string {
  if (!value) return 'Not set';
  if (value.length <= 8) return '***';
  return `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
}

// Log configuration status (without sensitive data)
export function logConfigStatus() {
  console.log('🔧 Environment Configuration Status:');
  console.log(`  - Node Environment: ${config.NODE_ENV}`);
  console.log(`  - Server Port: ${config.PORT}`);
  console.log(`  - Database: ${config.DATABASE_URL ? '✅ Configured' : '❌ Missing'}`);
  console.log(`  - Session Secret: ${config.SESSION_SECRET ? '✅ Configured' : '❌ Missing'}`);
  
  if (features.s3Enabled) {
    console.log(`  - S3 Integration: ✅ Enabled`);
    console.log(`    - Region: ${config.AWS_REGION}`);
    console.log(`    - Bucket: ${config.S3_BUCKET_NAME}`);
    console.log(`    - Access Key: ${redactSensitiveInfo(config.AWS_ACCESS_KEY_ID || '')}`);
  } else {
    console.log(`  - S3 Integration: ⚠️  Disabled`);
  }
  
  console.log(`  - OpenAI Integration: ${features.openaiEnabled ? '✅ Enabled' : '⚠️  Disabled'}`);
  if (features.openaiEnabled) {
    console.log(`    - API Key: ${redactSensitiveInfo(config.OPENAI_API_KEY || '')}`);
  }
  
  console.log(`  - Google Drive Integration: ${features.googleDriveEnabled ? '✅ Enabled' : '⚠️  Disabled'}`);
  console.log(`  - Replit Auth: ${features.replitAuthEnabled ? '✅ Enabled' : '⚠️  Disabled'}`);
  
  if (features.replitAuthEnabled) {
    console.log(`    - Domains: ${config.REPLIT_DOMAINS}`);
    console.log(`    - Repl ID: ${config.REPL_ID ? redactSensitiveInfo(config.REPL_ID) : 'Not set'}`);
  }
  
  console.log('');
}

// Security helper to check if any sensitive data might be logged
export function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  
  const sensitiveKeys = [
    'password', 'secret', 'token', 'key', 'auth', 'credential',
    'AWS_SECRET_ACCESS_KEY', 'OPENAI_API_KEY', 'SESSION_SECRET',
    'REPLIT_CLIENT_SECRET', 'GOOGLE_DRIVE_API_KEY'
  ];
  
  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = redactSensitiveInfo(String(sanitized[key] || ''));
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  
  return sanitized;
}