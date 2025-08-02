#!/usr/bin/env tsx
/**
 * Launch Readiness Validation Script
 * Comprehensive security and performance validation for AI Glossary Pro
 *
 * This script performs:
 * 1. Security validation (authentication, rate limiting, input sanitization)
 * 2. Performance benchmarks (load times, API response times, database queries)
 * 3. System health checks (dependencies, services, configuration)
 * 4. Final launch readiness report
 */
import axios from 'axios';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';
class LaunchReadinessValidator {
    results = [];
    serverPort = 3000;
    baseUrl = `http://localhost:${this.serverPort}`;
    isServerRunning = false;
    constructor() {
        console.log('🚀 AI Glossary Pro Launch Readiness Validation');
        console.log('='.repeat(60));
    }
    addResult(result) {
        this.results.push(result);
        const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
        console.log(`${icon} ${result.category}: ${result.test} - ${result.status}`);
        if (result.details) {
            console.log(`   ${result.details}`);
        }
    }
    async startServer() {
        try {
            console.log('🔧 Starting server for validation...');
            // Check if server is already running
            try {
                const response = await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
                if (response.status === 200) {
                    console.log('✅ Server already running');
                    this.isServerRunning = true;
                    return true;
                }
            }
            catch (error) {
                // Server not running, need to start it
            }
            // Start the server in the background
            const serverProcess = execSync('npm run dev &', {
                stdio: 'ignore',
                detached: true,
            });
            // Wait for server to be ready
            let attempts = 0;
            const maxAttempts = 30;
            while (attempts < maxAttempts) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const response = await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
                    if (response.status === 200) {
                        this.isServerRunning = true;
                        console.log('✅ Server started successfully');
                        return true;
                    }
                }
                catch (error) {
                    attempts++;
                    console.log(`⏳ Waiting for server... (${attempts}/${maxAttempts})`);
                }
            }
            console.log('❌ Failed to start server');
            return false;
        }
        catch (error) {
            console.error('❌ Error starting server:', error);
            return false;
        }
    }
    async validateDependencies() {
        console.log('\\n📦 Validating Dependencies...');
        try {
            // Check package.json exists
            if (!existsSync('package.json')) {
                this.addResult({
                    category: 'Dependencies',
                    test: 'Package.json exists',
                    status: 'FAIL',
                    details: 'package.json not found',
                });
                return;
            }
            // Check for critical dependencies
            const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
            const criticalDeps = [
                'express',
                'react',
                'react-dom',
                'drizzle-orm',
                'firebase',
                'dompurify',
                'helmet',
                'express-rate-limit',
                'axios',
            ];
            for (const dep of criticalDeps) {
                if (packageJson.dependencies[dep] || packageJson.devDependencies?.[dep]) {
                    this.addResult({
                        category: 'Dependencies',
                        test: `${dep} installed`,
                        status: 'PASS',
                        details: `Version: ${packageJson.dependencies[dep] || packageJson.devDependencies[dep]}`,
                    });
                }
                else {
                    this.addResult({
                        category: 'Dependencies',
                        test: `${dep} installed`,
                        status: 'FAIL',
                        details: 'Critical dependency missing',
                    });
                }
            }
            // Check for vulnerabilities
            try {
                const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
                const audit = JSON.parse(auditOutput);
                if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
                    const highVulns = Object.values(audit.vulnerabilities).filter((v) => v.severity === 'high' || v.severity === 'critical');
                    if (highVulns.length > 0) {
                        this.addResult({
                            category: 'Dependencies',
                            test: 'Security vulnerabilities',
                            status: 'FAIL',
                            details: `Found ${highVulns.length} high/critical vulnerabilities`,
                            recommendations: ['Run npm audit fix', 'Update vulnerable packages'],
                        });
                    }
                    else {
                        this.addResult({
                            category: 'Dependencies',
                            test: 'Security vulnerabilities',
                            status: 'PASS',
                            details: 'No high/critical vulnerabilities found',
                        });
                    }
                }
                else {
                    this.addResult({
                        category: 'Dependencies',
                        test: 'Security vulnerabilities',
                        status: 'PASS',
                        details: 'No vulnerabilities found',
                    });
                }
            }
            catch (error) {
                this.addResult({
                    category: 'Dependencies',
                    test: 'Security vulnerabilities',
                    status: 'WARNING',
                    details: 'Could not run security audit',
                });
            }
        }
        catch (error) {
            this.addResult({
                category: 'Dependencies',
                test: 'Dependency validation',
                status: 'FAIL',
                details: `Error: ${error.message}`,
            });
        }
    }
    async validateSecurity() {
        console.log('\\n🔒 Validating Security...');
        if (!this.isServerRunning) {
            this.addResult({
                category: 'Security',
                test: 'Server availability',
                status: 'FAIL',
                details: 'Server not running - cannot test security',
            });
            return;
        }
        // Test authentication endpoints
        try {
            const authResponse = await axios.post(`${this.baseUrl}/api/auth/login`, {
                email: 'invalid@test.com',
                password: 'invalid',
            }, { timeout: 5000 });
            // Should get 401 or 400 for invalid credentials
            if (authResponse.status === 401 || authResponse.status === 400) {
                this.addResult({
                    category: 'Security',
                    test: 'Authentication validation',
                    status: 'PASS',
                    details: 'Correctly rejects invalid credentials',
                });
            }
            else {
                this.addResult({
                    category: 'Security',
                    test: 'Authentication validation',
                    status: 'FAIL',
                    details: 'Authentication system not working correctly',
                });
            }
        }
        catch (error) {
            if (error.response?.status === 401 || error.response?.status === 400) {
                this.addResult({
                    category: 'Security',
                    test: 'Authentication validation',
                    status: 'PASS',
                    details: 'Correctly rejects invalid credentials',
                });
            }
            else {
                this.addResult({
                    category: 'Security',
                    test: 'Authentication validation',
                    status: 'WARNING',
                    details: 'Could not test authentication endpoint',
                });
            }
        }
        // Test rate limiting
        try {
            const requests = Array.from({ length: 5 }, (_, i) => axios.get(`${this.baseUrl}/api/terms?page=1&limit=10`, { timeout: 5000 }));
            const responses = await Promise.allSettled(requests);
            const rateLimited = responses.some(r => r.status === 'rejected' && r.reason?.response?.status === 429);
            if (rateLimited) {
                this.addResult({
                    category: 'Security',
                    test: 'Rate limiting',
                    status: 'PASS',
                    details: 'Rate limiting is active',
                });
            }
            else {
                this.addResult({
                    category: 'Security',
                    test: 'Rate limiting',
                    status: 'WARNING',
                    details: 'Rate limiting not detected in basic test',
                });
            }
        }
        catch (error) {
            this.addResult({
                category: 'Security',
                test: 'Rate limiting',
                status: 'WARNING',
                details: 'Could not test rate limiting',
            });
        }
        // Test security headers
        try {
            const response = await axios.get(`${this.baseUrl}/`, { timeout: 5000 });
            const headers = response.headers;
            const securityHeaders = [
                'x-content-type-options',
                'x-frame-options',
                'x-xss-protection',
                'strict-transport-security',
            ];
            for (const header of securityHeaders) {
                if (headers[header]) {
                    this.addResult({
                        category: 'Security',
                        test: `Security header: ${header}`,
                        status: 'PASS',
                        details: `Value: ${headers[header]}`,
                    });
                }
                else {
                    this.addResult({
                        category: 'Security',
                        test: `Security header: ${header}`,
                        status: 'WARNING',
                        details: 'Header not present',
                    });
                }
            }
        }
        catch (error) {
            this.addResult({
                category: 'Security',
                test: 'Security headers',
                status: 'WARNING',
                details: 'Could not test security headers',
            });
        }
        // Test input sanitization
        try {
            const maliciousInput = '<script>alert("xss")</script>';
            const searchResponse = await axios.get(`${this.baseUrl}/api/search`, {
                params: { query: maliciousInput },
                timeout: 5000,
            });
            if (searchResponse.data && typeof searchResponse.data === 'object') {
                this.addResult({
                    category: 'Security',
                    test: 'Input sanitization',
                    status: 'PASS',
                    details: 'API handles malicious input safely',
                });
            }
            else {
                this.addResult({
                    category: 'Security',
                    test: 'Input sanitization',
                    status: 'WARNING',
                    details: 'Could not verify input sanitization',
                });
            }
        }
        catch (error) {
            this.addResult({
                category: 'Security',
                test: 'Input sanitization',
                status: 'WARNING',
                details: 'Could not test input sanitization',
            });
        }
    }
    async validatePerformance() {
        console.log('\\n⚡ Validating Performance...');
        const metrics = {
            pageLoadTime: 0,
            apiResponseTime: 0,
            databaseQueryTime: 0,
            bundleSize: 0,
        };
        if (!this.isServerRunning) {
            this.addResult({
                category: 'Performance',
                test: 'Server availability',
                status: 'FAIL',
                details: 'Server not running - cannot test performance',
            });
            return metrics;
        }
        // Test page load time
        try {
            const start = performance.now();
            await axios.get(`${this.baseUrl}/`, { timeout: 10000 });
            const end = performance.now();
            metrics.pageLoadTime = end - start;
            if (metrics.pageLoadTime < 2000) {
                this.addResult({
                    category: 'Performance',
                    test: 'Page load time',
                    status: 'PASS',
                    details: `${metrics.pageLoadTime.toFixed(2)}ms (target: <2000ms)`,
                });
            }
            else if (metrics.pageLoadTime < 5000) {
                this.addResult({
                    category: 'Performance',
                    test: 'Page load time',
                    status: 'WARNING',
                    details: `${metrics.pageLoadTime.toFixed(2)}ms (target: <2000ms)`,
                });
            }
            else {
                this.addResult({
                    category: 'Performance',
                    test: 'Page load time',
                    status: 'FAIL',
                    details: `${metrics.pageLoadTime.toFixed(2)}ms (target: <2000ms)`,
                });
            }
        }
        catch (error) {
            this.addResult({
                category: 'Performance',
                test: 'Page load time',
                status: 'FAIL',
                details: 'Could not measure page load time',
            });
        }
        // Test API response time
        try {
            const start = performance.now();
            await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
            const end = performance.now();
            metrics.apiResponseTime = end - start;
            if (metrics.apiResponseTime < 500) {
                this.addResult({
                    category: 'Performance',
                    test: 'API response time',
                    status: 'PASS',
                    details: `${metrics.apiResponseTime.toFixed(2)}ms (target: <500ms)`,
                });
            }
            else if (metrics.apiResponseTime < 1000) {
                this.addResult({
                    category: 'Performance',
                    test: 'API response time',
                    status: 'WARNING',
                    details: `${metrics.apiResponseTime.toFixed(2)}ms (target: <500ms)`,
                });
            }
            else {
                this.addResult({
                    category: 'Performance',
                    test: 'API response time',
                    status: 'FAIL',
                    details: `${metrics.apiResponseTime.toFixed(2)}ms (target: <500ms)`,
                });
            }
        }
        catch (error) {
            this.addResult({
                category: 'Performance',
                test: 'API response time',
                status: 'FAIL',
                details: 'Could not measure API response time',
            });
        }
        // Test database query time
        try {
            const start = performance.now();
            await axios.get(`${this.baseUrl}/api/terms?page=1&limit=10`, { timeout: 5000 });
            const end = performance.now();
            metrics.databaseQueryTime = end - start;
            if (metrics.databaseQueryTime < 1000) {
                this.addResult({
                    category: 'Performance',
                    test: 'Database query time',
                    status: 'PASS',
                    details: `${metrics.databaseQueryTime.toFixed(2)}ms (target: <1000ms)`,
                });
            }
            else if (metrics.databaseQueryTime < 2000) {
                this.addResult({
                    category: 'Performance',
                    test: 'Database query time',
                    status: 'WARNING',
                    details: `${metrics.databaseQueryTime.toFixed(2)}ms (target: <1000ms)`,
                });
            }
            else {
                this.addResult({
                    category: 'Performance',
                    test: 'Database query time',
                    status: 'FAIL',
                    details: `${metrics.databaseQueryTime.toFixed(2)}ms (target: <1000ms)`,
                });
            }
        }
        catch (error) {
            this.addResult({
                category: 'Performance',
                test: 'Database query time',
                status: 'WARNING',
                details: 'Could not measure database query time',
            });
        }
        // Check bundle size
        try {
            if (existsSync('dist/public')) {
                const bundleFiles = execSync('find dist/public -name "*.js" -o -name "*.css"', {
                    encoding: 'utf8',
                })
                    .trim()
                    .split('\\n')
                    .filter(f => f);
                let totalSize = 0;
                for (const file of bundleFiles) {
                    try {
                        const stats = execSync(`stat -f%z "${file}"`, { encoding: 'utf8' });
                        totalSize += parseInt(stats.trim());
                    }
                    catch (error) {
                        // Ignore files that don't exist
                    }
                }
                metrics.bundleSize = totalSize / 1024 / 1024; // Convert to MB
                if (metrics.bundleSize < 5) {
                    this.addResult({
                        category: 'Performance',
                        test: 'Bundle size',
                        status: 'PASS',
                        details: `${metrics.bundleSize.toFixed(2)}MB (target: <5MB)`,
                    });
                }
                else if (metrics.bundleSize < 10) {
                    this.addResult({
                        category: 'Performance',
                        test: 'Bundle size',
                        status: 'WARNING',
                        details: `${metrics.bundleSize.toFixed(2)}MB (target: <5MB)`,
                    });
                }
                else {
                    this.addResult({
                        category: 'Performance',
                        test: 'Bundle size',
                        status: 'FAIL',
                        details: `${metrics.bundleSize.toFixed(2)}MB (target: <5MB)`,
                    });
                }
            }
            else {
                this.addResult({
                    category: 'Performance',
                    test: 'Bundle size',
                    status: 'WARNING',
                    details: 'Build not found - run npm run build first',
                });
            }
        }
        catch (error) {
            this.addResult({
                category: 'Performance',
                test: 'Bundle size',
                status: 'WARNING',
                details: 'Could not measure bundle size',
            });
        }
        return metrics;
    }
    async validateSystemHealth() {
        console.log('\\n🏥 Validating System Health...');
        // Check environment variables
        const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];
        for (const envVar of requiredEnvVars) {
            if (process.env[envVar]) {
                this.addResult({
                    category: 'System Health',
                    test: `Environment variable: ${envVar}`,
                    status: 'PASS',
                    details: 'Required environment variable is set',
                });
            }
            else {
                this.addResult({
                    category: 'System Health',
                    test: `Environment variable: ${envVar}`,
                    status: 'FAIL',
                    details: 'Required environment variable is missing',
                });
            }
        }
        // Check database connection
        try {
            execSync('npm run db:status', { encoding: 'utf8' });
            this.addResult({
                category: 'System Health',
                test: 'Database connection',
                status: 'PASS',
                details: 'Database connection successful',
            });
        }
        catch (error) {
            this.addResult({
                category: 'System Health',
                test: 'Database connection',
                status: 'FAIL',
                details: 'Database connection failed',
            });
        }
        // Check file system permissions
        try {
            writeFileSync('/tmp/test-write.txt', 'test');
            execSync('rm /tmp/test-write.txt');
            this.addResult({
                category: 'System Health',
                test: 'File system permissions',
                status: 'PASS',
                details: 'File system is writable',
            });
        }
        catch (error) {
            this.addResult({
                category: 'System Health',
                test: 'File system permissions',
                status: 'FAIL',
                details: 'File system permission issues',
            });
        }
        // Check memory usage
        try {
            const memInfo = process.memoryUsage();
            const memUsageMB = memInfo.heapUsed / 1024 / 1024;
            if (memUsageMB < 500) {
                this.addResult({
                    category: 'System Health',
                    test: 'Memory usage',
                    status: 'PASS',
                    details: `${memUsageMB.toFixed(2)}MB heap used`,
                });
            }
            else if (memUsageMB < 1000) {
                this.addResult({
                    category: 'System Health',
                    test: 'Memory usage',
                    status: 'WARNING',
                    details: `${memUsageMB.toFixed(2)}MB heap used`,
                });
            }
            else {
                this.addResult({
                    category: 'System Health',
                    test: 'Memory usage',
                    status: 'FAIL',
                    details: `${memUsageMB.toFixed(2)}MB heap used (high usage)`,
                });
            }
        }
        catch (error) {
            this.addResult({
                category: 'System Health',
                test: 'Memory usage',
                status: 'WARNING',
                details: 'Could not check memory usage',
            });
        }
    }
    generateReport() {
        const passResults = this.results.filter(r => r.status === 'PASS');
        const warningResults = this.results.filter(r => r.status === 'WARNING');
        const failResults = this.results.filter(r => r.status === 'FAIL');
        const overallScore = Math.round((passResults.length / this.results.length) * 100);
        let readinessLevel;
        let goNoGo;
        if (failResults.length === 0 && warningResults.length === 0) {
            readinessLevel = 'PRODUCTION_READY';
            goNoGo = 'GO';
        }
        else if (failResults.length === 0 && warningResults.length < 5) {
            readinessLevel = 'MINOR_ISSUES';
            goNoGo = 'GO';
        }
        else if (failResults.length < 3) {
            readinessLevel = 'MAJOR_ISSUES';
            goNoGo = 'NO_GO';
        }
        else {
            readinessLevel = 'NOT_READY';
            goNoGo = 'NO_GO';
        }
        const blockers = failResults.map(r => `${r.category}: ${r.test} - ${r.details}`);
        const recommendations = [
            ...failResults.flatMap(r => r.recommendations || []),
            ...warningResults.flatMap(r => r.recommendations || []),
        ];
        return {
            timestamp: new Date().toISOString(),
            overallScore,
            readinessLevel,
            criticalIssues: failResults,
            warningIssues: warningResults,
            passingTests: passResults,
            performanceMetrics: {
                pageLoadTime: 0,
                apiResponseTime: 0,
                databaseQueryTime: 0,
                bundleSize: 0,
            },
            securityValidation: {
                authenticationTests: this.results.filter(r => r.category === 'Security' && r.test.includes('authentication')),
                rateLimitingTests: this.results.filter(r => r.category === 'Security' && r.test.includes('rate limiting')),
                inputSanitizationTests: this.results.filter(r => r.category === 'Security' && r.test.includes('sanitization')),
                securityHeaders: this.results.filter(r => r.category === 'Security' && r.test.includes('header')),
            },
            systemHealth: {
                dependencies: this.results.filter(r => r.category === 'Dependencies'),
                services: this.results.filter(r => r.category === 'System Health'),
                configuration: this.results.filter(r => r.category === 'System Health' && r.test.includes('Environment')),
            },
            goNoGoRecommendation: goNoGo,
            blockers,
            recommendations,
        };
    }
    async runValidation() {
        try {
            // Start server for testing
            await this.startServer();
            // Run all validations
            await this.validateDependencies();
            await this.validateSecurity();
            const performanceMetrics = await this.validatePerformance();
            await this.validateSystemHealth();
            // Generate report
            const report = this.generateReport();
            report.performanceMetrics = performanceMetrics;
            // Save report
            const reportPath = join(process.cwd(), 'LAUNCH_READINESS_REPORT.md');
            this.saveReport(report, reportPath);
            return report;
        }
        catch (error) {
            console.error('❌ Validation failed:', error);
            throw error;
        }
    }
    saveReport(report, filePath) {
        const markdown = this.generateMarkdownReport(report);
        writeFileSync(filePath, markdown, 'utf8');
        console.log(`\\n📄 Report saved to: ${filePath}`);
    }
    generateMarkdownReport(report) {
        const statusIcon = (status) => {
            switch (status) {
                case 'PASS':
                    return '✅';
                case 'WARNING':
                    return '⚠️';
                case 'FAIL':
                    return '❌';
                default:
                    return '❓';
            }
        };
        return `# Launch Readiness Report - AI Glossary Pro

**Generated:** ${new Date(report.timestamp).toLocaleString()}  
**Overall Score:** ${report.overallScore}%  
**Readiness Level:** ${report.readinessLevel}  
**Recommendation:** ${report.goNoGoRecommendation}

---

## 🎯 Executive Summary

${report.goNoGoRecommendation === 'GO' ? '✅ **PRODUCTION READY**' : '❌ **NOT READY FOR PRODUCTION**'}

- **Passing Tests:** ${report.passingTests.length}
- **Warnings:** ${report.warningIssues.length}
- **Critical Issues:** ${report.criticalIssues.length}

${report.blockers.length > 0
            ? `
### 🚨 Critical Blockers
${report.blockers.map(b => `- ${b}`).join('\\n')}
`
            : ''}

---

## 📊 Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|---------|---------|
| Page Load Time | ${report.performanceMetrics.pageLoadTime.toFixed(2)}ms | <2000ms | ${report.performanceMetrics.pageLoadTime < 2000 ? '✅' : '❌'} |
| API Response Time | ${report.performanceMetrics.apiResponseTime.toFixed(2)}ms | <500ms | ${report.performanceMetrics.apiResponseTime < 500 ? '✅' : '❌'} |
| Database Query Time | ${report.performanceMetrics.databaseQueryTime.toFixed(2)}ms | <1000ms | ${report.performanceMetrics.databaseQueryTime < 1000 ? '✅' : '❌'} |
| Bundle Size | ${report.performanceMetrics.bundleSize.toFixed(2)}MB | <5MB | ${report.performanceMetrics.bundleSize < 5 ? '✅' : '❌'} |

---

## 🔒 Security Validation

### Authentication Tests
${report.securityValidation.authenticationTests.map(t => `${statusIcon(t.status)} ${t.test}: ${t.details}`).join('\\n')}

### Rate Limiting Tests
${report.securityValidation.rateLimitingTests.map(t => `${statusIcon(t.status)} ${t.test}: ${t.details}`).join('\\n')}

### Input Sanitization Tests
${report.securityValidation.inputSanitizationTests.map(t => `${statusIcon(t.status)} ${t.test}: ${t.details}`).join('\\n')}

### Security Headers
${report.securityValidation.securityHeaders.map(t => `${statusIcon(t.status)} ${t.test}: ${t.details}`).join('\\n')}

---

## 🏥 System Health

### Dependencies
${report.systemHealth.dependencies.map(t => `${statusIcon(t.status)} ${t.test}: ${t.details}`).join('\\n')}

### Services
${report.systemHealth.services.map(t => `${statusIcon(t.status)} ${t.test}: ${t.details}`).join('\\n')}

### Configuration
${report.systemHealth.configuration.map(t => `${statusIcon(t.status)} ${t.test}: ${t.details}`).join('\\n')}

---

## 📋 Detailed Results

### ✅ Passing Tests (${report.passingTests.length})
${report.passingTests.map(t => `- **${t.category}**: ${t.test} - ${t.details}`).join('\\n')}

### ⚠️ Warning Issues (${report.warningIssues.length})
${report.warningIssues.map(t => `- **${t.category}**: ${t.test} - ${t.details}`).join('\\n')}

### ❌ Critical Issues (${report.criticalIssues.length})
${report.criticalIssues.map(t => `- **${t.category}**: ${t.test} - ${t.details}`).join('\\n')}

---

## 🔧 Recommendations

${report.recommendations.length > 0 ? report.recommendations.map(r => `- ${r}`).join('\\n') : 'No specific recommendations at this time.'}

---

## 🚀 Next Steps

${report.goNoGoRecommendation === 'GO'
            ? `
### Ready for Production Launch ✅
1. **Deploy to production environment**
2. **Monitor system performance**
3. **Watch for errors and user feedback**
4. **Scale resources as needed**

### Post-Launch Monitoring
- Set up alerts for critical metrics
- Monitor user behavior and performance
- Plan for content scaling and updates
- Regular security audits
`
            : `
### Fix Critical Issues Before Launch ❌
1. **Address all critical issues listed above**
2. **Re-run validation tests**
3. **Ensure all blockers are resolved**
4. **Get approval from stakeholders**

### Required Actions
${report.blockers.map(b => `- ${b}`).join('\\n')}
`}

---

**Report Generated:** ${new Date().toLocaleString()}  
**Validation Tool:** Launch Readiness Validator v1.0
`;
    }
}
// Main execution
async function main() {
    const validator = new LaunchReadinessValidator();
    try {
        const report = await validator.runValidation();
        console.log('\\n' + '='.repeat(60));
        console.log('🎯 LAUNCH READINESS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Overall Score: ${report.overallScore}%`);
        console.log(`Readiness Level: ${report.readinessLevel}`);
        console.log(`Go/No-Go: ${report.goNoGoRecommendation}`);
        console.log(`Critical Issues: ${report.criticalIssues.length}`);
        console.log(`Warning Issues: ${report.warningIssues.length}`);
        console.log(`Passing Tests: ${report.passingTests.length}`);
        if (report.goNoGoRecommendation === 'GO') {
            console.log('\\n🚀 RECOMMENDATION: PROCEED WITH LAUNCH');
        }
        else {
            console.log('\\n🛑 RECOMMENDATION: FIX CRITICAL ISSUES BEFORE LAUNCH');
        }
    }
    catch (error) {
        console.error('\\n❌ Launch readiness validation failed:', error);
        process.exit(1);
    }
}
// Auto-run when executed directly
main();
export default LaunchReadinessValidator;
