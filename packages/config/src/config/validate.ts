import * as dotenv from 'dotenv';
import { join } from 'path';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  loadedFrom?: string;
}

interface RequiredVar {
  name: string;
  validate?: (value: string) => boolean;
  errorMessage?: string;
}

const REQUIRED_VARS: RequiredVar[] = [
  { 
    name: 'DATABASE_URL',
    validate: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
    errorMessage: 'Must be a valid PostgreSQL connection string'
  },
  { name: 'JWT_SECRET' },
  { name: 'OPENAI_API_KEY' },
  { 
    name: 'PORT',
    validate: (value) => !isNaN(Number(value)) && Number(value) > 0,
    errorMessage: 'Must be a valid port number'
  }
];

const OPTIONAL_VARS = [
  'GROQ_API_KEY',
  'ANTHROPIC_API_KEY',
  'REDIS_URL',
  'ADMIN_API_KEY',
  'LOG_LEVEL',
  'SIMPLE_AUTH'
];

export function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Try to load .env file
  const envPaths = [
    join(process.cwd(), '.env'),
    join(process.cwd(), '..', '..', '.env'), // For when running from apps/api
    '/app/.env' // Docker container path
  ];

  let envLoaded = false;
  for (const envPath of envPaths) {
    try {
      const envResult = dotenv.config({ path: envPath });
      if (!envResult.error) {
        result.loadedFrom = envPath;
        envLoaded = true;
        console.log(`✓ Loaded environment from: ${envPath}`);
        break;
      }
    } catch (error) {
      // Continue to next path
    }
  }

  if (!envLoaded && process.env.NODE_ENV !== 'production') {
    result.warnings.push('No .env file found. Using system environment variables.');
  }

  // Validate required variables
  for (const varConfig of REQUIRED_VARS) {
    const value = process.env[varConfig.name];
    
    if (!value) {
      result.errors.push(`Missing required environment variable: ${varConfig.name}`);
      result.isValid = false;
    } else if (varConfig.validate && !varConfig.validate(value)) {
      result.errors.push(
        `Invalid ${varConfig.name}: ${varConfig.errorMessage || 'Validation failed'}`
      );
      result.isValid = false;
    }
  }

  // Check optional variables
  for (const varName of OPTIONAL_VARS) {
    if (!process.env[varName]) {
      result.warnings.push(`Optional variable ${varName} is not set`);
    }
  }

  // Special validation for NODE_ENV
  if (!process.env.NODE_ENV) {
    result.warnings.push('NODE_ENV is not set. Defaulting to "development"');
    process.env.NODE_ENV = 'development';
  }

  return result;
}

export function printValidationResult(result: ValidationResult): void {
  console.log('\n=== Environment Validation ===');
  
  if (result.loadedFrom) {
    console.log(`✓ Environment loaded from: ${result.loadedFrom}`);
  }

  if (result.errors.length > 0) {
    console.error('\n❌ Errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.isValid) {
    console.log('\n✅ Environment validation passed!');
  } else {
    console.error('\n❌ Environment validation failed!');
  }
  
  console.log('=============================\n');
}

// Auto-validate on import if LOG_LEVEL is debug
if (process.env.LOG_LEVEL === 'debug' || process.env.DEBUG) {
  const result = validateEnvironment();
  printValidationResult(result);
}