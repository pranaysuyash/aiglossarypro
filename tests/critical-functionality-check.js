import chalk from 'chalk';
import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';
class CriticalFunctionalityChecker {
    results = [];
    async runTest(testName, testFn) {
        try {
            console.log(chalk.yellow(`Testing: ${testName}...`));
            const result = await testFn();
            this.results.push({ test: testName, ...result });
            const icon = result.status === 'pass' ? '✓' : result.status === 'warn' ? '⚠' : '✗';
            const color = result.status === 'pass' ? chalk.green : result.status === 'warn' ? chalk.yellow : chalk.red;
            console.log(color(`${icon} ${testName}`));
            if (result.details) {
                console.log(chalk.gray(`  ${result.details}`));
            }
        }
        catch (error) {
            this.results.push({
                test: testName,
                status: 'fail',
                details: error instanceof Error ? error.message : String(error)
            });
            console.log(chalk.red(`✗ ${testName}`));
            console.log(chalk.gray(`  Error: ${error}`));
        }
    }
    async checkServers() {
        console.log(chalk.blue('\n🔍 CHECKING SERVER AVAILABILITY\n'));
        await this.runTest('Backend Server', async () => {
            try {
                const response = await fetch(`${API_URL}/api/health`);
                if (response.ok) {
                    return { status: 'pass', details: `Server running on port 3000` };
                }
                return { status: 'warn', details: `Server responded with status ${response.status}` };
            }
            catch (error) {
                return { status: 'fail', details: 'Backend server not reachable' };
            }
        });
        await this.runTest('Frontend Server', async () => {
            try {
                const response = await fetch(BASE_URL);
                if (response.ok) {
                    return { status: 'pass', details: `Frontend running on port 5173` };
                }
                return { status: 'warn', details: `Frontend responded with status ${response.status}` };
            }
            catch (error) {
                return { status: 'fail', details: 'Frontend server not reachable' };
            }
        });
    }
    async checkAPIEndpoints() {
        console.log(chalk.blue('\n🔍 CHECKING API ENDPOINTS\n'));
        // Public endpoints
        await this.runTest('Terms API', async () => {
            const response = await fetch(`${API_URL}/api/terms?limit=5`);
            const data = await response.json();
            if (response.ok && data.success) {
                return { status: 'pass', details: `Returned ${data.data?.length || 0} terms` };
            }
            return { status: 'fail', details: `API error: ${data.message || response.statusText}` };
        });
        await this.runTest('Categories API', async () => {
            const response = await fetch(`${API_URL}/api/categories`);
            const data = await response.json();
            if (response.ok && data.success) {
                return { status: 'pass', details: `Returned ${data.data?.length || 0} categories` };
            }
            return { status: 'fail', details: `API error: ${data.message || response.statusText}` };
        });
        await this.runTest('Search API', async () => {
            const response = await fetch(`${API_URL}/api/search?q=machine+learning&limit=5`);
            const data = await response.json();
            if (response.ok && data.success) {
                return { status: 'pass', details: `Found ${data.data?.length || 0} results` };
            }
            return { status: 'fail', details: `API error: ${data.message || response.statusText}` };
        });
        await this.runTest('Stats API', async () => {
            const response = await fetch(`${API_URL}/api/stats`);
            const data = await response.json();
            if (response.ok && data.success) {
                return {
                    status: 'pass',
                    details: `Total terms: ${data.data?.totalTerms || 0}, Categories: ${data.data?.totalCategories || 0}`
                };
            }
            return { status: 'fail', details: `API error: ${data.message || response.statusText}` };
        });
    }
    async checkAuthentication() {
        console.log(chalk.blue('\n🔍 CHECKING AUTHENTICATION SYSTEM\n'));
        await this.runTest('Auth Providers Status', async () => {
            const response = await fetch(`${API_URL}/api/auth/providers`);
            const data = await response.json();
            if (response.ok && data.success) {
                const providers = data.data;
                const enabledProviders = Object.entries(providers)
                    .filter(([_, enabled]) => enabled)
                    .map(([name]) => name);
                return {
                    status: enabledProviders.length > 0 ? 'pass' : 'warn',
                    details: `Enabled: ${enabledProviders.join(', ') || 'None'}`
                };
            }
            return { status: 'fail', details: 'Could not fetch auth providers' };
        });
        await this.runTest('Protected Route Check', async () => {
            const response = await fetch(`${API_URL}/api/auth/user`);
            if (response.status === 401) {
                return { status: 'pass', details: 'Protected routes return 401 when unauthenticated' };
            }
            return { status: 'warn', details: `Unexpected status: ${response.status}` };
        });
    }
    async checkDatabase() {
        console.log(chalk.blue('\n🔍 CHECKING DATABASE CONNECTION\n'));
        await this.runTest('Database Connectivity', async () => {
            try {
                const [termsRes, categoriesRes] = await Promise.all([
                    fetch(`${API_URL}/api/terms?limit=1`),
                    fetch(`${API_URL}/api/categories?limit=1`)
                ]);
                if (termsRes.ok && categoriesRes.ok) {
                    return { status: 'pass', details: 'Database queries successful' };
                }
                return { status: 'fail', details: 'Database queries failed' };
            }
            catch (error) {
                return { status: 'fail', details: 'Cannot connect to database' };
            }
        });
    }
    async checkSecurity() {
        console.log(chalk.blue('\n🔍 CHECKING SECURITY FEATURES\n'));
        await this.runTest('Rate Limiting', async () => {
            let hitLimit = false;
            for (let i = 0; i < 50; i++) {
                const response = await fetch(`${API_URL}/api/terms?limit=1`);
                if (response.status === 429) {
                    hitLimit = true;
                    return { status: 'pass', details: `Rate limit triggered after ${i} requests` };
                }
            }
            return { status: 'warn', details: 'Rate limit not triggered in 50 requests' };
        });
        await this.runTest('CORS Configuration', async () => {
            const response = await fetch(`${API_URL}/api/health`);
            const corsHeader = response.headers.get('access-control-allow-origin');
            if (corsHeader) {
                return { status: 'pass', details: `CORS enabled for: ${corsHeader}` };
            }
            return { status: 'warn', details: 'No CORS headers found' };
        });
    }
    printManualTestChecklist() {
        console.log(chalk.blue('\n📋 MANUAL TEST CHECKLIST\n'));
        const manualTests = {
            'Authentication': [
                '[ ] Login with email/password (all user types)',
                '[ ] Login with Google OAuth',
                '[ ] Login with GitHub OAuth',
                '[ ] Logout functionality works',
                '[ ] Cross-tab logout synchronization',
                '[ ] Session persists on page refresh',
                '[ ] Invalid credentials show error'
            ],
            'Access Control': [
                '[ ] Free user sees 5-term daily limit',
                '[ ] Premium user has unlimited access',
                '[ ] Admin can access admin dashboard',
                '[ ] Non-admin users cannot see admin links',
                '[ ] Upgrade prompts show for free users'
            ],
            'Core Features': [
                '[ ] Search functionality works',
                '[ ] Search suggestions appear',
                '[ ] Category navigation works',
                '[ ] Term detail pages load',
                '[ ] Code examples render properly',
                '[ ] Related terms show up',
                '[ ] Favorites can be added/removed',
                '[ ] Progress tracking updates'
            ],
            'Mobile Experience': [
                '[ ] Mobile menu works',
                '[ ] Touch interactions work',
                '[ ] Responsive layout adjusts',
                '[ ] PWA install banner appears'
            ],
            'Payment Flow': [
                '[ ] Pricing page displays',
                '[ ] Upgrade buttons work',
                '[ ] Gumroad integration loads',
                '[ ] Premium status reflects after purchase'
            ],
            'Error Handling': [
                '[ ] 404 page shows for invalid routes',
                '[ ] Network errors handled gracefully',
                '[ ] Form validation works',
                '[ ] API errors show user-friendly messages'
            ]
        };
        Object.entries(manualTests).forEach(([category, tests]) => {
            console.log(chalk.yellow(`\n${category}:`));
            tests.forEach(test => console.log(`  ${test}`));
        });
    }
    async generateReport() {
        console.log(chalk.blue('\n📊 TEST SUMMARY\n'));
        const passed = this.results.filter(r => r.status === 'pass').length;
        const warned = this.results.filter(r => r.status === 'warn').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const total = this.results.length;
        console.log(`Total automated checks: ${total}`);
        console.log(chalk.green(`Passed: ${passed}`));
        console.log(chalk.yellow(`Warnings: ${warned}`));
        console.log(chalk.red(`Failed: ${failed}`));
        if (failed > 0) {
            console.log(chalk.red('\n❌ Failed Tests:'));
            this.results
                .filter(r => r.status === 'fail')
                .forEach(r => {
                console.log(chalk.red(`  - ${r.test}: ${r.details}`));
            });
        }
        if (warned > 0) {
            console.log(chalk.yellow('\n⚠️  Warnings:'));
            this.results
                .filter(r => r.status === 'warn')
                .forEach(r => {
                console.log(chalk.yellow(`  - ${r.test}: ${r.details}`));
            });
        }
        // Test credentials
        console.log(chalk.blue('\n🔑 TEST CREDENTIALS:\n'));
        console.log('Admin: admin@aimlglossary.com / admin123456');
        console.log('Premium: premium@aimlglossary.com / premiumpass123');
        console.log('Free: test@aimlglossary.com / testpassword123');
        console.log(chalk.yellow('\n⚠️  Please complete the manual test checklist above'));
        console.log(chalk.yellow('Open http://localhost:5173 in your browser to begin testing\n'));
    }
    async run() {
        console.log(chalk.blue('🧪 AI/ML GLOSSARY PRO - CRITICAL FUNCTIONALITY CHECK'));
        console.log(chalk.gray('='.repeat(60) + '\n'));
        await this.checkServers();
        await this.checkAPIEndpoints();
        await this.checkAuthentication();
        await this.checkDatabase();
        await this.checkSecurity();
        this.printManualTestChecklist();
        await this.generateReport();
    }
}
// Run the checker
const checker = new CriticalFunctionalityChecker();
checker.run().catch(console.error);
