#!/usr/bin/env tsx
/**
 * Production Deployment Script
 *
 * Comprehensive deployment automation for AIGlossaryPro including:
 * - Environment validation
 * - Database schema setup
 * - Content processing and import
 * - Health checks and validation
 * - Performance optimization
 * - Security configuration
 */

import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  skipDataImport?: boolean;
  enablePerformanceOptimizations?: boolean;
  enableSecurityHardening?: boolean;
  validateContent?: boolean;
}

class ProductionDeployment {
  private config: DeploymentConfig;
  private deploymentStartTime: number;
  private deploymentLog: string[] = [];

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.deploymentStartTime = Date.now();
  }

  async deploy(): Promise<void> {
    console.log('🚀 Starting Production Deployment');
    console.log('=================================');
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Started: ${new Date().toISOString()}`);

    try {
      // Step 1: Environment validation
      await this.validateEnvironment();

      // Step 2: Dependencies and build
      await this.installDependenciesAndBuild();

      // Step 3: Database setup
      await this.setupDatabase();

      // Step 4: Content processing (if enabled)
      if (!this.config.skipDataImport) {
        await this.processContent();
      }

      // Step 5: Performance optimizations
      if (this.config.enablePerformanceOptimizations) {
        await this.applyPerformanceOptimizations();
      }

      // Step 6: Security hardening
      if (this.config.enableSecurityHardening) {
        await this.applySecurityHardening();
      }

      // Step 7: Health checks
      await this.runHealthChecks();

      // Step 8: Content validation
      if (this.config.validateContent) {
        await this.validateContent();
      }

      await this.generateDeploymentReport();

      const totalTime = (Date.now() - this.deploymentStartTime) / 1000;
      console.log(
        `\n🎉 Deployment completed successfully in ${(totalTime / 60).toFixed(2)} minutes`
      );
    } catch (error) {
      console.error('💥 Deployment failed:', error);
      await this.handleDeploymentFailure(error);
      throw error;
    }
  }

  private async validateEnvironment(): Promise<void> {
    this.log('🔍 Validating environment...');

    // Check required environment variables
    const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET', 'NODE_ENV'];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Requires Node.js 18+`);
    }

    // Check available memory
    const totalMem = process.env.NODE_OPTIONS?.includes('max-old-space-size')
      ? parseInt(process.env.NODE_OPTIONS.split('max-old-space-size=')[1]?.split(' ')[0] || '4096')
      : 1400; // Default Node.js heap

    if (totalMem < 2048) {
      console.warn(
        '⚠️  Low memory allocation detected. Consider increasing with --max-old-space-size=4096'
      );
    }

    // Validate database connection
    try {
      const { db } = await import('./server/db');
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`SELECT 1`);
      this.log('✅ Database connection validated');
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    }

    this.log('✅ Environment validation passed');
  }

  private async installDependenciesAndBuild(): Promise<void> {
    this.log('📦 Installing dependencies and building...');

    try {
      // Install dependencies
      await execAsync('npm ci');
      this.log('✅ Dependencies installed');

      // Type checking
      await execAsync('npm run check');
      this.log('✅ TypeScript type checking passed');

      // Build the application
      await execAsync('npm run build');
      this.log('✅ Application built successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error}`);
    }
  }

  private async setupDatabase(): Promise<void> {
    this.log('🗄️ Setting up database...');

    try {
      // Push schema changes
      await execAsync('npm run db:push');
      this.log('✅ Database schema updated');

      // Apply performance indexes
      await execAsync('npm run db:indexes');
      this.log('✅ Performance indexes applied');

      // Verify schema
      const { db } = await import('./server/db');
      const { sql } = await import('drizzle-orm');

      // Check key tables exist
      const tables = ['terms', 'categories', 'enhanced_terms', 'term_sections'];
      for (const table of tables) {
        const _result = await db.execute(sql.raw(`SELECT 1 FROM ${table} LIMIT 1`));
        this.log(`✅ Table '${table}' verified`);
      }
    } catch (error) {
      throw new Error(`Database setup failed: ${error}`);
    }
  }

  private async processContent(): Promise<void> {
    this.log('📄 Processing content...');

    try {
      // Check if CSV file exists for large dataset processing
      const csvPath = 'data/aiml.csv';
      const _xlsxPath = 'data/aiml.xlsx';

      try {
        await fs.access(csvPath);
        this.log('✅ Found CSV file, using streaming processor');

        // Use CSV streaming processor for large dataset
        await execAsync('npx tsx csv_streaming_processor.ts');
        this.log('✅ Large dataset processed via CSV streaming');
      } catch {
        // CSV doesn't exist, check for smaller Excel files
        try {
          await fs.access('data/row1.xlsx');
          this.log('✅ Processing test file (row1.xlsx)');

          await execAsync('npx tsx test_advanced_parser.ts');
          this.log('✅ Test data processed');
        } catch {
          this.log('⚠️  No data files found for import');

          if (this.config.environment === 'production') {
            console.warn('⚠️  Production deployment without data import');
            console.warn('   Please ensure data is imported before going live');
          }
        }
      }
    } catch (error) {
      if (this.config.environment === 'production') {
        throw new Error(`Content processing failed: ${error}`);
      } else {
        this.log(
          `⚠️  Content processing failed (non-critical in ${this.config.environment}): ${error}`
        );
      }
    }
  }

  private async applyPerformanceOptimizations(): Promise<void> {
    this.log('⚡ Applying performance optimizations...');

    try {
      const { db } = await import('./server/db');
      const { sql } = await import('drizzle-orm');

      // Database optimizations
      const optimizations = [
        // Index on frequently searched columns
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_name_search ON terms USING GIN (to_tsvector('english', name))`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_terms_definition_search ON terms USING GIN (to_tsvector('english', definition))`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_terms_search ON enhanced_terms USING GIN (search_text)`,

        // Performance indexes for joins
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_term_sections_term_id ON term_sections (term_id)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_term_sections_name ON term_sections (section_name)`,

        // Analytics indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_term_views_user_date ON user_term_views (user_id, DATE(viewed_at))`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_term_views_term_date ON user_term_views (term_id, DATE(viewed_at))`,
      ];

      for (const optimization of optimizations) {
        try {
          await db.execute(sql.raw(optimization));
          this.log(`✅ Applied: ${optimization.split(' ')[4]}`); // Extract index name
        } catch (error) {
          // Index might already exist, that's okay
          if (!String(error).includes('already exists')) {
            console.warn(`⚠️  Optimization warning: ${error}`);
          }
        }
      }

      this.log('✅ Performance optimizations applied');
    } catch (error) {
      throw new Error(`Performance optimization failed: ${error}`);
    }
  }

  private async applySecurityHardening(): Promise<void> {
    this.log('🔒 Applying security hardening...');

    try {
      // Validate security configurations
      const securityChecks = [
        {
          name: 'Session Secret',
          check: () => process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32,
          message: 'SESSION_SECRET should be at least 32 characters',
        },
        {
          name: 'Production Mode',
          check: () =>
            this.config.environment === 'production' ? process.env.NODE_ENV === 'production' : true,
          message: 'NODE_ENV should be "production" for production deployment',
        },
        {
          name: 'Database SSL',
          check: () => {
            const dbUrl = process.env.DATABASE_URL || '';
            return this.config.environment === 'production'
              ? dbUrl.includes('sslmode=require')
              : true;
          },
          message: 'Database should use SSL in production',
        },
      ];

      for (const check of securityChecks) {
        if (check.check()) {
          this.log(`✅ ${check.name} validated`);
        } else {
          if (this.config.environment === 'production') {
            throw new Error(`Security check failed: ${check.message}`);
          } else {
            this.log(`⚠️  ${check.name}: ${check.message}`);
          }
        }
      }

      this.log('✅ Security hardening completed');
    } catch (error) {
      throw new Error(`Security hardening failed: ${error}`);
    }
  }

  private async runHealthChecks(): Promise<void> {
    this.log('🏥 Running health checks...');

    try {
      // Start the server for health checks
      const serverProcess = exec('npm start');

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 5000));

      try {
        // Test key endpoints
        const healthChecks = [
          'http://localhost:3001/api/health',
          'http://localhost:3001/api/terms',
          'http://localhost:3001/api/categories',
        ];

        for (const endpoint of healthChecks) {
          try {
            const { stdout } = await execAsync(`curl -f ${endpoint}`);
            this.log(`✅ Health check passed: ${endpoint}`);
          } catch (_error) {
            this.log(`❌ Health check failed: ${endpoint}`);
            throw new Error(`Health check failed for ${endpoint}`);
          }
        }
      } finally {
        // Stop the server
        serverProcess.kill();
      }

      this.log('✅ All health checks passed');
    } catch (error) {
      throw new Error(`Health checks failed: ${error}`);
    }
  }

  private async validateContent(): Promise<void> {
    this.log('📊 Validating content...');

    try {
      const { db } = await import('./server/db');
      const { terms, categories, enhancedTerms, termSections } = await import('./shared/schema');
      const { sql } = await import('drizzle-orm');

      // Get counts
      const [termsCount] = await db.select({ count: sql<number>`count(*)` }).from(terms);
      const [categoriesCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
      const [enhancedCount] = await db.select({ count: sql<number>`count(*)` }).from(enhancedTerms);
      const [sectionsCount] = await db.select({ count: sql<number>`count(*)` }).from(termSections);

      this.log(`📊 Content validation results:`);
      this.log(`   Terms: ${termsCount.count}`);
      this.log(`   Categories: ${categoriesCount.count}`);
      this.log(`   Enhanced terms: ${enhancedCount.count}`);
      this.log(`   Term sections: ${sectionsCount.count}`);

      // Validation thresholds
      const minTerms = this.config.environment === 'production' ? 1000 : 1;
      const minCategories = this.config.environment === 'production' ? 50 : 1;

      if (termsCount.count < minTerms) {
        throw new Error(`Insufficient terms: ${termsCount.count} (minimum: ${minTerms})`);
      }

      if (categoriesCount.count < minCategories) {
        throw new Error(
          `Insufficient categories: ${categoriesCount.count} (minimum: ${minCategories})`
        );
      }

      // Check for 42-section coverage
      if (enhancedCount.count > 0) {
        const avgSections = sectionsCount.count / enhancedCount.count;
        this.log(`   Average sections per enhanced term: ${avgSections.toFixed(1)}`);

        if (avgSections < 20) {
          this.log(`⚠️  Low section coverage: ${avgSections.toFixed(1)} sections per term`);
        } else {
          this.log(`✅ Good section coverage: ${avgSections.toFixed(1)} sections per term`);
        }
      }

      this.log('✅ Content validation passed');
    } catch (error) {
      throw new Error(`Content validation failed: ${error}`);
    }
  }

  private async generateDeploymentReport(): Promise<void> {
    const deploymentTime = (Date.now() - this.deploymentStartTime) / 1000;

    const report = {
      deployment: {
        environment: this.config.environment,
        timestamp: new Date().toISOString(),
        duration: `${(deploymentTime / 60).toFixed(2)} minutes`,
        success: true,
      },
      configuration: this.config,
      logs: this.deploymentLog,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0)}MB`,
      },
    };

    const reportPath = `temp/deployment_report_${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Deployment report saved: ${reportPath}`);
  }

  private async handleDeploymentFailure(error: Error | unknown): Promise<void> {
    const deploymentTime = (Date.now() - this.deploymentStartTime) / 1000;

    const errorReport = {
      deployment: {
        environment: this.config.environment,
        timestamp: new Date().toISOString(),
        duration: `${(deploymentTime / 60).toFixed(2)} minutes`,
        success: false,
        error: String(error),
      },
      configuration: this.config,
      logs: this.deploymentLog,
    };

    const errorReportPath = `temp/deployment_error_${Date.now()}.json`;
    await fs.writeFile(errorReportPath, JSON.stringify(errorReport, null, 2));

    console.error(`💥 Error report saved: ${errorReportPath}`);
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    this.deploymentLog.push(logEntry);
  }
}

// Check for CSV file periodically
async function checkForCSVFile(): Promise<boolean> {
  try {
    await fs.access('data/aiml.csv');
    return true;
  } catch {
    return false;
  }
}

// Main deployment function
async function runProductionDeployment() {
  console.log('🚀 Production Deployment Manager');
  console.log('=================================');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const environment = (args.find(arg => arg.startsWith('--env='))?.split('=')[1] ||
    'development') as 'development' | 'staging' | 'production';
  const skipDataImport = args.includes('--skip-data');
  const enablePerformanceOptimizations =
    args.includes('--optimize') || environment === 'production';
  const enableSecurityHardening = args.includes('--secure') || environment === 'production';
  const validateContent = args.includes('--validate') || environment !== 'development';

  const config: DeploymentConfig = {
    environment,
    skipDataImport,
    enablePerformanceOptimizations,
    enableSecurityHardening,
    validateContent,
  };

  console.log('Configuration:', config);

  // Check for CSV file before starting
  if (!skipDataImport) {
    console.log('\n📂 Checking for data files...');
    const hasCSV = await checkForCSVFile();

    if (hasCSV) {
      console.log('✅ Found aiml.csv - will process large dataset');
    } else {
      console.log('⚠️  No aiml.csv found');
      if (environment === 'production') {
        console.log('   For production deployment with full dataset:');
        console.log('   1. Convert aiml.xlsx to aiml.csv first');
        console.log('   2. Or use --skip-data flag for deployment without data');
        process.exit(1);
      }
    }
  }

  try {
    const deployment = new ProductionDeployment(config);
    await deployment.deploy();

    console.log('\n🎉 Deployment completed successfully!');
    console.log('🌐 Your AIGlossaryPro instance is ready for use');
  } catch (error) {
    console.error('\n💥 Deployment failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { ProductionDeployment };

// Run if called directly
if (require.main === module) {
  runProductionDeployment();
}
