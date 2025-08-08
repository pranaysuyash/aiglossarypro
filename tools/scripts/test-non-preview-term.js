#!/usr/bin/env npx tsx
/**
 * Test hierarchical navigation with non-preview term
 */
import { chromium } from 'playwright';
async function testNonPreviewTerm() {
    console.log('🔍 Testing Hierarchical Navigation with Non-Preview Term...\n');
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    try {
        // Test with a non-preview term
        const termId = 'e2924cfb-31ce-4816-bd51-df539d331da5'; // 3D Autoencoder
        console.log(`📄 Navigating to non-preview term: ${termId}...`);
        await page.goto(`http://localhost:5173/term/${termId}`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });
        // Wait for heading to appear
        await page.waitForSelector('h1', { timeout: 10000 });
        console.log('✅ Page loaded with heading');
        // Dismiss cookie overlay if it exists
        const cookieAccept = page.locator('button:has-text("Accept All")');
        if (await cookieAccept.isVisible()) {
            await cookieAccept.click();
            await page.waitForTimeout(1000);
            console.log('🍪 Dismissed cookie overlay');
        }
        // Check for Content Navigation heading
        const contentNavHeading = page.locator('h2:has-text("Content Navigation")');
        const hasContentNav = (await contentNavHeading.count()) > 0;
        console.log(`📋 Content Navigation heading: ${hasContentNav ? '✅ Found' : '❌ Not found'}`);
        // Check for HierarchicalNavigator
        const hierarchicalNav = page.locator('[data-testid="card"]');
        const hasHierarchicalNav = (await hierarchicalNav.count()) > 0;
        console.log(`🗂️ Hierarchical Navigator: ${hasHierarchicalNav ? '✅ Found' : '❌ Not found'}`);
        // If found, test interactions
        if (hasContentNav && hasHierarchicalNav) {
            console.log('🎉 Hierarchical Navigation Found! Testing interactions...');
            // Test search functionality
            const searchInput = page.locator('input[placeholder*="Search"]');
            if ((await searchInput.count()) > 0) {
                console.log('🔍 Testing search...');
                await searchInput.fill('neural');
                await page.waitForTimeout(2000);
                console.log('✅ Search tested');
            }
            // Test tree/flat toggle
            const treeButton = page.locator('button:has-text("Tree")');
            const flatButton = page.locator('button:has-text("Flat")');
            if ((await treeButton.count()) > 0 || (await flatButton.count()) > 0) {
                console.log('🌳 Testing Tree/Flat toggle...');
                if ((await flatButton.count()) > 0) {
                    await flatButton.click();
                    await page.waitForTimeout(1000);
                    console.log('✅ Flat view tested');
                }
                if ((await treeButton.count()) > 0) {
                    await treeButton.click();
                    await page.waitForTimeout(1000);
                    console.log('✅ Tree view tested');
                }
            }
            // Take comprehensive screenshots
            await page.screenshot({
                path: 'hierarchical-nav-working.png',
                fullPage: true,
            });
            console.log('📸 Working screenshot: hierarchical-nav-working.png');
        }
        else {
            // Take debugging screenshots
            await page.screenshot({
                path: 'hierarchical-nav-debug-nonpreview.png',
                fullPage: true,
            });
            console.log('📸 Debug screenshot: hierarchical-nav-debug-nonpreview.png');
            // Get all h2 headings
            const h2Headings = await page.locator('h2').allInnerTexts();
            console.log(`📝 All H2 headings: ${JSON.stringify(h2Headings)}`);
        }
        console.log('\n🎉 Test completed!');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
    }
    finally {
        await browser.close();
    }
}
testNonPreviewTerm().catch(console.error);
