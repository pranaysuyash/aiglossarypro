#!/usr/bin/env node

import { config } from 'dotenv';
import { join } from 'path';
import chalk from 'chalk';
import { createMonitoredPool } from '../db/pool-monitor';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  console.error(chalk.red('❌ DATABASE_URL environment variable is not set'));
  process.exit(1);
}

// Create a monitored pool
const pool = createMonitoredPool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
});

// Clear console and display header
console.clear();
console.log(chalk.cyan.bold('=== Database Connection Pool Monitor ===\n'));

// Display metrics
function displayMetrics() {
  const stats = pool.getStats();
  const healthColor = stats.healthStatus === 'healthy' ? chalk.green :
                     stats.healthStatus === 'degraded' ? chalk.yellow : chalk.red;
  
  console.clear();
  console.log(chalk.cyan.bold('=== Database Connection Pool Monitor ==='));
  console.log(chalk.gray(`Last Update: ${new Date().toLocaleString()}\n`));
  
  console.log(chalk.white.bold('Connection Statistics:'));
  console.log(`  ${chalk.blue('Total Connections:')} ${stats.totalConnections}`);
  console.log(`  ${chalk.blue('Idle Connections:')} ${stats.idleConnections}`);
  console.log(`  ${chalk.blue('Waiting Requests:')} ${stats.waitingRequests}`);
  console.log(`  ${chalk.blue('Peak Connections:')} ${stats.peakConnections}`);
  
  console.log(chalk.white.bold('\nLifetime Statistics:'));
  console.log(`  ${chalk.green('Total Created:')} ${stats.totalCreated}`);
  console.log(`  ${chalk.red('Total Destroyed:')} ${stats.totalDestroyed}`);
  
  console.log(chalk.white.bold('\nPerformance Metrics:'));
  console.log(`  ${chalk.blue('Avg Acquire Time:')} ${stats.avgAcquireTime.toFixed(2)}ms`);
  console.log(`  ${chalk.blue('Last Activity:')} ${stats.lastActivity.toLocaleTimeString()}`);
  
  console.log(chalk.white.bold('\nHealth Status:'));
  console.log(`  ${healthColor('● ' + stats.healthStatus.toUpperCase())}`);
  
  // Recommendations
  const recommended = pool.getRecommendedPoolSize();
  const currentMax = parseInt(process.env.DB_POOL_MAX || '20');
  
  if (recommended.max !== currentMax) {
    console.log(chalk.yellow.bold('\nRecommendations:'));
    console.log(`  Consider adjusting pool size: min=${recommended.min}, max=${recommended.max}`);
  }
  
  // Warnings
  if (stats.waitingRequests > 5) {
    console.log(chalk.red.bold('\n⚠️  Warning: High number of waiting requests!'));
  }
  
  if (stats.avgAcquireTime > 500) {
    console.log(chalk.red.bold('⚠️  Warning: High average connection acquire time!'));
  }
  
  console.log(chalk.gray('\nPress Ctrl+C to exit...'));
}

// Initial display
displayMetrics();

// Update every 2 seconds
const interval = setInterval(displayMetrics, 2000);

// Listen for metrics events
pool.onMetrics((metrics) => {
  // Could log to file or send to monitoring service
  if (metrics.healthStatus !== 'healthy') {
    console.log(chalk.red(`\n🚨 Alert: Pool health degraded to ${metrics.healthStatus}`));
  }
});

// Simulate some load for testing (optional)
if (process.argv.includes('--test-load')) {
  console.log(chalk.yellow('\n🔄 Running test load...'));
  
  async function runQuery() {
    const client = await pool.connect();
    try {
      await client.query('SELECT pg_sleep(0.1)'); // Simulate 100ms query
    } finally {
      client.release();
    }
  }
  
  // Run multiple concurrent queries
  setInterval(() => {
    for (let i = 0; i < 5; i++) {
      runQuery().catch(console.error);
    }
  }, 1000);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\nShutting down...'));
  clearInterval(interval);
  await pool.end();
  process.exit(0);
});

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Unhandled error:'), error);
  process.exit(1);
});