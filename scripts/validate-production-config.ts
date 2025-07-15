#!/usr/bin/env node

/**
 * Production Configuration Validator
 * Validates all production configuration settings before deployment
 */

import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import axios from 'axios';
import chalk from 'chalk';

// Load production environment
dotenv.config({ path: '.env.production' });

interface ValidationResult {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: ValidationResult[] = [];

function addResult(category: string, item: string, status: 'pass' | 'fail' | 'warning', message: string) {
  results.push({ category, item, status, message });
}

// Check if environment variable exists and is not empty
function checkEnvVar(name: string, category: string, required = true): boolean {
  const value = process.env[name];
  const exists = value && value.trim() !== '';
  
  if (!exists && required) {
    addResult(category, name, 'fail', 'Missing required environment variable');
    return false;
  } else if (!exists && !required) {
    addResult(category, name, 'warning', 'Optional environment variable not set');
    return false;
  }
  
  addResult(category, name, 'pass', 'Environment variable is set');
  return true;
}

// Validate URL format
function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Test HTTP endpoint
async function testEndpoint(url: string, expectedStatus = 200): Promise<boolean> {
  try {
    const response = await axios.get(url, { 
      timeout: 5000,
      validateStatus: () => true 
    });
    return response.status === expectedStatus;
  } catch {
    return false;
  }
}

// Test email configuration
async function testEmailConfig(): Promise<void> {
  console.log(chalk.blue('\n📧 Testing Email Configuration...'));
  
  const hasResendKey = checkEnvVar('RESEND_API_KEY', 'Email');
  const hasEmailFrom = checkEnvVar('EMAIL_FROM', 'Email');
  const hasEmailFromName = checkEnvVar('EMAIL_FROM_NAME', 'Email');
  const emailEnabled = process.env.EMAIL_ENABLED === 'true';
  
  if (!emailEnabled) {
    addResult('Email', 'EMAIL_ENABLED', 'warning', 'Email service is disabled');
  } else if (hasResendKey && hasEmailFrom) {
    // Test Resend API
    try {
      const response = await axios.get('https://api.resend.com/domains', {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        timeout: 5000,
      });
      
      if (response.status === 200) {
        addResult('Email', 'Resend API', 'pass', 'Resend API key is valid');
      } else {
        addResult('Email', 'Resend API', 'fail', 'Resend API key might be invalid');
      }
    } catch (error) {
      addResult('Email', 'Resend API', 'fail', `Failed to connect to Resend: ${error.message}`);
    }
  }
  
  // Check SMTP fallback
  const hasSmtpHost = checkEnvVar('SMTP_HOST', 'Email', false);
  if (hasSmtpHost) {
    checkEnvVar('SMTP_PORT', 'Email', false);
    checkEnvVar('SMTP_USER', 'Email', false);
    checkEnvVar('SMTP_PASS', 'Email', false);
  }
}

// Test GA4 configuration
async function testAnalyticsConfig(): Promise<void> {
  console.log(chalk.blue('\n📊 Testing Analytics Configuration...'));
  
  const hasMeasurementId = checkEnvVar('VITE_GA_MEASUREMENT_ID', 'Analytics');
  const hasApiSecret = checkEnvVar('GA_API_SECRET', 'Analytics', false);
  
  if (hasMeasurementId) {
    const measurementId = process.env.VITE_GA_MEASUREMENT_ID;
    if (!measurementId?.startsWith('G-')) {
      addResult('Analytics', 'GA4 Measurement ID', 'fail', 'Invalid format (should start with G-)');
    }
  }
  
  // Check optional analytics
  checkEnvVar('VITE_POSTHOG_KEY', 'Analytics', false);
  checkEnvVar('VITE_POSTHOG_HOST', 'Analytics', false);
}

// Test Gumroad configuration
async function testGumroadConfig(): Promise<void> {
  console.log(chalk.blue('\n💰 Testing Gumroad Configuration...'));
  
  const hasAccessToken = checkEnvVar('GUMROAD_ACCESS_TOKEN', 'Gumroad');
  const hasWebhookSecret = checkEnvVar('GUMROAD_WEBHOOK_SECRET', 'Gumroad');
  const hasProductUrl = checkEnvVar('VITE_GUMROAD_PRODUCT_URL', 'Gumroad');
  
  if (hasAccessToken) {
    // Test Gumroad API
    try {
      const response = await axios.get('https://api.gumroad.com/v2/user', {
        headers: {
          Authorization: `Bearer ${process.env.GUMROAD_ACCESS_TOKEN}`,
        },
        timeout: 5000,
      });
      
      if (response.data.success) {
        addResult('Gumroad', 'Access Token', 'pass', 'Gumroad access token is valid');
      } else {
        addResult('Gumroad', 'Access Token', 'fail', 'Gumroad access token might be invalid');
      }
    } catch (error) {
      addResult('Gumroad', 'Access Token', 'fail', `Failed to connect to Gumroad: ${error.message}`);
    }
  }
  
  if (hasProductUrl) {
    const url = process.env.VITE_GUMROAD_PRODUCT_URL;
    if (!url?.includes('gumroad.com')) {
      addResult('Gumroad', 'Product URL', 'warning', 'URL does not appear to be a Gumroad URL');
    }
  }
}

// Test Firebase configuration
async function testFirebaseConfig(): Promise<void> {
  console.log(chalk.blue('\n🔥 Testing Firebase Configuration...'));
  
  // Frontend config
  checkEnvVar('VITE_FIREBASE_API_KEY', 'Firebase');
  checkEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'Firebase');
  checkEnvVar('VITE_FIREBASE_PROJECT_ID', 'Firebase');
  checkEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'Firebase');
  checkEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', 'Firebase');
  checkEnvVar('VITE_FIREBASE_APP_ID', 'Firebase');
  
  // Backend config
  const hasProjectId = checkEnvVar('FIREBASE_PROJECT_ID', 'Firebase');
  const hasClientEmail = checkEnvVar('FIREBASE_CLIENT_EMAIL', 'Firebase');
  const hasPrivateKey = checkEnvVar('FIREBASE_PRIVATE_KEY_BASE64', 'Firebase');
  
  if (hasProjectId && hasClientEmail && hasPrivateKey) {
    try {
      // Decode and validate private key format
      const privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64!, 'base64').toString();
      if (privateKey.includes('BEGIN PRIVATE KEY')) {
        addResult('Firebase', 'Private Key', 'pass', 'Private key format is valid');
      } else {
        addResult('Firebase', 'Private Key', 'fail', 'Private key format is invalid');
      }
    } catch (error) {
      addResult('Firebase', 'Private Key', 'fail', 'Failed to decode base64 private key');
    }
  }
}

// Test database configuration
async function testDatabaseConfig(): Promise<void> {
  console.log(chalk.blue('\n🗄️  Testing Database Configuration...'));
  
  const hasDatabaseUrl = checkEnvVar('DATABASE_URL', 'Database');
  
  if (hasDatabaseUrl) {
    const dbUrl = process.env.DATABASE_URL!;
    try {
      const url = new URL(dbUrl);
      if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
        addResult('Database', 'Connection String', 'pass', 'Valid PostgreSQL connection string');
        
        // Check for SSL
        if (!dbUrl.includes('sslmode=')) {
          addResult('Database', 'SSL Mode', 'warning', 'SSL mode not specified (recommended for production)');
        }
      } else {
        addResult('Database', 'Connection String', 'fail', 'Invalid database protocol');
      }
    } catch {
      addResult('Database', 'Connection String', 'fail', 'Invalid database URL format');
    }
  }
}

// Test Redis configuration
async function testRedisConfig(): Promise<void> {
  console.log(chalk.blue('\n💾 Testing Redis Configuration...'));
  
  const hasRedisUrl = checkEnvVar('REDIS_URL', 'Redis', false);
  const hasRedisHost = checkEnvVar('REDIS_HOST', 'Redis', false);
  
  if (!hasRedisUrl && !hasRedisHost) {
    addResult('Redis', 'Configuration', 'warning', 'Redis not configured (caching will be limited)');
  } else {
    if (hasRedisUrl) {
      const redisUrl = process.env.REDIS_URL!;
      try {
        const url = new URL(redisUrl);
        if (url.protocol === 'redis:' || url.protocol === 'rediss:') {
          addResult('Redis', 'Connection String', 'pass', 'Valid Redis connection string');
        }
      } catch {
        addResult('Redis', 'Connection String', 'fail', 'Invalid Redis URL format');
      }
    }
  }
}

// Test security configuration
async function testSecurityConfig(): Promise<void> {
  console.log(chalk.blue('\n🔒 Testing Security Configuration...'));
  
  const hasJwtSecret = checkEnvVar('JWT_SECRET', 'Security');
  const hasSessionSecret = checkEnvVar('SESSION_SECRET', 'Security');
  const hasCookieSecret = checkEnvVar('COOKIE_SECRET', 'Security');
  
  // Check secret strength
  if (hasJwtSecret && process.env.JWT_SECRET!.length < 32) {
    addResult('Security', 'JWT Secret', 'warning', 'JWT secret should be at least 32 characters');
  }
  
  if (hasSessionSecret && process.env.SESSION_SECRET!.length < 32) {
    addResult('Security', 'Session Secret', 'warning', 'Session secret should be at least 32 characters');
  }
  
  if (hasCookieSecret && process.env.COOKIE_SECRET!.length < 32) {
    addResult('Security', 'Cookie Secret', 'warning', 'Cookie secret should be at least 32 characters');
  }
  
  // Check OAuth providers
  checkEnvVar('GOOGLE_CLIENT_ID', 'Security', false);
  checkEnvVar('GOOGLE_CLIENT_SECRET', 'Security', false);
  checkEnvVar('GITHUB_CLIENT_ID', 'Security', false);
  checkEnvVar('GITHUB_CLIENT_SECRET', 'Security', false);
}

// Test domain configuration
async function testDomainConfig(): Promise<void> {
  console.log(chalk.blue('\n🌐 Testing Domain Configuration...'));
  
  const hasAppUrl = checkEnvVar('VITE_APP_URL', 'Domain');
  const hasApiUrl = checkEnvVar('VITE_API_BASE_URL', 'Domain');
  
  if (hasAppUrl) {
    const appUrl = process.env.VITE_APP_URL!;
    if (!validateUrl(appUrl)) {
      addResult('Domain', 'App URL', 'fail', 'Invalid URL format');
    } else if (!appUrl.startsWith('https://')) {
      addResult('Domain', 'App URL', 'warning', 'Production should use HTTPS');
    } else {
      // Test if domain is reachable
      const reachable = await testEndpoint(appUrl);
      if (reachable) {
        addResult('Domain', 'App URL', 'pass', 'Domain is reachable');
      } else {
        addResult('Domain', 'App URL', 'warning', 'Domain not reachable (might not be deployed yet)');
      }
    }
  }
}

// Test CDN configuration
async function testCDNConfig(): Promise<void> {
  console.log(chalk.blue('\n🚀 Testing CDN Configuration...'));
  
  const cdnProvider = process.env.CDN_PROVIDER;
  
  if (!cdnProvider) {
    addResult('CDN', 'Provider', 'warning', 'No CDN provider configured');
  } else if (cdnProvider === 'cloudflare') {
    checkEnvVar('CLOUDFLARE_ZONE_ID', 'CDN');
    checkEnvVar('CLOUDFLARE_API_TOKEN', 'CDN');
  } else if (cdnProvider === 'cloudfront') {
    checkEnvVar('AWS_CLOUDFRONT_DISTRIBUTION_ID', 'CDN');
    checkEnvVar('AWS_ACCESS_KEY_ID', 'CDN');
    checkEnvVar('AWS_SECRET_ACCESS_KEY', 'CDN');
  }
}

// Main validation function
async function validateProductionConfig(): Promise<void> {
  console.log(chalk.bold.green('\n🔍 AI Glossary Pro - Production Configuration Validator\n'));
  
  // Check if production env file exists
  if (!existsSync('.env.production')) {
    console.log(chalk.red('❌ .env.production file not found!'));
    console.log(chalk.yellow('Please copy .env.production.example to .env.production and configure it.'));
    process.exit(1);
  }
  
  // Run all tests
  await testDomainConfig();
  await testEmailConfig();
  await testAnalyticsConfig();
  await testGumroadConfig();
  await testFirebaseConfig();
  await testDatabaseConfig();
  await testRedisConfig();
  await testSecurityConfig();
  await testCDNConfig();
  
  // Generate report
  console.log(chalk.bold.blue('\n📋 Validation Results:\n'));
  
  const categories = [...new Set(results.map(r => r.category))];
  let totalPass = 0;
  let totalFail = 0;
  let totalWarning = 0;
  
  for (const category of categories) {
    console.log(chalk.bold.white(`${category}:`));
    const categoryResults = results.filter(r => r.category === category);
    
    for (const result of categoryResults) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      const color = result.status === 'pass' ? chalk.green : result.status === 'fail' ? chalk.red : chalk.yellow;
      console.log(`  ${icon} ${color(result.item)}: ${result.message}`);
      
      if (result.status === 'pass') totalPass++;
      else if (result.status === 'fail') totalFail++;
      else totalWarning++;
    }
    console.log('');
  }
  
  // Summary
  console.log(chalk.bold.white('\n📊 Summary:'));
  console.log(`  ✅ Passed: ${chalk.green(totalPass)}`);
  console.log(`  ⚠️  Warnings: ${chalk.yellow(totalWarning)}`);
  console.log(`  ❌ Failed: ${chalk.red(totalFail)}`);
  
  if (totalFail > 0) {
    console.log(chalk.bold.red('\n❌ Production configuration has critical issues that must be fixed!'));
    process.exit(1);
  } else if (totalWarning > 0) {
    console.log(chalk.bold.yellow('\n⚠️  Production configuration has warnings. Review them before deploying.'));
  } else {
    console.log(chalk.bold.green('\n✅ Production configuration is valid and ready for deployment!'));
  }
}

// Run validation
validateProductionConfig().catch(error => {
  console.error(chalk.red('Error running validation:'), error);
  process.exit(1);
});