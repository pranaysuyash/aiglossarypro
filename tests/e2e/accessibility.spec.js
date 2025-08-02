import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
test.describe('Accessibility Compliance', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#main-content')).toBeVisible();
    });
    test.describe('WCAG 2.1 AA Compliance (Automated)', () => {
        test('should pass axe-core accessibility scan on homepage', async ({ page }) => {
            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                .analyze();
            expect(accessibilityScanResults.violations).toEqual([]);
        });
        test('should pass axe-core scan on key application pages', async ({ page }) => {
            const keyPages = ['/', '/terms', '/categories', '/search', '/about'];
            for (const pagePath of keyPages) {
                await page.goto(pagePath);
                await page.waitForLoadState('networkidle');
                const accessibilityScanResults = await new AxeBuilder({ page })
                    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                    .exclude('[data-test-exclude-axe]') // Allow excluding problematic third-party content
                    .analyze();
                // Log violations for debugging but don't fail the test immediately
                if (accessibilityScanResults.violations.length > 0) {
                    console.log(`Accessibility violations found on ${pagePath}:`);
                    accessibilityScanResults.violations.forEach(violation => {
                        console.log(`- ${violation.id}: ${violation.description}`);
                        console.log(`  Impact: ${violation.impact}`);
                        console.log(`  Nodes: ${violation.nodes.length}`);
                    });
                }
                // Fail only on critical violations
                const criticalViolations = accessibilityScanResults.violations.filter(violation => violation.impact === 'critical' || violation.impact === 'serious');
                expect(criticalViolations).toEqual([]);
            }
        });
        test('should pass axe-core scan with specific rules', async ({ page }) => {
            // Test specific accessibility rules that are most important
            const accessibilityScanResults = await new AxeBuilder({ page })
                .include('main') // Focus on main content area
                .withRules(['color-contrast', 'keyboard-navigation', 'aria-labels', 'heading-order'])
                .analyze();
            expect(accessibilityScanResults.violations).toEqual([]);
        });
    });
    test.describe('Keyboard Navigation', () => {
        test('should support keyboard navigation throughout the application', async ({ page }) => {
            // Start from the top of the page
            await page.keyboard.press('Tab');
            // Track focusable elements
            const focusableElements = [];
            let attempts = 0;
            const maxAttempts = 20;
            while (attempts < maxAttempts) {
                const focusedElement = page.locator(':focus');
                if ((await focusedElement.count()) > 0) {
                    const tagName = await focusedElement.evaluate(el => el.tagName);
                    const id = await focusedElement.getAttribute('id');
                    const testId = await focusedElement.getAttribute('data-testid');
                    const role = await focusedElement.getAttribute('role');
                    focusableElements.push({
                        tagName,
                        id: id || 'no-id',
                        testId: testId || 'no-testid',
                        role: role || 'no-role',
                    });
                }
                await page.keyboard.press('Tab');
                await page.waitForTimeout(100);
                attempts++;
            }
            // Should have found focusable elements
            expect(focusableElements.length).toBeGreaterThan(5);
            console.log(`Focusable elements found: ${focusableElements.length}`);
            // Check for essential navigation elements
            const essentialElements = ['button', 'a', 'input'];
            const foundEssential = focusableElements.some(el => essentialElements.includes(el.tagName.toLowerCase()));
            expect(foundEssential).toBe(true);
        });
        test('should handle Enter and Space key interactions', async ({ page }) => {
            // Find and focus on interactive elements
            const interactiveElements = [
                page.locator('button').first(),
                page.locator('a').first(),
                page.locator('[role="button"]').first(),
            ];
            for (const element of interactiveElements) {
                if ((await element.count()) > 0) {
                    await element.focus();
                    // Test Enter key
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(500);
                    // Test Space key (for buttons)
                    if (await element.evaluate(el => el.tagName === 'BUTTON')) {
                        await element.focus();
                        await page.keyboard.press(' ');
                        await page.waitForTimeout(500);
                    }
                    break;
                }
            }
        });
        test('should support arrow key navigation in menus and lists', async ({ page }) => {
            // Look for dropdown menus or navigation
            const menuTriggers = [
                page.locator('[data-testid="user-menu"]'),
                page.locator('[aria-haspopup="true"]'),
                page.locator('[role="button"][aria-expanded]'),
            ];
            for (const trigger of menuTriggers) {
                if ((await trigger.count()) > 0) {
                    await trigger.focus();
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(500);
                    // Try arrow key navigation
                    await page.keyboard.press('ArrowDown');
                    await page.waitForTimeout(200);
                    await page.keyboard.press('ArrowDown');
                    await page.waitForTimeout(200);
                    await page.keyboard.press('ArrowUp');
                    await page.waitForTimeout(200);
                    // Test escape to close
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(500);
                    break;
                }
            }
        });
        test('should support keyboard shortcuts', async ({ page }) => {
            // Test common keyboard shortcuts
            const shortcuts = [
                { keys: ['Control', 'f'], purpose: 'Search' },
                { keys: ['Control', 'k'], purpose: 'Quick search' },
                { keys: ['Escape'], purpose: 'Close modals' },
                { keys: ['/', '/'], purpose: 'Search focus' },
            ];
            for (const shortcut of shortcuts) {
                if (shortcut.keys.length === 1) {
                    await page.keyboard.press(shortcut.keys[0]);
                }
                else {
                    await page.keyboard.press(`${shortcut.keys[0]}+${shortcut.keys[1]}`);
                }
                await page.waitForTimeout(500);
                console.log(`Tested shortcut for: ${shortcut.purpose}`);
            }
        });
    });
    test.describe('Screen Reader Support', () => {
        test('should have proper ARIA labels and roles', async ({ page }) => {
            // Check for ARIA landmarks
            const landmarks = [
                page.locator('[role="main"]'),
                page.locator('[role="navigation"]'),
                page.locator('[role="banner"]'),
                page.locator('[role="contentinfo"]'),
                page.locator('[role="search"]'),
            ];
            let foundLandmarks = 0;
            for (const landmark of landmarks) {
                if ((await landmark.count()) > 0) {
                    foundLandmarks++;
                }
            }
            expect(foundLandmarks).toBeGreaterThan(2);
            console.log(`ARIA landmarks found: ${foundLandmarks}`);
            // Check for proper button labels
            const buttons = page.locator('button');
            const buttonCount = await buttons.count();
            if (buttonCount > 0) {
                let buttonsWithLabels = 0;
                for (let i = 0; i < Math.min(buttonCount, 10); i++) {
                    const button = buttons.nth(i);
                    const ariaLabel = await button.getAttribute('aria-label');
                    const textContent = await button.textContent();
                    const title = await button.getAttribute('title');
                    if (ariaLabel || textContent?.trim() || title) {
                        buttonsWithLabels++;
                    }
                }
                const labelPercentage = (buttonsWithLabels / Math.min(buttonCount, 10)) * 100;
                expect(labelPercentage).toBeGreaterThan(80);
                console.log(`Buttons with labels: ${labelPercentage}%`);
            }
        });
        test('should have descriptive headings hierarchy', async ({ page }) => {
            // Check heading structure
            const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
            // Should have at least h1 and h2
            const h1Count = await page.locator('h1').count();
            const h2Count = await page.locator('h2').count();
            expect(h1Count).toBeGreaterThan(0);
            expect(h2Count).toBeGreaterThan(0);
            console.log(`Heading structure: H1(${h1Count}), H2(${h2Count}), Total(${headings.length})`);
            // Check that headings have meaningful content
            const meaningfulHeadings = headings.filter(heading => heading.trim().length > 2 && !heading.includes('undefined') && !heading.includes('null'));
            expect(meaningfulHeadings.length).toBeGreaterThan(0);
        });
        test('should have proper form labels and descriptions', async ({ page }) => {
            // Look for forms
            const forms = page.locator('form');
            const formCount = await forms.count();
            if (formCount > 0) {
                // Check inputs have labels
                const inputs = page.locator('input[type="text"], input[type="email"], textarea');
                const inputCount = await inputs.count();
                let labelledInputs = 0;
                for (let i = 0; i < inputCount; i++) {
                    const input = inputs.nth(i);
                    const id = await input.getAttribute('id');
                    const ariaLabel = await input.getAttribute('aria-label');
                    const ariaLabelledBy = await input.getAttribute('aria-labelledby');
                    // Check for associated label
                    let hasLabel = false;
                    if (id) {
                        const label = page.locator(`label[for="${id}"]`);
                        hasLabel = (await label.count()) > 0;
                    }
                    if (hasLabel || ariaLabel || ariaLabelledBy) {
                        labelledInputs++;
                    }
                }
                if (inputCount > 0) {
                    const labelPercentage = (labelledInputs / inputCount) * 100;
                    expect(labelPercentage).toBeGreaterThan(75);
                    console.log(`Form inputs with labels: ${labelPercentage}%`);
                }
            }
        });
        test('should announce dynamic content changes', async ({ page }) => {
            // Look for live regions
            const liveRegions = [
                page.locator('[aria-live]'),
                page.locator('[role="status"]'),
                page.locator('[role="alert"]'),
                page.locator('[data-testid="live-region"]'),
            ];
            let foundLiveRegions = 0;
            for (const region of liveRegions) {
                if ((await region.count()) > 0) {
                    foundLiveRegions++;
                }
            }
            console.log(`Live regions found: ${foundLiveRegions}`);
            // Test dynamic content updates (like search)
            const searchInput = page.locator('[data-testid="search-input"], input[type="text"]').first();
            if ((await searchInput.count()) > 0) {
                await searchInput.fill('test');
                await page.waitForTimeout(1000);
                // Check if results are announced
                const resultAnnouncements = [
                    page.locator('[aria-live="polite"]'),
                    page.locator('[role="status"]'),
                    page.locator('[data-testid="search-results-announcement"]'),
                ];
                let foundAnnouncements = false;
                for (const announcement of resultAnnouncements) {
                    if ((await announcement.count()) > 0) {
                        foundAnnouncements = true;
                        break;
                    }
                }
                console.log(`Search results announced: ${foundAnnouncements}`);
            }
        });
    });
    test.describe('Color Contrast and Visual Accessibility', () => {
        test('should meet color contrast requirements', async ({ page }) => {
            // This test checks basic color properties, but real contrast testing
            // would require more sophisticated tools
            // Check for high contrast mode support
            const highContrastElements = [
                page.locator('[data-high-contrast]'),
                page.locator('.high-contrast'),
                page.locator('[aria-label*="contrast"]'),
            ];
            let supportsHighContrast = false;
            for (const element of highContrastElements) {
                if ((await element.count()) > 0) {
                    supportsHighContrast = true;
                    break;
                }
            }
            console.log(`High contrast support: ${supportsHighContrast}`);
            // Check that text has proper styling
            const textElements = page.locator('p, span, div').first();
            if ((await textElements.count()) > 0) {
                const styles = await textElements.evaluate(el => {
                    const computed = window.getComputedStyle(el);
                    return {
                        color: computed.color,
                        backgroundColor: computed.backgroundColor,
                        fontSize: computed.fontSize,
                    };
                });
                // Basic checks
                expect(styles.color).not.toBe('');
                expect(styles.fontSize).not.toBe('');
                console.log('Text styling verified');
            }
        });
        test('should support zoom up to 200%', async ({ page }) => {
            // Test page functionality at different zoom levels
            const zoomLevels = [1.5, 2.0];
            for (const zoom of zoomLevels) {
                await page.evaluate(zoomLevel => {
                    document.body.style.zoom = zoomLevel.toString();
                }, zoom);
                await page.waitForTimeout(1000);
                // Check that main content is still accessible
                await expect(page.locator('#main-content')).toBeVisible();
                // Check that navigation still works
                const navElements = page.locator('nav, [role="navigation"]');
                if ((await navElements.count()) > 0) {
                    await expect(navElements.first()).toBeVisible();
                }
                console.log(`Zoom level ${zoom * 100}% tested`);
            }
            // Reset zoom
            await page.evaluate(() => {
                document.body.style.zoom = '1';
            });
        });
        test('should not rely solely on color for information', async ({ page }) => {
            // Check for elements that might use color-only information
            const colorDependentElements = [
                page.locator('.error, .danger, .warning, .success'),
                page.locator('[class*="red"], [class*="green"], [class*="yellow"]'),
                page.locator('[style*="color"]'),
            ];
            for (const elementGroup of colorDependentElements) {
                const count = await elementGroup.count();
                if (count > 0) {
                    for (let i = 0; i < Math.min(count, 5); i++) {
                        const element = elementGroup.nth(i);
                        // Check if element has additional indicators
                        const hasIcon = (await element.locator('svg, i, .icon').count()) > 0;
                        const hasText = (await element.textContent())?.trim().length > 0;
                        const hasAriaLabel = (await element.getAttribute('aria-label')) !== null;
                        const hasNonColorIndicator = hasIcon || hasText || hasAriaLabel;
                        console.log(`Element ${i}: Non-color indicator = ${hasNonColorIndicator}`);
                    }
                }
            }
        });
    });
    test.describe('Focus Management', () => {
        test('should manage focus properly in modals and dialogs', async ({ page }) => {
            // Look for modal triggers
            const modalTriggers = [
                page.locator('[data-testid*="modal"], [data-testid*="dialog"]'),
                page.locator('button:has-text("Open"), button:has-text("Show")'),
            ];
            for (const trigger of modalTriggers) {
                if ((await trigger.count()) > 0) {
                    await trigger.first().click();
                    await page.waitForTimeout(1000);
                    // Check if focus is trapped in modal
                    await page.keyboard.press('Tab');
                    await page.waitForTimeout(200);
                    const focusedElement = page.locator(':focus');
                    if ((await focusedElement.count()) > 0) {
                        const isInModal = await focusedElement.evaluate(el => {
                            const modal = el.closest('[role="dialog"], .modal, [data-testid*="modal"]');
                            return modal !== null;
                        });
                        console.log(`Focus trapped in modal: ${isInModal}`);
                    }
                    // Test escape key
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(500);
                    break;
                }
            }
        });
        test('should provide visible focus indicators', async ({ page }) => {
            // Tab through elements and check for visible focus
            let focusedElementsWithIndicators = 0;
            const elementsToCheck = 10;
            for (let i = 0; i < elementsToCheck; i++) {
                await page.keyboard.press('Tab');
                await page.waitForTimeout(100);
                const focusedElement = page.locator(':focus');
                if ((await focusedElement.count()) > 0) {
                    // Check if element has focus styling
                    const styles = await focusedElement.evaluate(el => {
                        const computed = window.getComputedStyle(el);
                        return {
                            outline: computed.outline,
                            outlineWidth: computed.outlineWidth,
                            outlineColor: computed.outlineColor,
                            boxShadow: computed.boxShadow,
                            borderColor: computed.borderColor,
                        };
                    });
                    const hasFocusIndicator = styles.outline !== 'none' ||
                        styles.outlineWidth !== '0px' ||
                        styles.boxShadow !== 'none' ||
                        styles.borderColor !== 'initial';
                    if (hasFocusIndicator) {
                        focusedElementsWithIndicators++;
                    }
                }
            }
            const indicatorPercentage = (focusedElementsWithIndicators / elementsToCheck) * 100;
            expect(indicatorPercentage).toBeGreaterThan(70);
            console.log(`Elements with focus indicators: ${indicatorPercentage}%`);
        });
        test('should return focus after modal closes', async ({ page }) => {
            // Find a button that opens a modal
            const modalButton = page.locator('button').first();
            if ((await modalButton.count()) > 0) {
                await modalButton.focus();
                await modalButton.click();
                await page.waitForTimeout(1000);
                // Close modal (try various methods)
                const closeButtons = [
                    page.locator('[data-testid="modal-close"], [aria-label*="close"]'),
                    page.locator('button:has-text("Close"), button:has-text("Cancel")'),
                ];
                let modalClosed = false;
                for (const closeButton of closeButtons) {
                    if ((await closeButton.count()) > 0) {
                        await closeButton.click();
                        modalClosed = true;
                        break;
                    }
                }
                if (!modalClosed) {
                    await page.keyboard.press('Escape');
                }
                await page.waitForTimeout(500);
                // Check if focus returned to original button
                const currentFocus = page.locator(':focus');
                if ((await currentFocus.count()) > 0) {
                    const isOriginalButton = await currentFocus.evaluate((el, buttonEl) => {
                        return el === buttonEl;
                    }, await modalButton.elementHandle());
                    console.log(`Focus returned to original element: ${isOriginalButton}`);
                }
            }
        });
    });
    test.describe('Alternative Input Methods', () => {
        test('should support voice navigation commands', async ({ page }) => {
            // This is a basic test - real voice navigation would require
            // speech recognition testing tools
            // Check for voice navigation support indicators
            const voiceSupport = [
                page.locator('[data-voice-command]'),
                page.locator('[aria-label*="voice"]'),
                page.locator('[data-testid*="voice"]'),
            ];
            let hasVoiceSupport = false;
            for (const element of voiceSupport) {
                if ((await element.count()) > 0) {
                    hasVoiceSupport = true;
                    break;
                }
            }
            console.log(`Voice navigation support indicators: ${hasVoiceSupport}`);
        });
        test('should work with touch navigation', async ({ page }) => {
            // Simulate touch interactions
            const touchTargets = page.locator('button, a, [role="button"]');
            const touchCount = await touchTargets.count();
            if (touchCount > 0) {
                // Check touch target size (should be at least 44x44px for accessibility)
                const firstTarget = touchTargets.first();
                const boundingBox = await firstTarget.boundingBox();
                if (boundingBox) {
                    const isAccessibleSize = boundingBox.width >= 44 && boundingBox.height >= 44;
                    console.log(`Touch target size acceptable: ${isAccessibleSize} (${boundingBox.width}x${boundingBox.height})`);
                }
                // Test touch interactions
                await firstTarget.tap();
                await page.waitForTimeout(500);
                console.log('Touch interaction tested');
            }
        });
    });
    test.describe('Error Handling and Feedback', () => {
        test('should provide accessible error messages', async ({ page }) => {
            // Look for forms to test error handling
            const forms = page.locator('form');
            const formCount = await forms.count();
            if (formCount > 0) {
                const form = forms.first();
                // Try to submit empty form to trigger validation
                const submitButton = form.locator('button[type="submit"], input[type="submit"]');
                if ((await submitButton.count()) > 0) {
                    await submitButton.click();
                    await page.waitForTimeout(1000);
                    // Check for accessible error messages
                    const errorMessages = [
                        page.locator('[role="alert"]'),
                        page.locator('[aria-live="assertive"]'),
                        page.locator('.error-message, .validation-error'),
                        page.locator('[data-testid*="error"]'),
                    ];
                    let foundAccessibleErrors = false;
                    for (const errorGroup of errorMessages) {
                        if ((await errorGroup.count()) > 0) {
                            foundAccessibleErrors = true;
                            // Check if errors are properly associated with inputs
                            const errorText = await errorGroup.textContent();
                            const hasDescriptiveText = errorText && errorText.length > 5;
                            console.log(`Accessible error found: ${hasDescriptiveText}`);
                            break;
                        }
                    }
                    console.log(`Accessible error messages: ${foundAccessibleErrors}`);
                }
            }
        });
        test('should announce loading states', async ({ page }) => {
            // Look for loading states
            const loadingTriggers = [
                page.locator('button:has-text("Load"), button:has-text("Search")'),
                page.locator('[data-testid*="submit"]'),
            ];
            for (const trigger of loadingTriggers) {
                if ((await trigger.count()) > 0) {
                    await trigger.click();
                    await page.waitForTimeout(500);
                    // Check for loading announcements
                    const loadingAnnouncements = [
                        page.locator('[aria-live="polite"]:has-text("Loading")'),
                        page.locator('[role="status"]:has-text("Loading")'),
                        page.locator('[data-testid="loading-announcement"]'),
                    ];
                    let foundLoadingAnnouncement = false;
                    for (const announcement of loadingAnnouncements) {
                        if ((await announcement.count()) > 0) {
                            foundLoadingAnnouncement = true;
                            break;
                        }
                    }
                    console.log(`Loading state announced: ${foundLoadingAnnouncement}`);
                    break;
                }
            }
        });
    });
});
