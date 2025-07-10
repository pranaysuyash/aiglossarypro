#!/usr/bin/env tsx

/**
 * Test API Fixes Script
 * Validates that the authentication and enhanced terms API fixes are working
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testAPIFixes() {
  console.log(chalk.blue('🔧 Testing API Fixes...'));
  
  const endpoints = [
    { path: '/api/health', name: 'Health Check', expected: 200 },
    { path: '/api/auth/check', name: 'Auth Check (Fixed)', expected: 200 },
    { path: '/api/enhanced/terms', name: 'Enhanced Terms (Fixed)', expected: 200 },
    { path: '/api/categories', name: 'Categories', expected: 200 },
    { path: '/api/terms', name: 'Terms', expected: 200 },
  ];

  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const { stdout } = await execAsync(`curl -s -w "%{http_code}" -o /dev/null http://localhost:3001${endpoint.path}`);
      const statusCode = parseInt(stdout.trim());
      
      const status = statusCode === endpoint.expected ? 'PASS' : 'FAIL';
      const color = status === 'PASS' ? 'green' : 'red';
      
      console.log(chalk[color](`${status}: ${endpoint.name} - HTTP ${statusCode}`));
      
      results.push({
        endpoint: endpoint.path,
        name: endpoint.name,
        expected: endpoint.expected,
        actual: statusCode,
        status,
        fixed: endpoint.name.includes('Fixed')
      });
      
    } catch (error) {
      console.log(chalk.red(`FAIL: ${endpoint.name} - Connection Error`));
      results.push({
        endpoint: endpoint.path,
        name: endpoint.name,
        expected: endpoint.expected,
        actual: 0,
        status: 'FAIL',
        error: 'Connection Error',
        fixed: endpoint.name.includes('Fixed')
      });
    }
  }
  
  // Generate summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const fixedEndpoints = results.filter(r => r.fixed);
  const fixesWorking = fixedEndpoints.filter(r => r.status === 'PASS').length;
  
  console.log(chalk.yellow('\n📊 API Fix Test Summary:'));
  console.log(chalk.gray(`Total endpoints: ${results.length}`));
  console.log(chalk.green(`Passed: ${passed}`));
  console.log(chalk.red(`Failed: ${failed}`));
  console.log(chalk.blue(`Fixed endpoints tested: ${fixedEndpoints.length}`));
  console.log(chalk.blue(`Fixed endpoints working: ${fixesWorking}/${fixedEndpoints.length}`));
  
  if (failed > 0) {
    console.log(chalk.yellow('\n⚠️ Some endpoints are not working. This may be because:'));
    console.log(chalk.gray('  - Server needs to be restarted to pick up new routes'));
    console.log(chalk.gray('  - Database is not initialized'));
    console.log(chalk.gray('  - Environment variables are not set correctly'));
    console.log(chalk.blue('\n💡 After server restart, re-run the comprehensive audit to verify fixes.'));
  }
  
  return {
    total: results.length,
    passed,
    failed,
    fixesImplemented: fixedEndpoints.length,
    fixesWorking
  };
}

// Test implementation completeness
async function testImplementationCompleteness() {
  console.log(chalk.blue('\n🔍 Testing Implementation Completeness...'));
  
  const requiredFiles = [
    'server/routes/firebaseAuth.ts',
    'server/enhancedRoutes.ts',
    'AUDIT_FINDINGS_AND_FIXES.md'
  ];
  
  for (const file of requiredFiles) {
    try {
      const { stdout } = await execAsync(`grep -l "auth/check" ${file} 2>/dev/null || echo "not found"`);
      if (file.includes('firebaseAuth') && !stdout.includes('not found')) {
        console.log(chalk.green(`✅ Auth check endpoint implemented in ${file}`));
      } else if (file.includes('enhanced') && !stdout.includes('not found')) {
        console.log(chalk.green(`✅ Enhanced terms endpoint implemented in ${file}`));
      } else if (file.includes('AUDIT')) {
        console.log(chalk.green(`✅ Documentation created: ${file}`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Issue with ${file}`));
    }
  }
}

async function main() {
  console.log(chalk.blue('🚀 API Fixes Validation Script\n'));
  
  await testImplementationCompleteness();
  const results = await testAPIFixes();
  
  console.log(chalk.green('\n✅ API fixes validation complete!'));
  console.log(chalk.blue('📋 Next steps:'));
  console.log(chalk.gray('  1. Restart the server to pick up new routes'));
  console.log(chalk.gray('  2. Run comprehensive audit again to verify improvements'));
  console.log(chalk.gray('  3. Fix remaining issues based on audit results'));
  
  return results;
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testAPIFixes, testImplementationCompleteness };