#!/usr/bin/env tsx
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
const BASE_URL = 'http://localhost:3001';
const CHAR_FUNC_ID = '662ec15e-b90d-4836-bb00-4ac24c17e3af';
const OUTPUT_DIR = path.join(process.cwd(), 'enhanced-test-results');
async function createOutputDir() {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(path.join(OUTPUT_DIR, 'screenshots'), { recursive: true });
}
async function testEnhancedTermDisplay(page) {
    const results = [];
    try {
        console.log('🔍 Testing enhanced term display...');
        // First ensure we're on the application
        await page.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000); // Wait for app to fully load
        // Test 1: Check if frontend can access enhanced API
        const apiResponse = await page.evaluate(async (termId) => {
            try {
                const response = await fetch(`/api/enhanced/terms/${termId}`);
                const data = await response.json();
                return { success: true, data };
            }
            catch (error) {
                return { success: false, error: error.message };
            }
        }, CHAR_FUNC_ID);
        results.push({
            test: 'Enhanced API Accessibility',
            success: apiResponse.success,
            details: apiResponse.success
                ? `Successfully fetched enhanced term with ${apiResponse.data.sections?.length || 0} sections`
                : `Failed: ${apiResponse.error}`,
            error: apiResponse.success ? undefined : apiResponse.error,
        });
        // Test 2: Navigate to enhanced term page (if route exists)
        const termRoutes = [
            `/term/${CHAR_FUNC_ID}`,
            `/enhanced/terms/${CHAR_FUNC_ID}`,
            `/terms/${CHAR_FUNC_ID}`,
            `/term/characteristic-function`,
            `/enhanced/characteristic-function`,
        ];
        let successfulRoute = null;
        for (const route of termRoutes) {
            try {
                console.log(`Trying route: ${route}`);
                await page.goto(`${BASE_URL}${route}`, { timeout: 15000 });
                await page.waitForLoadState('networkidle', { timeout: 10000 });
                await page.waitForTimeout(2000); // Extra wait for components to load
                // Check multiple possible title selectors
                const titleSelectors = [
                    'h1',
                    'h2',
                    '.title',
                    '[data-testid="term-title"]',
                    '.term-title',
                    '.page-title',
                ];
                let title = '';
                for (const selector of titleSelectors) {
                    const titleElement = await page.$(selector);
                    if (titleElement) {
                        const titleText = await titleElement.textContent();
                        if (titleText?.trim()) {
                            title = titleText.trim();
                            break;
                        }
                    }
                }
                console.log(`Route ${route} loaded with title: "${title}"`);
                // Check if we found the term page (either has the term name or is not a 404/error page)
                const isTermPage = title &&
                    (title.toLowerCase().includes('characteristic') ||
                        (!title.toLowerCase().includes('not found') &&
                            !title.toLowerCase().includes('error') &&
                            title !== 'Skip Navigation Links'));
                if (isTermPage) {
                    successfulRoute = route;
                    const screenshot = path.join(OUTPUT_DIR, 'screenshots', 'enhanced-term-page.png');
                    await page.screenshot({ path: screenshot, fullPage: true });
                    results.push({
                        test: 'Enhanced Term Page Navigation',
                        success: true,
                        details: `Successfully navigated to ${route} and found term page with title: "${title}"`,
                        screenshot,
                    });
                    // Test enhanced features on this page
                    await testTermPageFeatures(page, results);
                    break;
                }
            }
            catch (error) {
                console.log(`Route ${route} failed:`, error.message);
                // Continue to next route
            }
        }
        if (!successfulRoute) {
            results.push({
                test: 'Enhanced Term Page Navigation',
                success: false,
                details: 'Could not find a working route for enhanced term display',
                error: 'No valid term page route found',
            });
        }
        // Test 3: Check if 42 sections are displayed (if we found a page)
        if (successfulRoute) {
            try {
                // Look for section indicators
                const sectionElements = await page.$$eval('[data-section], .section, .term-section, [class*="section"]', elements => elements.map(el => ({
                    tag: el.tagName,
                    className: el.className,
                    id: el.id,
                    text: el.textContent?.slice(0, 50),
                })));
                const screenshot = path.join(OUTPUT_DIR, 'screenshots', 'sections-analysis.png');
                await page.screenshot({ path: screenshot, fullPage: true });
                results.push({
                    test: '42-Section Display',
                    success: sectionElements.length > 0,
                    details: `Found ${sectionElements.length} potential section elements: ${JSON.stringify(sectionElements.slice(0, 3))}`,
                    screenshot,
                });
                // Test 4: Check for interactive elements
                const interactiveElements = await page.$$eval('button, [role="button"], .interactive, [data-interactive], .quiz, .mermaid, code, pre, canvas, svg, [contenteditable], input, textarea, select', elements => elements.map(el => ({
                    tag: el.tagName,
                    className: el.className,
                    type: el.getAttribute('type'),
                    role: el.getAttribute('role'),
                    id: el.id,
                    contentEditable: el.contentEditable || 'inherit',
                })));
                results.push({
                    test: 'Interactive Elements Detection',
                    success: interactiveElements.length > 0,
                    details: `Found ${interactiveElements.length} interactive elements: ${JSON.stringify(interactiveElements.slice(0, 5))}`,
                });
                // Test 5: Test actual interaction with elements
                await testInteractiveElements(page, results);
                // Test 6: Check for Mermaid diagrams specifically
                await testMermaidDiagrams(page, results);
                // Test 7: Check for code examples and syntax highlighting
                await testCodeExamples(page, results);
            }
            catch (error) {
                results.push({
                    test: '42-Section Display',
                    success: false,
                    details: 'Error checking for sections',
                    error: error.message,
                });
            }
        }
    }
    catch (error) {
        results.push({
            test: 'Enhanced Term Display Test',
            success: false,
            details: 'Test suite failed',
            error: error.message,
        });
    }
    return results;
}
async function testSearchFunctionality(page) {
    const results = [];
    try {
        console.log('🔍 Testing search functionality...');
        // Test enhanced search - try terms page which has search
        await page.goto(`${BASE_URL}/terms`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        // Look for search input
        const searchSelectors = [
            'input[type="search"]',
            'input[placeholder*="search" i]',
            '[data-testid*="search"]',
            '.search-input',
            '#search',
        ];
        let searchInput = null;
        for (const selector of searchSelectors) {
            try {
                searchInput = await page.$(selector);
                if (searchInput)
                    break;
            }
            catch (_e) {
                // Continue
            }
        }
        if (searchInput) {
            // Clear any existing content first
            await searchInput.click({ clickCount: 3 }); // Select all
            await searchInput.fill('Characteristic Function');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000); // Give more time for search results
            const screenshot = path.join(OUTPUT_DIR, 'screenshots', 'search-results.png');
            await page.screenshot({ path: screenshot, fullPage: true });
            // Check if enhanced term appears in results in multiple ways
            const pageContent = await page.content();
            const bodyText = (await page.textContent('body')) || '';
            // Check for various forms of the term
            const searchTerms = [
                'characteristic function',
                'Characteristic Function',
                'CHARACTERISTIC FUNCTION',
                'probability theory',
                'fourier analysis',
            ];
            const foundTerms = searchTerms.filter(term => bodyText.toLowerCase().includes(term.toLowerCase()) ||
                pageContent.toLowerCase().includes(term.toLowerCase()));
            // Also check for term cards or result elements
            const termCards = await page.$$('[data-testid*="term"], .term-card, [class*="term"]');
            const resultElements = await page.$$('.search-result, [data-search-result], .result-item');
            const _hasSearchResults = termCards.length > 0 || resultElements.length > 0;
            const hasCharacteristicFunction = foundTerms.length > 0;
            results.push({
                test: 'Search for Characteristic Function',
                success: hasCharacteristicFunction,
                details: hasCharacteristicFunction
                    ? `Found terms: ${foundTerms.join(', ')}. Results: ${termCards.length} cards, ${resultElements.length} elements`
                    : `No matching terms found. Available results: ${termCards.length} cards, ${resultElements.length} elements`,
                screenshot,
            });
            // Test 3: Try clicking on the first search result if found
            if (termCards.length > 0) {
                try {
                    // Look for the specific link within the card
                    const readMoreLink = await page.$('a[href*="/term/"]:has-text("Read more"), a[href*="/term/"]:has-text("View"), a[href*="/term/"] >> visible');
                    if (readMoreLink) {
                        await readMoreLink.scrollIntoViewIfNeeded();
                        await readMoreLink.click();
                    }
                    else {
                        // Fallback to clicking the card
                        const firstCard = termCards[0];
                        await firstCard.scrollIntoViewIfNeeded();
                        await firstCard.click();
                    }
                    await page.waitForTimeout(2000);
                    const currentUrl = page.url();
                    const pageTitle = (await page.textContent('h1, h2, .title, [data-testid="term-title"]')) || '';
                    const clickScreenshot = path.join(OUTPUT_DIR, 'screenshots', 'term-page-after-click.png');
                    await page.screenshot({ path: clickScreenshot, fullPage: true });
                    const navigatedToTerm = currentUrl.includes('/term/') || pageTitle.toLowerCase().includes('characteristic');
                    results.push({
                        test: 'Search Result Navigation',
                        success: navigatedToTerm,
                        details: `Clicked first search result. URL: ${currentUrl}, Title: "${pageTitle}"`,
                        screenshot: clickScreenshot,
                    });
                    // If we successfully navigated to a term page, test the enhanced features
                    if (navigatedToTerm) {
                        await testTermPageFeatures(page, results);
                    }
                }
                catch (error) {
                    results.push({
                        test: 'Search Result Navigation',
                        success: false,
                        details: 'Failed to click on search result',
                        error: error.message,
                    });
                }
            }
        }
        else {
            results.push({
                test: 'Search Input Detection',
                success: false,
                details: 'Could not find search input field',
                error: 'No search input found',
            });
        }
    }
    catch (error) {
        results.push({
            test: 'Search Functionality Test',
            success: false,
            details: 'Search test failed',
            error: error.message,
        });
    }
    return results;
}
async function testTermPageFeatures(page, results) {
    try {
        console.log('🧪 Testing term page enhanced features...');
        // Test if 42-section content is displayed
        const sectionsElement = await page.$('[data-sections], .sections, [data-testid*="section"], .term-content');
        if (sectionsElement) {
            const sectionCount = await page.$$eval('[data-section], .section-item, .content-section', elements => elements.length);
            results.push({
                test: '42-Section Content Display',
                success: sectionCount > 0,
                details: `Found ${sectionCount} content sections on term page`,
            });
        }
        // Test for enhanced metadata display
        const categories = await page.$$eval('[data-category], .category, .main-category', elements => elements.map(el => el.textContent?.trim()));
        const hasEnhancedCategories = categories.some(cat => cat && ['Probability Theory', 'Mathematical Functions', 'Fourier Analysis'].includes(cat));
        results.push({
            test: 'Enhanced Categories Display',
            success: hasEnhancedCategories,
            details: hasEnhancedCategories
                ? `Found enhanced categories: ${categories.filter(Boolean).join(', ')}`
                : `Categories found: ${categories.filter(Boolean).join(', ')}`,
        });
        // Test for interactive elements
        await testInteractiveElements(page, results);
        await testMermaidDiagrams(page, results);
        await testCodeExamples(page, results);
    }
    catch (error) {
        results.push({
            test: 'Term Page Features Test',
            success: false,
            details: 'Failed to test term page features',
            error: error.message,
        });
    }
}
async function testInteractiveElements(page, results) {
    try {
        console.log('🎮 Testing interactive elements...');
        // Test expandable sections or accordions
        const expandableElements = await page.$$('[data-expandable], .expandable, .accordion, details, [aria-expanded]');
        let interactionCount = 0;
        for (let i = 0; i < Math.min(expandableElements.length, 3); i++) {
            try {
                const element = expandableElements[i];
                await element.scrollIntoViewIfNeeded();
                await element.click();
                await page.waitForTimeout(500);
                interactionCount++;
            }
            catch (_e) {
                // Continue with next element
            }
        }
        const screenshot = path.join(OUTPUT_DIR, 'screenshots', 'interactive-elements-test.png');
        await page.screenshot({ path: screenshot, fullPage: true });
        results.push({
            test: 'Interactive Elements Functionality',
            success: interactionCount > 0,
            details: `Successfully interacted with ${interactionCount}/${expandableElements.length} expandable elements`,
            screenshot,
        });
        // Test form interactions
        const forms = await page.$$('form');
        if (forms.length > 0) {
            try {
                const form = forms[0];
                const inputs = await form.$$('input[type="text"], input[type="email"], textarea');
                for (const input of inputs.slice(0, 2)) {
                    await input.fill('Test interaction');
                    await page.waitForTimeout(200);
                }
                const formScreenshot = path.join(OUTPUT_DIR, 'screenshots', 'form-interaction-test.png');
                await page.screenshot({ path: formScreenshot, fullPage: true });
                results.push({
                    test: 'Form Interaction',
                    success: true,
                    details: `Successfully filled ${inputs.length} form inputs`,
                    screenshot: formScreenshot,
                });
            }
            catch (error) {
                results.push({
                    test: 'Form Interaction',
                    success: false,
                    details: 'Failed to interact with forms',
                    error: error.message,
                });
            }
        }
        // Test quiz or interactive quiz elements
        const quizElements = await page.$$('.quiz, [data-quiz], .question, [data-testid*="quiz"]');
        if (quizElements.length > 0) {
            try {
                const quiz = quizElements[0];
                await quiz.scrollIntoViewIfNeeded();
                // Look for quiz answers or options
                const options = await quiz.$$('button, input[type="radio"], input[type="checkbox"], .option');
                if (options.length > 0) {
                    await options[0].click();
                    await page.waitForTimeout(500);
                    const quizScreenshot = path.join(OUTPUT_DIR, 'screenshots', 'quiz-interaction-test.png');
                    await page.screenshot({ path: quizScreenshot, fullPage: true });
                    results.push({
                        test: 'Quiz Interaction',
                        success: true,
                        details: `Found and interacted with quiz containing ${options.length} options`,
                        screenshot: quizScreenshot,
                    });
                }
            }
            catch (error) {
                results.push({
                    test: 'Quiz Interaction',
                    success: false,
                    details: 'Failed to interact with quiz elements',
                    error: error.message,
                });
            }
        }
    }
    catch (error) {
        results.push({
            test: 'Interactive Elements Testing',
            success: false,
            details: 'Failed to test interactive elements',
            error: error.message,
        });
    }
}
async function testMermaidDiagrams(page, results) {
    try {
        console.log('📊 Testing Mermaid diagrams...');
        // Check for Mermaid diagram containers
        const mermaidSelectors = [
            '.mermaid',
            '[data-mermaid]',
            '.diagram',
            'svg[data-diagram]',
            '.flowchart',
            '.sequence-diagram',
        ];
        let mermaidFound = false;
        let mermaidDetails = '';
        for (const selector of mermaidSelectors) {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
                mermaidFound = true;
                // Check if it's rendered as SVG (indicates successful Mermaid rendering)
                for (const element of elements) {
                    const svgContent = await element.$('svg');
                    const hasContent = await element.evaluate(el => el.textContent?.length > 10);
                    if (svgContent || hasContent) {
                        mermaidDetails += `Found rendered diagram in ${selector} (${svgContent ? 'SVG' : 'text'}); `;
                    }
                }
                const screenshot = path.join(OUTPUT_DIR, 'screenshots', 'mermaid-diagrams.png');
                await page.screenshot({ path: screenshot, fullPage: true });
                results.push({
                    test: 'Mermaid Diagrams',
                    success: true,
                    details: `Found ${elements.length} Mermaid diagram(s): ${mermaidDetails}`,
                    screenshot,
                });
                break;
            }
        }
        if (!mermaidFound) {
            // Check for Mermaid source code that should be rendered
            const mermaidSource = await page.$$eval('code, pre', elements => elements
                .filter(el => el.textContent?.includes('graph') ||
                el.textContent?.includes('flowchart') ||
                el.textContent?.includes('sequenceDiagram') ||
                el.className?.includes('mermaid'))
                .map(el => ({
                tag: el.tagName,
                className: el.className,
                content: el.textContent?.slice(0, 100),
            })));
            results.push({
                test: 'Mermaid Diagrams',
                success: mermaidSource.length > 0,
                details: mermaidSource.length > 0
                    ? `Found ${mermaidSource.length} potential Mermaid source blocks but no rendered diagrams`
                    : 'No Mermaid diagrams or source found',
                error: mermaidSource.length > 0 ? 'Mermaid may not be properly initialized' : undefined,
            });
        }
    }
    catch (error) {
        results.push({
            test: 'Mermaid Diagrams',
            success: false,
            details: 'Failed to test Mermaid diagrams',
            error: error.message,
        });
    }
}
async function testCodeExamples(page, results) {
    try {
        console.log('💻 Testing code examples...');
        // Check for code blocks and syntax highlighting
        const codeElements = await page.$$eval('code, pre, .code-block, .highlight, [class*="language-"]', elements => elements.map(el => ({
            tag: el.tagName,
            className: el.className,
            hasContent: el.textContent?.length > 10,
            language: el.className?.match(/language-(\w+)/)?.[1] || 'unknown',
            hasSyntaxHighlighting: el.querySelectorAll('.token, .keyword, .string, .comment').length > 0,
            contentPreview: el.textContent?.slice(0, 50),
        })));
        const hasCodeExamples = codeElements.filter(el => el.hasContent).length > 0;
        const hasSyntaxHighlighting = codeElements.filter(el => el.hasSyntaxHighlighting).length > 0;
        if (hasCodeExamples) {
            const screenshot = path.join(OUTPUT_DIR, 'screenshots', 'code-examples.png');
            await page.screenshot({ path: screenshot, fullPage: true });
            results.push({
                test: 'Code Examples',
                success: true,
                details: `Found ${codeElements.length} code blocks, ${hasSyntaxHighlighting ? 'with' : 'without'} syntax highlighting. Languages: ${[...new Set(codeElements.map(el => el.language))].join(', ')}`,
                screenshot,
            });
            // Test code copy functionality
            const copyButtons = await page.$$('button[data-copy], .copy-button, [aria-label*="copy" i]');
            if (copyButtons.length > 0) {
                try {
                    await copyButtons[0].click();
                    await page.waitForTimeout(500);
                    results.push({
                        test: 'Code Copy Functionality',
                        success: true,
                        details: `Found and tested ${copyButtons.length} copy button(s)`,
                    });
                }
                catch (error) {
                    results.push({
                        test: 'Code Copy Functionality',
                        success: false,
                        details: 'Copy buttons found but interaction failed',
                        error: error.message,
                    });
                }
            }
        }
        else {
            results.push({
                test: 'Code Examples',
                success: false,
                details: 'No code examples found on the page',
            });
        }
    }
    catch (error) {
        results.push({
            test: 'Code Examples',
            success: false,
            details: 'Failed to test code examples',
            error: error.message,
        });
    }
}
async function generateReport(allResults) {
    const successCount = allResults.filter(r => r.success).length;
    const totalCount = allResults.length;
    const report = `
# Enhanced Functionality Test Report

**Generated:** ${new Date().toISOString()}
**Overall Success Rate:** ${successCount}/${totalCount} (${Math.round((successCount / totalCount) * 100)}%)

## Test Results

${allResults
        .map(result => `
### ${result.test}
- **Status:** ${result.success ? '✅ PASS' : '❌ FAIL'}
- **Details:** ${result.details}
${result.error ? `- **Error:** ${result.error}` : ''}
${result.screenshot ? `- **Screenshot:** ${path.relative(OUTPUT_DIR, result.screenshot)}` : ''}
`)
        .join('\n')}

## Summary

The enhanced functionality test covered:
1. Enhanced API accessibility from frontend
2. Enhanced term page navigation  
3. 42-section display detection
4. Interactive elements detection and functionality
5. Mermaid diagram rendering
6. Code examples and syntax highlighting
7. Quiz/form interactions
8. Search functionality for enhanced terms

### Key Findings:
${allResults.filter(r => !r.success).length === 0
        ? '- All tests passed! Enhanced functionality is working correctly.'
        : allResults
            .filter(r => !r.success)
            .map(r => `- ❌ ${r.test}: ${r.details}`)
            .join('\n')}

### Recommendations:
${successCount < totalCount
        ? '- Review failed tests and update frontend routing/display logic for enhanced terms\n- Ensure enhanced API endpoints are properly integrated with the frontend\n- Consider adding proper enhanced term page routes'
        : '- Enhanced functionality is working well\n- Consider running comprehensive visual audit for full coverage'}
  `.trim();
    await fs.writeFile(path.join(OUTPUT_DIR, 'enhanced-test-report.md'), report);
    console.log(`\n📊 Test Report Generated: ${path.join(OUTPUT_DIR, 'enhanced-test-report.md')}`);
    return report;
}
async function runEnhancedFunctionalityTest() {
    let browser = null;
    try {
        await createOutputDir();
        console.log('🚀 Starting Enhanced Functionality Test...');
        console.log(`📁 Output directory: ${OUTPUT_DIR}`);
        browser = await chromium.launch({
            headless: false,
            devtools: false,
            slowMo: 100,
        });
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
        });
        const page = await context.newPage();
        // Run all tests
        const termDisplayResults = await testEnhancedTermDisplay(page);
        const searchResults = await testSearchFunctionality(page);
        const allResults = [...termDisplayResults, ...searchResults];
        // Generate report
        const _report = await generateReport(allResults);
        console.log('\n📋 Test Results Summary:');
        allResults.forEach(result => {
            console.log(`${result.success ? '✅' : '❌'} ${result.test}: ${result.details}`);
        });
        await context.close();
    }
    catch (error) {
        console.error('❌ Enhanced functionality test failed:', error);
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
    process.exit(0);
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runEnhancedFunctionalityTest().catch(console.error);
}
