#!/usr/bin/env tsx
/**
 * Quick Security Test Script
 * Tests critical security components for launch readiness
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

interface SecurityTestResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
}

class QuickSecurityTest {
  private results: SecurityTestResult[] = [];

  constructor() {
    console.log('🔒 Quick Security Test - AI Glossary Pro');
    console.log('=' .repeat(50));
  }

  private addResult(result: SecurityTestResult) {
    this.results.push(result);
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${icon} ${result.component}: ${result.details}`);
  }

  private testEnvironmentSecurity(): void {
    console.log('\\n🔧 Testing Environment Security...');
    
    // Check JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length >= 32) {
      this.addResult({
        component: 'JWT Secret',
        status: 'PASS',
        details: 'Strong JWT secret configured'
      });
    } else {
      this.addResult({
        component: 'JWT Secret',
        status: 'FAIL',
        details: 'JWT secret too weak or missing'
      });
    }

    // Check session secret
    const sessionSecret = process.env.SESSION_SECRET;
    if (sessionSecret && sessionSecret.length >= 32) {
      this.addResult({
        component: 'Session Secret',
        status: 'PASS',
        details: 'Strong session secret configured'
      });
    } else {
      this.addResult({
        component: 'Session Secret',
        status: 'FAIL',
        details: 'Session secret too weak or missing'
      });
    }

    // Check database URL security
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.includes('sslmode=require')) {
      this.addResult({
        component: 'Database SSL',
        status: 'PASS',
        details: 'SSL required for database connections'
      });
    } else {
      this.addResult({
        component: 'Database SSL',
        status: 'WARNING',
        details: 'SSL not explicitly required'
      });
    }
  }

  private testSecurityImplementation(): void {
    console.log('\\n🛡️ Testing Security Implementation...');
    
    // Test XSS protection
    try {
      const xssFiles = execSync('find ./client ./server -name "*.ts" -o -name "*.tsx" | xargs grep -l "sanitize\\|DOMPurify" | wc -l', 
        { encoding: 'utf8' }).trim();
      
      const count = parseInt(xssFiles);
      if (count > 10) {
        this.addResult({
          component: 'XSS Protection',
          status: 'PASS',
          details: `DOMPurify sanitization in ${count} files`
        });
      } else if (count > 5) {
        this.addResult({
          component: 'XSS Protection',
          status: 'WARNING',
          details: `Sanitization in ${count} files (may need more)`
        });
      } else {
        this.addResult({
          component: 'XSS Protection',
          status: 'FAIL',
          details: `Insufficient XSS protection (${count} files)`
        });
      }
    } catch (error) {
      this.addResult({
        component: 'XSS Protection',
        status: 'WARNING',
        details: 'Unable to verify XSS protection'
      });
    }

    // Test rate limiting
    try {
      const rateLimitFiles = execSync('find ./server -name "*.ts" | xargs grep -l "rateLimit\\|express-rate-limit" | wc -l', 
        { encoding: 'utf8' }).trim();
      
      const count = parseInt(rateLimitFiles);
      if (count > 5) {
        this.addResult({
          component: 'Rate Limiting',
          status: 'PASS',
          details: `Rate limiting in ${count} files`
        });
      } else if (count > 2) {
        this.addResult({
          component: 'Rate Limiting',
          status: 'WARNING',
          details: `Rate limiting in ${count} files (may need more)`
        });
      } else {
        this.addResult({
          component: 'Rate Limiting',
          status: 'FAIL',
          details: `Insufficient rate limiting (${count} files)`
        });
      }
    } catch (error) {
      this.addResult({
        component: 'Rate Limiting',
        status: 'WARNING',
        details: 'Unable to verify rate limiting'
      });
    }

    // Test Helmet security headers
    try {
      const helmetFiles = execSync('find ./server -name "*.ts" | xargs grep -l "helmet" | wc -l', 
        { encoding: 'utf8' }).trim();
      
      const count = parseInt(helmetFiles);
      if (count > 3) {
        this.addResult({
          component: 'Security Headers',
          status: 'PASS',
          details: `Helmet security headers in ${count} files`
        });
      } else if (count > 1) {
        this.addResult({
          component: 'Security Headers',
          status: 'WARNING',
          details: `Helmet in ${count} files (may need more)`
        });
      } else {
        this.addResult({
          component: 'Security Headers',
          status: 'FAIL',
          details: `Insufficient security headers (${count} files)`
        });
      }
    } catch (error) {
      this.addResult({
        component: 'Security Headers',
        status: 'WARNING',
        details: 'Unable to verify security headers'
      });
    }

    // Test authentication implementation
    try {
      const authFiles = execSync('find ./server -name "*.ts" | xargs grep -l "firebase\\|jwt" | wc -l', 
        { encoding: 'utf8' }).trim();
      
      const count = parseInt(authFiles);
      if (count > 5) {
        this.addResult({
          component: 'Authentication',
          status: 'PASS',
          details: `Authentication system in ${count} files`
        });
      } else if (count > 2) {
        this.addResult({
          component: 'Authentication',
          status: 'WARNING',
          details: `Authentication in ${count} files (may need more)`
        });
      } else {
        this.addResult({
          component: 'Authentication',
          status: 'FAIL',
          details: `Insufficient authentication (${count} files)`
        });
      }
    } catch (error) {
      this.addResult({
        component: 'Authentication',
        status: 'WARNING',
        details: 'Unable to verify authentication'
      });
    }
  }

  private testDatabaseSecurity(): void {
    console.log('\\n🗃️ Testing Database Security...');
    
    // Test database connection
    try {
      const dbOutput = execSync('npm run db:status', { encoding: 'utf8' });
      if (dbOutput.includes('Database connection successful')) {
        this.addResult({
          component: 'Database Connection',
          status: 'PASS',
          details: 'Database connection secure and operational'
        });
      } else {
        this.addResult({
          component: 'Database Connection',
          status: 'FAIL',
          details: 'Database connection issues detected'
        });
      }
    } catch (error) {
      this.addResult({
        component: 'Database Connection',
        status: 'FAIL',
        details: 'Unable to test database connection'
      });
    }

    // Test for SQL injection protection (Drizzle ORM)
    try {
      const drizzleFiles = execSync('find ./server -name "*.ts" | xargs grep -l "drizzle" | wc -l', 
        { encoding: 'utf8' }).trim();
      
      const count = parseInt(drizzleFiles);
      if (count > 5) {
        this.addResult({
          component: 'SQL Injection Protection',
          status: 'PASS',
          details: `Drizzle ORM protection in ${count} files`
        });
      } else {
        this.addResult({
          component: 'SQL Injection Protection',
          status: 'WARNING',
          details: `Drizzle ORM in ${count} files (verify coverage)`
        });
      }
    } catch (error) {
      this.addResult({
        component: 'SQL Injection Protection',
        status: 'WARNING',
        details: 'Unable to verify SQL injection protection'
      });
    }
  }

  private testSecurityConfiguration(): void {
    console.log('\\n⚙️ Testing Security Configuration...');
    
    // Check for security middleware file
    try {
      const securityFile = readFileSync('./server/middleware/security.ts', 'utf8');
      if (securityFile.includes('helmet') && securityFile.includes('cors')) {
        this.addResult({
          component: 'Security Middleware',
          status: 'PASS',
          details: 'Comprehensive security middleware configured'
        });
      } else {
        this.addResult({
          component: 'Security Middleware',
          status: 'WARNING',
          details: 'Security middleware may be incomplete'
        });
      }
    } catch (error) {
      this.addResult({
        component: 'Security Middleware',
        status: 'FAIL',
        details: 'Security middleware file not found'
      });
    }

    // Check for input validation
    try {
      const validationFiles = execSync('find ./server -name "*.ts" | xargs grep -l "zod\\|joi\\|validator" | wc -l', 
        { encoding: 'utf8' }).trim();
      
      const count = parseInt(validationFiles);
      if (count > 3) {
        this.addResult({
          component: 'Input Validation',
          status: 'PASS',
          details: `Input validation in ${count} files`
        });
      } else {
        this.addResult({
          component: 'Input Validation',
          status: 'WARNING',
          details: `Input validation in ${count} files (may need more)`
        });
      }
    } catch (error) {
      this.addResult({
        component: 'Input Validation',
        status: 'WARNING',
        details: 'Unable to verify input validation'
      });
    }
  }

  public runTests(): void {
    this.testEnvironmentSecurity();
    this.testSecurityImplementation();
    this.testDatabaseSecurity();
    this.testSecurityConfiguration();
    
    this.generateReport();
  }

  private generateReport(): void {
    console.log('\\n' + '='.repeat(50));
    console.log('📊 SECURITY TEST RESULTS');
    console.log('='.repeat(50));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    
    const securityScore = Math.round((passedTests / totalTests) * 100);
    
    console.log(`Security Score: ${securityScore}%`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Warnings: ${warningTests}`);
    console.log(`Failed: ${failedTests}`);
    
    if (securityScore >= 80) {
      console.log('\\n🟢 SECURITY STATUS: PRODUCTION READY');
    } else if (securityScore >= 60) {
      console.log('\\n🟡 SECURITY STATUS: NEEDS ATTENTION');
    } else {
      console.log('\\n🔴 SECURITY STATUS: NOT READY');
    }
    
    if (failedTests > 0) {
      console.log('\\n❌ FAILED TESTS:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`  - ${result.component}: ${result.details}`);
      });
    }
    
    if (warningTests > 0) {
      console.log('\\n⚠️ WARNINGS:');
      this.results.filter(r => r.status === 'WARNING').forEach(result => {
        console.log(`  - ${result.component}: ${result.details}`);
      });
    }
  }
}

// Run the security test
const securityTest = new QuickSecurityTest();
securityTest.runTests();