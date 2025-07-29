#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Checks that all requirements are met before deploying to AWS
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.production' });

const chalk = require('chalk');

// ANSI color codes (fallback if chalk not available)
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  success: msg => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: msg => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  header: msg => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}\n`),
};

let errors = 0;
let warnings = 0;

// Check functions
function checkFile(filepath, description) {
  if (fs.existsSync(filepath)) {
    log.success(`${description} exists`);
    return true;
  } else {
    log.error(`${description} is missing: ${filepath}`);
    errors++;
    return false;
  }
}

function checkEnvVar(varName, description, isOptional = false) {
  if (process.env[varName]) {
    log.success(`${description} is set`);
    return true;
  } else {
    if (isOptional) {
      log.warning(`${description} is not set (optional)`);
      warnings++;
    } else {
      log.error(`${description} is missing: ${varName}`);
      errors++;
    }
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'ignore' });
    log.success(`${description} is available`);
    return true;
  } catch (error) {
    log.error(`${description} failed: ${command}`);
    errors++;
    return false;
  }
}

function validateUrl(url, varName) {
  try {
    new URL(url);
    log.success(`${varName} is a valid URL`);
    return true;
  } catch (error) {
    log.error(`${varName} is not a valid URL: ${url}`);
    errors++;
    return false;
  }
}

function checkDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    log.error('DATABASE_URL is not set');
    errors++;
    return;
  }

  try {
    const url = new URL(dbUrl);
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      log.error('DATABASE_URL must use postgresql:// protocol');
      errors++;
      return;
    }

    if (dbUrl.includes('neon.tech') && !dbUrl.includes('sslmode=require')) {
      log.warning('Neon database URL should include ?sslmode=require');
      warnings++;
    }

    log.success('DATABASE_URL format is valid');
  } catch (error) {
    log.error('DATABASE_URL is malformed');
    errors++;
  }
}

// Main validation
async function runChecks() {
  console.log('\n🚀 AI Glossary Pro - Pre-Deployment Validation\n');

  // 1. Check critical files
  log.header('Checking Required Files');
  checkFile('Dockerfile', 'Dockerfile');
  checkFile('package.json', 'package.json');
  checkFile('package-lock.json', 'package-lock.json');
  checkFile('.env.production', 'Production environment file');
  checkFile('dist/index.js', 'Compiled server (run npm run build first)');
  checkFile('dist/public/index.html', 'Compiled frontend');

  // 2. Check Node.js version
  log.header('Checking Node.js Environment');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  if (majorVersion >= 18) {
    log.success(`Node.js version ${nodeVersion} is compatible`);
  } else {
    log.error(`Node.js version ${nodeVersion} is too old (need 18+)`);
    errors++;
  }

  // 3. Check required environment variables
  log.header('Checking Environment Variables');

  // Core
  checkEnvVar('NODE_ENV', 'NODE_ENV (should be "production")');
  checkEnvVar('PORT', 'PORT (should be 3000 for App Runner)');
  checkEnvVar('BASE_URL', 'BASE_URL (your domain)');

  // Security
  checkEnvVar('SESSION_SECRET', 'SESSION_SECRET (64+ characters)');
  checkEnvVar('JWT_SECRET', 'JWT_SECRET (32+ characters)');

  // Database
  checkDatabaseUrl();

  // Redis
  checkEnvVar('REDIS_URL', 'Redis URL', true);

  // AWS
  checkEnvVar('AWS_REGION', 'AWS_REGION');
  checkEnvVar('AWS_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID');
  checkEnvVar('AWS_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY');
  checkEnvVar('S3_BUCKET_NAME', 'S3_BUCKET_NAME');

  // Auth (at least one method required)
  const hasGoogleAuth =
    checkEnvVar('GOOGLE_CLIENT_ID', 'Google OAuth Client ID', true) &&
    checkEnvVar('GOOGLE_CLIENT_SECRET', 'Google OAuth Client Secret', true);
  const hasGithubAuth =
    checkEnvVar('GITHUB_CLIENT_ID', 'GitHub OAuth Client ID', true) &&
    checkEnvVar('GITHUB_CLIENT_SECRET', 'GitHub OAuth Client Secret', true);

  if (!hasGoogleAuth && !hasGithubAuth) {
    log.error('At least one OAuth provider (Google or GitHub) must be configured');
    errors++;
  }

  // Third-party services
  checkEnvVar('OPENAI_API_KEY', 'OpenAI API Key');
  checkEnvVar('RESEND_API_KEY', 'Resend API Key');
  checkEnvVar('GUMROAD_WEBHOOK_SECRET', 'Gumroad Webhook Secret', true);

  // Analytics
  checkEnvVar('GOOGLE_ANALYTICS_ID', 'Google Analytics ID', true);
  checkEnvVar('POSTHOG_API_KEY', 'PostHog API Key', true);
  checkEnvVar('SENTRY_DSN', 'Sentry DSN', true);

  // CORS
  checkEnvVar('PRODUCTION_URL', 'PRODUCTION_URL (for CORS)');
  if (process.env.PRODUCTION_URL) {
    validateUrl(process.env.PRODUCTION_URL, 'PRODUCTION_URL');
  }

  // 4. Check Docker
  log.header('Checking Docker Setup');
  checkCommand('docker --version', 'Docker');

  // Try building the image
  log.info('Testing Docker build (this may take a minute)...');
  try {
    execSync('docker build -t aiglossarypro:test .', { stdio: 'inherit' });
    log.success('Docker build successful');

    // Clean up test image
    execSync('docker rmi aiglossarypro:test', { stdio: 'ignore' });
  } catch (error) {
    log.error('Docker build failed');
    errors++;
  }

  // 5. Check AWS CLI
  log.header('Checking AWS Tools');
  checkCommand('aws --version', 'AWS CLI');

  // Test AWS credentials
  try {
    const identity = execSync('aws sts get-caller-identity', { encoding: 'utf8' });
    log.success('AWS credentials are valid');
  } catch (error) {
    log.error('AWS credentials are not configured or invalid');
    errors++;
  }

  // 6. Database connectivity test
  log.header('Testing Database Connection');
  if (process.env.DATABASE_URL) {
    // Note: Actual connection test would require loading the app
    log.info('Database connection will be tested during deployment');
  }

  // 7. Check production build
  log.header('Checking Production Build');

  const distFiles = ['dist/index.js', 'dist/public/index.html', 'dist/public/assets'];

  let buildValid = true;
  for (const file of distFiles) {
    if (!fs.existsSync(file)) {
      buildValid = false;
      break;
    }
  }

  if (!buildValid) {
    log.warning('Production build not found. Running build...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      log.success('Production build completed');
    } catch (error) {
      log.error('Production build failed');
      errors++;
    }
  } else {
    log.success('Production build exists');
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📊 Validation Summary:\n`);

  if (errors === 0 && warnings === 0) {
    console.log(`${colors.green}✅ All checks passed! Ready for deployment.${colors.reset}`);
  } else {
    if (errors > 0) {
      console.log(
        `${colors.red}❌ ${errors} error(s) found - must be fixed before deployment${colors.reset}`
      );
    }
    if (warnings > 0) {
      console.log(
        `${colors.yellow}⚠️  ${warnings} warning(s) found - review recommended${colors.reset}`
      );
    }
  }

  // Recommendations
  if (errors === 0) {
    console.log('\n📋 Next Steps:');
    console.log('1. Review any warnings above');
    console.log('2. Run: aws ecr create-repository --repository-name aiglossarypro');
    console.log('3. Follow AWS_QUICK_DEPLOY.md for deployment steps');
    console.log('4. Update OAuth redirect URLs after deployment');
  }

  console.log('\n' + '═'.repeat(50) + '\n');

  // Exit with error code if validation failed
  process.exit(errors > 0 ? 1 : 0);
}

// Run validation
runChecks().catch(error => {
  console.error('Validation script error:', error);
  process.exit(1);
});
