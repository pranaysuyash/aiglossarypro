#!/usr/bin/env tsx

/**
 * Production Health Check Script
 * Verifies all critical systems are operational for production deployment
 */

import { db } from '../db';
import { users, terms, categories } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import OpenAI from 'openai';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  responseTime?: number;
  details?: any;
}

class HealthChecker {
  private results: HealthCheckResult[] = [];

  async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Test basic connectivity
      await db.select().from(users).limit(1);
      
      // Test write capability
      const testUser = {
        id: 'health-check-test',
        email: 'health-check@test.com',
        subscriptionTier: 'free' as const,
        lifetimeAccess: false,
        dailyViews: 0,
        lastViewReset: new Date()
      };
      
      await db.insert(users).values(testUser).onConflictDoUpdate({
        target: users.id,
        set: { lastViewReset: new Date() }
      });
      
      // Clean up test user
      await db.delete(users).where(eq(users.id, 'health-check-test'));
      
      const responseTime = Date.now() - start;
      
      return {
        service: 'Database',
        status: 'healthy',
        message: 'Database read/write operations successful',
        responseTime,
        details: { responseTimeMs: responseTime }
      };
    } catch (error) {
      return {
        service: 'Database',
        status: 'unhealthy',
        message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - start
      };
    }
  }

  async checkDataIntegrity(): Promise<HealthCheckResult> {
    try {
      const [termCount] = await db.select().from(terms).limit(1);
      const [categoryCount] = await db.select().from(categories).limit(1);
      
      if (!termCount && !categoryCount) {
        return {
          service: 'Data Integrity',
          status: 'warning',
          message: 'No terms or categories found in database',
          details: { termsCount: 0, categoriesCount: 0 }
        };
      }
      
      return {
        service: 'Data Integrity',
        status: 'healthy',
        message: 'Core data tables populated',
        details: { 
          hasTerms: !!termCount,
          hasCategories: !!categoryCount
        }
      };
    } catch (error) {
      return {
        service: 'Data Integrity',
        status: 'unhealthy',
        message: `Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async checkFileSystem(): Promise<HealthCheckResult> {
    try {
      const requiredDirs = ['data', 'logs', 'uploads'];
      const checks = [];
      
      for (const dir of requiredDirs) {
        const dirPath = path.join(process.cwd(), dir);
        const exists = fs.existsSync(dirPath);
        checks.push({ dir, exists, path: dirPath });
        
        if (!exists) {
          // Create directory if it doesn't exist
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }
      
      // Test write permissions
      const testFile = path.join(process.cwd(), 'logs', 'health-check.test');
      fs.writeFileSync(testFile, 'health check test');
      fs.unlinkSync(testFile);
      
      return {
        service: 'File System',
        status: 'healthy',
        message: 'All required directories accessible with write permissions',
        details: { directories: checks }
      };
    } catch (error) {
      return {
        service: 'File System',
        status: 'unhealthy',
        message: `File system check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async checkEnvironmentVariables(): Promise<HealthCheckResult> {
    const required = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'JWT_SECRET'
    ];
    
    const optional = [
      'OPENAI_API_KEY',
      'SENTRY_DSN',
      'GOOGLE_CLIENT_ID',
      'GITHUB_CLIENT_ID',
      'GUMROAD_WEBHOOK_SECRET'
    ];
    
    const missing = required.filter(env => !process.env[env]);
    const present = optional.filter(env => process.env[env]);
    
    if (missing.length > 0) {
      return {
        service: 'Environment Variables',
        status: 'unhealthy',
        message: `Missing required environment variables: ${missing.join(', ')}`,
        details: { missing, present }
      };
    }
    
    return {
      service: 'Environment Variables',
      status: 'healthy',
      message: 'All required environment variables present',
      details: { 
        requiredPresent: required.length,
        optionalPresent: present.length,
        totalOptional: optional.length
      }
    };
  }

  async checkMemoryUsage(): Promise<HealthCheckResult> {
    const usage = process.memoryUsage();
    const totalMB = Math.round(usage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    
    let status: 'healthy' | 'warning' | 'unhealthy' = 'healthy';
    let message = `Memory usage normal (${totalMB}MB RSS, ${heapUsedMB}MB heap)`;
    
    if (totalMB > 1000) {
      status = 'warning';
      message = `High memory usage (${totalMB}MB RSS)`;
    }
    
    if (totalMB > 2000) {
      status = 'unhealthy';
      message = `Critical memory usage (${totalMB}MB RSS)`;
    }
    
    return {
      service: 'Memory Usage',
      status,
      message,
      details: {
        rss: `${totalMB}MB`,
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`
      }
    };
  }

  async checkS3Service(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_REGION) {
        return {
          service: 'S3 Service',
          status: 'warning',
          message: 'S3 not configured (optional service)',
          details: { configured: false }
        };
      }

      const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        }
      });

      await s3Client.send(new HeadBucketCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME
      }));

      const responseTime = Date.now() - start;
      return {
        service: 'S3 Service',
        status: 'healthy',
        message: `S3 bucket '${process.env.AWS_S3_BUCKET_NAME}' accessible`,
        responseTime,
        details: { bucketName: process.env.AWS_S3_BUCKET_NAME, responseTimeMs: responseTime }
      };
    } catch (error) {
      return {
        service: 'S3 Service',
        status: 'unhealthy',
        message: `S3 check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - start
      };
    }
  }

  async checkOpenAIService(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          service: 'OpenAI Service',
          status: 'warning',
          message: 'OpenAI API not configured (optional service)',
          details: { configured: false }
        };
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const models = await openai.models.list();
      const responseTime = Date.now() - start;
      
      return {
        service: 'OpenAI Service',
        status: 'healthy',
        message: 'OpenAI API accessible',
        responseTime,
        details: { 
          modelsCount: models.data?.length || 0,
          responseTimeMs: responseTime 
        }
      };
    } catch (error) {
      let status: 'unhealthy' | 'warning' = 'unhealthy';
      let message = 'OpenAI API check failed';
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          message = 'OpenAI API key invalid';
        } else if (error.message.includes('429')) {
          status = 'warning';
          message = 'OpenAI API rate limit exceeded';
        } else {
          message = `OpenAI API error: ${error.message}`;
        }
      }
      
      return {
        service: 'OpenAI Service',
        status,
        message,
        responseTime: Date.now() - start
      };
    }
  }

  async runAllChecks(): Promise<HealthCheckResult[]> {
    console.log('🏥 Running production health checks...\n');
    
    const coreChecks = [
      this.checkEnvironmentVariables(),
      this.checkDatabase(),
      this.checkDataIntegrity(),
      this.checkFileSystem(),
      this.checkMemoryUsage()
    ];
    
    const externalChecks = [
      this.checkS3Service(),
      this.checkOpenAIService()
    ];
    
    // Run core checks first, then external services
    const coreResults = await Promise.all(coreChecks);
    console.log('✅ Core system checks completed\n');
    
    console.log('🔗 Checking external services...\n');
    const externalResults = await Promise.all(externalChecks);
    
    this.results = [...coreResults, ...externalResults];
    return this.results;
  }

  printResults(): void {
    console.log('📊 Health Check Results:\n');
    
    this.results.forEach((result, index) => {
      const icon = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${index + 1}. ${icon} ${result.service}: ${result.status.toUpperCase()}`);
      console.log(`   ${result.message}`);
      
      if (result.responseTime) {
        console.log(`   Response time: ${result.responseTime}ms`);
      }
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      
      console.log('');
    });
  }

  getOverallStatus(): 'healthy' | 'warning' | 'unhealthy' {
    const hasUnhealthy = this.results.some(r => r.status === 'unhealthy');
    const hasWarning = this.results.some(r => r.status === 'warning');
    
    if (hasUnhealthy) return 'unhealthy';
    if (hasWarning) return 'warning';
    return 'healthy';
  }

  getExitCode(): number {
    const status = this.getOverallStatus();
    return status === 'healthy' ? 0 : status === 'warning' ? 1 : 2;
  }
}

async function main() {
  const checker = new HealthChecker();
  
  try {
    await checker.runAllChecks();
    checker.printResults();
    
    const overallStatus = checker.getOverallStatus();
    const icon = overallStatus === 'healthy' ? '🟢' : overallStatus === 'warning' ? '🟡' : '🔴';
    
    console.log(`${icon} Overall System Status: ${overallStatus.toUpperCase()}`);
    
    if (overallStatus === 'healthy') {
      console.log('🚀 System is ready for production deployment!');
    } else if (overallStatus === 'warning') {
      console.log('⚠️  System has warnings but may be deployable. Review details above.');
    } else {
      console.log('❌ System has critical issues. DO NOT deploy until resolved.');
    }
    
    process.exit(checker.getExitCode());
  } catch (error) {
    console.error('💥 Health check failed with error:', error);
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}