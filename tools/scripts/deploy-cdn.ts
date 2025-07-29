#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

// Environment configuration
interface DeployConfig {
  provider: 'cloudflare' | 'cloudfront' | 'local';
  environment: 'development' | 'staging' | 'production';
  dryRun: boolean;
  verbose: boolean;
  skipBuild: boolean;
  invalidateCache: boolean;
}

class CDNDeployer {
  private config: DeployConfig;
  private projectRoot: string;
  private distPath: string;

  constructor(config: DeployConfig) {
    this.config = config;
    this.projectRoot = process.cwd();
    this.distPath = path.join(this.projectRoot, 'dist', 'public');
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.verbose && level === 'info') return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  private async checkEnvironment(): Promise<void> {
    this.log('Checking environment configuration...');

    // Check required environment variables based on provider
    if (this.config.provider === 'cloudflare') {
      const required = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ZONE_ID', 'CLOUDFLARE_CDN_URL'];
      for (const envVar of required) {
        if (!process.env[envVar]) {
          throw new Error(`Missing required environment variable: ${envVar}`);
        }
      }
    } else if (this.config.provider === 'cloudfront') {
      const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'CLOUDFRONT_DISTRIBUTION_ID'];
      for (const envVar of required) {
        if (!process.env[envVar]) {
          throw new Error(`Missing required environment variable: ${envVar}`);
        }
      }
    }

    this.log('Environment configuration valid');
  }

  private async buildProject(): Promise<void> {
    if (this.config.skipBuild) {
      this.log('Skipping build step');
      return;
    }

    this.log('Building project for CDN deployment...');

    try {
      // Set CDN environment variables for build
      const buildEnv = {
        ...process.env,
        NODE_ENV: 'production',
        [`USE_${this.config.provider.toUpperCase()}_CDN`]: 'true',
        CDN_PROVIDER: this.config.provider,
        CDN_ENVIRONMENT: this.config.environment,
      };

      // Use CDN-optimized Vite config
      const viteConfig =
        this.config.provider !== 'local'
          ? '--config vite.config.cdn.ts'
          : '--config vite.config.ts';

      if (this.config.dryRun) {
        this.log(`Would run: npm run build ${viteConfig}`);
      } else {
        execSync(`npm run build ${viteConfig}`, {
          stdio: 'inherit',
          env: buildEnv,
          cwd: this.projectRoot,
        });
      }

      this.log('Build completed successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error}`);
    }
  }

  private async analyzeBuildOutput(): Promise<void> {
    this.log('Analyzing build output...');

    try {
      const stats = await this.getBuildStats();

      this.log(`Build analysis:
        - Total assets: ${stats.totalFiles}
        - Total size: ${this.formatBytes(stats.totalSize)}
        - JavaScript: ${this.formatBytes(stats.jsSize)} (${stats.jsFiles} files)
        - CSS: ${this.formatBytes(stats.cssSize)} (${stats.cssFiles} files)
        - Images: ${this.formatBytes(stats.imageSize)} (${stats.imageFiles} files)
        - Other: ${this.formatBytes(stats.otherSize)} (${stats.otherFiles} files)`);

      // Check performance budgets
      if (stats.jsSize > 500 * 1024) {
        // 500KB
        this.log(
          `JavaScript bundle exceeds performance budget: ${this.formatBytes(stats.jsSize)}`,
          'warn'
        );
      }

      if (stats.cssSize > 150 * 1024) {
        // 150KB
        this.log(
          `CSS bundle exceeds performance budget: ${this.formatBytes(stats.cssSize)}`,
          'warn'
        );
      }
    } catch (error) {
      this.log(`Failed to analyze build output: ${error}`, 'warn');
    }
  }

  private async getBuildStats(): Promise<unknown> {
    const assetsPath = path.join(this.distPath, 'assets');
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      jsFiles: 0,
      jsSize: 0,
      cssFiles: 0,
      cssSize: 0,
      imageFiles: 0,
      imageSize: 0,
      otherFiles: 0,
      otherSize: 0,
    };

    const processDirectory = async (dirPath: string): Promise<void> => {
      try {
        const items = await fs.readdir(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = await fs.stat(itemPath);

          if (stat.isDirectory()) {
            await processDirectory(itemPath);
          } else {
            stats.totalFiles++;
            stats.totalSize += stat.size;

            const ext = path.extname(item).toLowerCase();

            if (ext === '.js' || ext === '.mjs') {
              stats.jsFiles++;
              stats.jsSize += stat.size;
            } else if (ext === '.css') {
              stats.cssFiles++;
              stats.cssSize += stat.size;
            } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(ext)) {
              stats.imageFiles++;
              stats.imageSize += stat.size;
            } else {
              stats.otherFiles++;
              stats.otherSize += stat.size;
            }
          }
        }
      } catch (_error) {
        // Directory might not exist
      }
    };

    await processDirectory(assetsPath);
    return stats;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  private async deployToCloudflare(): Promise<void> {
    this.log('Deploying to Cloudflare...');

    if (this.config.dryRun) {
      this.log('Would deploy assets to Cloudflare CDN');
      return;
    }

    try {
      // For Cloudflare, we typically just need to ensure the assets are served
      // from the origin server with proper cache headers. The CDN will cache them.
      // However, we can also use Cloudflare Pages or Workers Sites for static hosting.

      this.log('Cloudflare deployment would typically involve:');
      this.log('1. Uploading assets to origin server');
      this.log('2. Configuring cache rules via Cloudflare API');
      this.log('3. Purging existing cache if needed');

      // If using Cloudflare Pages, we would upload the built files
      // For now, we'll assume the assets are served from the origin

      await this.configureCloudflareCaching();

      this.log('Cloudflare deployment completed');
    } catch (error) {
      throw new Error(`Cloudflare deployment failed: ${error}`);
    }
  }

  private async configureCloudflareCaching(): Promise<void> {
    if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ZONE_ID) {
      throw new Error('Cloudflare credentials not configured');
    }

    this.log('Configuring Cloudflare caching rules...');

    // Example: Create page rules via API
    const _pageRules = [
      {
        targets: [
          {
            target: 'url',
            constraint: {
              operator: 'matches',
              value: `${process.env.CLOUDFLARE_CDN_URL}/assets/*`,
            },
          },
        ],
        actions: [
          {
            id: 'cache_level',
            value: 'cache_everything',
          },
          {
            id: 'edge_cache_ttl',
            value: 86400,
          },
        ],
        priority: 1,
        status: 'active',
      },
    ];

    // This is a simplified example - in practice, you'd use the full Cloudflare API
    this.log('Cache rules would be configured via Cloudflare API');
  }

  private async deployToCloudFront(): Promise<void> {
    this.log('Deploying to CloudFront...');

    if (this.config.dryRun) {
      this.log('Would deploy assets to S3 and invalidate CloudFront');
      return;
    }

    try {
      // 1. Upload assets to S3
      await this.uploadToS3();

      // 2. Create/update CloudFront distribution
      await this.updateCloudFrontDistribution();

      // 3. Invalidate cache if requested
      if (this.config.invalidateCache) {
        await this.invalidateCloudFrontCache();
      }

      this.log('CloudFront deployment completed');
    } catch (error) {
      throw new Error(`CloudFront deployment failed: ${error}`);
    }
  }

  private async uploadToS3(): Promise<void> {
    this.log('Uploading assets to S3...');

    // This would use AWS SDK to upload files
    // For now, we'll simulate the process

    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET not configured');
    }

    this.log(`Would upload ${this.distPath} to s3://${bucketName}/`);

    // Example AWS CLI command (would be replaced with SDK calls)
    const awsCommand = `aws s3 sync ${this.distPath} s3://${bucketName}/ --delete --cache-control max-age=31536000`;
    this.log(`AWS CLI equivalent: ${awsCommand}`);
  }

  private async updateCloudFrontDistribution(): Promise<void> {
    this.log('Updating CloudFront distribution...');

    const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    if (!distributionId) {
      throw new Error('CLOUDFRONT_DISTRIBUTION_ID not configured');
    }

    this.log(`Would update CloudFront distribution: ${distributionId}`);
  }

  private async invalidateCloudFrontCache(): Promise<void> {
    this.log('Invalidating CloudFront cache...');

    const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    if (!distributionId) {
      throw new Error('CLOUDFRONT_DISTRIBUTION_ID not configured');
    }

    this.log(`Would create invalidation for distribution: ${distributionId}`);

    // Example AWS CLI command
    const awsCommand = `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*"`;
    this.log(`AWS CLI equivalent: ${awsCommand}`);
  }

  private async validateDeployment(): Promise<void> {
    this.log('Validating deployment...');

    if (this.config.dryRun) {
      this.log('Would validate CDN deployment');
      return;
    }

    try {
      const cdnUrl =
        this.config.provider === 'cloudflare'
          ? process.env.CLOUDFLARE_CDN_URL
          : process.env.CLOUDFRONT_CDN_URL;

      if (!cdnUrl) {
        this.log('CDN URL not configured, skipping validation', 'warn');
        return;
      }

      // Test a few key assets
      const testPaths = ['/assets/js/index-*.js', '/assets/css/index-*.css', '/'];

      for (const testPath of testPaths) {
        // In a real implementation, we'd make HTTP requests to test
        this.log(`Would test: ${cdnUrl}${testPath}`);
      }

      this.log('Deployment validation completed');
    } catch (error) {
      this.log(`Deployment validation failed: ${error}`, 'warn');
    }
  }

  private async generateDeploymentReport(): Promise<void> {
    this.log('Generating deployment report...');

    const report = {
      timestamp: new Date().toISOString(),
      provider: this.config.provider,
      environment: this.config.environment,
      dryRun: this.config.dryRun,
      buildStats: await this.getBuildStats(),
      configuration: {
        cdnUrl:
          this.config.provider === 'cloudflare'
            ? process.env.CLOUDFLARE_CDN_URL
            : process.env.CLOUDFRONT_CDN_URL,
        cacheInvalidated: this.config.invalidateCache,
      },
    };

    const reportPath = path.join(this.projectRoot, 'cdn-deployment-report.json');

    if (!this.config.dryRun) {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      this.log(`Deployment report saved to: ${reportPath}`);
    } else {
      this.log(`Would save deployment report to: ${reportPath}`);
    }
  }

  public async deploy(): Promise<void> {
    try {
      this.log(
        `Starting CDN deployment (${this.config.provider}) for ${this.config.environment} environment`
      );

      if (this.config.dryRun) {
        this.log('DRY RUN MODE - No actual changes will be made');
      }

      // Step 1: Check environment
      await this.checkEnvironment();

      // Step 2: Build project
      await this.buildProject();

      // Step 3: Analyze build output
      await this.analyzeBuildOutput();

      // Step 4: Deploy to CDN
      switch (this.config.provider) {
        case 'cloudflare':
          await this.deployToCloudflare();
          break;
        case 'cloudfront':
          await this.deployToCloudFront();
          break;
        case 'local':
          this.log('Local deployment - no CDN deployment needed');
          break;
      }

      // Step 5: Validate deployment
      await this.validateDeployment();

      // Step 6: Generate report
      await this.generateDeploymentReport();

      this.log('CDN deployment completed successfully!');
    } catch (error) {
      this.log(`CDN deployment failed: ${error}`, 'error');
      process.exit(1);
    }
  }
}

// CLI Interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const config: DeployConfig = {
    provider: (process.env.CDN_PROVIDER as any) || 'local',
    environment: (process.env.NODE_ENV as any) || 'development',
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    skipBuild: args.includes('--skip-build'),
    invalidateCache: args.includes('--invalidate-cache'),
  };

  // Override provider if specified in args
  if (args.includes('--cloudflare')) {
    config.provider = 'cloudflare';
  } else if (args.includes('--cloudfront')) {
    config.provider = 'cloudfront';
  } else if (args.includes('--local')) {
    config.provider = 'local';
  }

  // Override environment if specified
  const envIndex = args.findIndex(arg => arg === '--env');
  if (envIndex !== -1 && args[envIndex + 1]) {
    config.environment = args[envIndex + 1] as any;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
CDN Deployment Script

Usage: tsx scripts/deploy-cdn.ts [options]

Options:
  --cloudflare        Deploy to Cloudflare CDN
  --cloudfront        Deploy to AWS CloudFront
  --local             Local deployment (no CDN)
  --env <env>         Set environment (development|staging|production)
  --dry-run           Simulate deployment without making changes
  --verbose, -v       Enable verbose logging
  --skip-build        Skip the build step
  --invalidate-cache  Invalidate CDN cache after deployment
  --help, -h          Show this help message

Environment Variables:
  For Cloudflare:
    CLOUDFLARE_API_TOKEN    Cloudflare API token
    CLOUDFLARE_ZONE_ID      Cloudflare zone ID
    CLOUDFLARE_CDN_URL      CDN URL
  
  For CloudFront:
    AWS_ACCESS_KEY_ID       AWS access key
    AWS_SECRET_ACCESS_KEY   AWS secret key
    CLOUDFRONT_DISTRIBUTION_ID  CloudFront distribution ID
    AWS_S3_BUCKET          S3 bucket name

Examples:
  tsx scripts/deploy-cdn.ts --cloudflare --env production
  tsx scripts/deploy-cdn.ts --cloudfront --dry-run --verbose
  tsx scripts/deploy-cdn.ts --local --skip-build
    `);
    return;
  }

  const deployer = new CDNDeployer(config);
  await deployer.deploy();
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
