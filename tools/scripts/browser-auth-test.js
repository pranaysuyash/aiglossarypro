#!/usr/bin/env tsx
import { chromium } from 'playwright';
import chalk from 'chalk';
async function browserAuthTest() {
    const browser = await chromium.launch({
        headless: false,
        devtools: true
    });
    const page = await browser.newPage();
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
        const text = `[${msg.type()}] ${msg.text()}`;
        consoleLogs.push(text);
        if (msg.type() === 'error') {
            console.log(chalk.red(text));
        }
        else if (msg.type() === 'warning') {
            console.log(chalk.yellow(text));
        }
        else {
            console.log(chalk.gray(text));
        }
    });
    // Track auth calls
    let authCallCount = 0;
    const authCalls = [];
    page.on('request', request => {
        if (request.url().includes('/api/auth/user')) {
            authCallCount++;
            const stackTrace = new Error().stack || '';
            authCalls.push(`Call #${authCallCount} at ${Date.now()}`);
            console.log(chalk.blue(`\n[AUTH REQUEST #${authCallCount}] ${request.method()} ${request.url()}`));
        }
    });
    page.on('response', response => {
        if (response.url().includes('/api/auth/user')) {
            console.log(chalk.cyan(`[AUTH RESPONSE] ${response.status()}`));
        }
    });
    try {
        console.log(chalk.green('\n🔍 Opening browser to debug authentication...'));
        console.log(chalk.green('Frontend URL: http://localhost:5173/login\n'));
        await page.goto('http://localhost:5173/login', {
            waitUntil: 'domcontentloaded'
        });
        // Wait and observe
        console.log(chalk.yellow('\n⏱️ Observing for 15 seconds...'));
        console.log(chalk.yellow('Check the DevTools Console for React Query logs\n'));
        await page.waitForTimeout(15000);
        // Summary
        console.log(chalk.blue('\n📊 Summary:'));
        console.log(`Total auth calls: ${authCallCount}`);
        if (authCallCount > 5) {
            console.log(chalk.red('\n❌ AUTHENTICATION LOOP DETECTED!'));
            console.log(chalk.red(`${authCallCount} calls in 15 seconds is excessive\n`));
            // Print console logs that might help debug
            console.log(chalk.yellow('Console logs that might help:'));
            consoleLogs
                .filter(log => log.includes('auth') || log.includes('query') || log.includes('🚫') || log.includes('🔄'))
                .forEach(log => console.log(log));
        }
        // Keep browser open for manual inspection
        console.log(chalk.green('\n✅ Browser will stay open for manual debugging...'));
        console.log(chalk.green('Check the Network tab and Console for more details'));
        console.log(chalk.yellow('Press Ctrl+C to close\n'));
        // Keep process alive
        await new Promise(() => { });
    }
    catch (error) {
        console.error(chalk.red('Error:'), error);
        await browser.close();
    }
}
browserAuthTest().catch(console.error);
