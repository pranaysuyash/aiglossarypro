/**
 * Visual Audit Utilities
 *
 * Common utility functions for visual testing including:
 * - Screenshot comparison
 * - Color contrast calculation
 * - Performance metric analysis
 * - Report generation helpers
 */
import fs from 'node:fs/promises';
// Optional dependency - handle gracefully if not installed
let sharp;
try {
    sharp = require('sharp');
}
catch (_e) {
    console.warn('⚠️  sharp not installed - image processing features will be limited');
    sharp = {
        // Mock implementation for when sharp is not available
        mockMode: true,
    };
}
import { createHash } from 'node:crypto';
/**
 * Calculate color contrast ratio between two colors
 */
export function calculateContrast(color1, color2) {
    const l1 = Math.max(color1.luminance, color2.luminance);
    const l2 = Math.min(color1.luminance, color2.luminance);
    const ratio = (l1 + 0.05) / (l2 + 0.05);
    return {
        ratio,
        passes: {
            aa: ratio >= 4.5, // Normal text
            aaa: ratio >= 7, // Normal text enhanced
            aaLarge: ratio >= 3, // Large text
            aaaLarge: ratio >= 4.5, // Large text enhanced
        },
    };
}
/**
 * Calculate relative luminance of a color
 */
export function calculateLuminance(rgb) {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : { r: 0, g: 0, b: 0 };
}
/**
 * Extract colors from a page element
 */
export async function extractColors(page, selector) {
    const colors = await page.evaluate(sel => {
        const element = document.querySelector(sel);
        if (!element)
            return null;
        const styles = window.getComputedStyle(element);
        return {
            background: styles.backgroundColor,
            foreground: styles.color,
        };
    }, selector);
    if (!colors) {
        throw new Error(`Element not found: ${selector}`);
    }
    // Convert CSS colors to hex/rgb format
    const bgRgb = parseRgbString(colors.background);
    const fgRgb = parseRgbString(colors.foreground);
    return {
        background: {
            hex: rgbToHex(bgRgb),
            rgb: bgRgb,
            luminance: calculateLuminance(bgRgb),
        },
        foreground: {
            hex: rgbToHex(fgRgb),
            rgb: fgRgb,
            luminance: calculateLuminance(fgRgb),
        },
    };
}
/**
 * Parse RGB string to RGB object
 */
function parseRgbString(rgbString) {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
        };
    }
    // If it's already a hex color
    if (rgbString.startsWith('#')) {
        return hexToRgb(rgbString);
    }
    // Default to white
    return { r: 255, g: 255, b: 255 };
}
/**
 * Convert RGB to hex color
 */
function rgbToHex(rgb) {
    return `#${[rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}
/**
 * Compare two screenshots and return difference percentage
 */
export async function compareScreenshots(baseline, current, outputDiff) {
    if (sharp.mockMode) {
        console.warn('Sharp not available - returning mock comparison result');
        return { difference: 0, pixels: 0 };
    }
    try {
        const img1 = sharp(baseline);
        const img2 = sharp(current);
        const [meta1, meta2] = await Promise.all([img1.metadata(), img2.metadata()]);
        if (meta1.width !== meta2.width || meta1.height !== meta2.height) {
            throw new Error('Images have different dimensions');
        }
        const [buffer1, buffer2] = await Promise.all([img1.raw().toBuffer(), img2.raw().toBuffer()]);
        let diffPixels = 0;
        const totalPixels = meta1.width * meta1.height;
        const diffBuffer = Buffer.alloc(buffer1.length);
        for (let i = 0; i < buffer1.length; i += 3) {
            const r1 = buffer1[i];
            const g1 = buffer1[i + 1];
            const b1 = buffer1[i + 2];
            const r2 = buffer2[i];
            const g2 = buffer2[i + 1];
            const b2 = buffer2[i + 2];
            const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
            if (diff > 10) {
                // Threshold for difference
                diffPixels++;
                // Highlight differences in red
                diffBuffer[i] = 255;
                diffBuffer[i + 1] = 0;
                diffBuffer[i + 2] = 0;
            }
            else {
                // Keep original pixel
                diffBuffer[i] = r1;
                diffBuffer[i + 1] = g1;
                diffBuffer[i + 2] = b1;
            }
        }
        if (outputDiff) {
            await sharp(diffBuffer, {
                raw: {
                    width: meta1.width,
                    height: meta1.height,
                    channels: 3,
                },
            }).toFile(outputDiff);
        }
        const difference = (diffPixels / totalPixels) * 100;
        return {
            difference,
            pixels: diffPixels,
        };
    }
    catch (error) {
        console.error('Error comparing screenshots:', error);
        return { difference: 100, pixels: 0 };
    }
}
/**
 * Generate a unique hash for a screenshot
 */
export async function generateScreenshotHash(filePath) {
    const buffer = await fs.readFile(filePath);
    return createHash('md5').update(buffer).digest('hex');
}
/**
 * Wait for network idle with custom timeout
 */
export async function waitForNetworkIdle(page, timeout = 3000) {
    let pendingRequests = 0;
    let idleTimer = null;
    return new Promise(resolve => {
        const checkIdle = () => {
            if (pendingRequests === 0) {
                idleTimer = setTimeout(() => resolve(), 500);
            }
            else if (idleTimer) {
                clearTimeout(idleTimer);
                idleTimer = null;
            }
        };
        page.on('request', () => {
            pendingRequests++;
            if (idleTimer) {
                clearTimeout(idleTimer);
                idleTimer = null;
            }
        });
        page.on('requestfinished', () => {
            pendingRequests--;
            checkIdle();
        });
        page.on('requestfailed', () => {
            pendingRequests--;
            checkIdle();
        });
        // Initial check
        checkIdle();
        // Timeout fallback
        setTimeout(() => resolve(), timeout);
    });
}
/**
 * Extract text content hierarchy from a page
 */
export async function extractTextHierarchy(page) {
    return await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
            level: parseInt(h.tagName[1]),
            text: h.textContent?.trim() || '',
        }));
        const paragraphs = Array.from(document.querySelectorAll('p'))
            .map(p => p.textContent?.trim() || '')
            .filter(text => text.length > 0);
        const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
            text: a.textContent?.trim() || '',
            href: a.href,
        }));
        return { headings, paragraphs, links };
    });
}
/**
 * Check for animation performance issues
 */
export async function checkAnimationPerformance(page) {
    // Start performance monitoring
    await page.evaluateOnNewDocument(() => {
        window.__performanceMetrics = {
            fps: [],
            longTasks: 0,
            rafTime: 0,
            frameCount: 0,
        };
        // Monitor FPS
        let lastTime = performance.now();
        const measureFPS = () => {
            const currentTime = performance.now();
            const delta = currentTime - lastTime;
            const fps = 1000 / delta;
            window.__performanceMetrics.fps.push(fps);
            lastTime = currentTime;
            window.__performanceMetrics.frameCount++;
            if (window.__performanceMetrics.frameCount < 60) {
                requestAnimationFrame(measureFPS);
            }
        };
        requestAnimationFrame(measureFPS);
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver(list => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        window.__performanceMetrics.longTasks++;
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        }
    });
    // Wait for animations to run
    await page.waitForTimeout(2000);
    // Collect metrics
    const metrics = await page.evaluate(() => {
        const data = window.__performanceMetrics;
        const avgFPS = data.fps.reduce((a, b) => a + b, 0) / data.fps.length;
        const jank = data.fps.filter((fps) => fps < 50).length / data.fps.length;
        return {
            fps: avgFPS,
            jank: jank * 100, // Percentage of janky frames
            longTasks: data.longTasks,
        };
    });
    return metrics;
}
/**
 * Measure element render timing
 */
export async function measureElementTiming(page, selector) {
    const startTime = Date.now();
    try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
        const renderTime = Date.now() - startTime;
        const isVisible = await page.evaluate(sel => {
            const element = document.querySelector(sel);
            if (!element)
                return false;
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight;
        }, selector);
        return { renderTime, visible: isVisible };
    }
    catch (_error) {
        return { renderTime: -1, visible: false };
    }
}
/**
 * Generate performance report summary
 */
export function generatePerformanceSummary(metrics) {
    const avgFCP = metrics.reduce((sum, m) => sum + m.fcp, 0) / metrics.length;
    const avgLCP = metrics.reduce((sum, m) => sum + m.lcp, 0) / metrics.length;
    const avgTTI = metrics.reduce((sum, m) => sum + m.tti, 0) / metrics.length;
    return `
## Performance Summary

### Average Metrics
- First Contentful Paint: ${(avgFCP / 1000).toFixed(2)}s
- Largest Contentful Paint: ${(avgLCP / 1000).toFixed(2)}s  
- Time to Interactive: ${(avgTTI / 1000).toFixed(2)}s

### Performance Distribution
- Excellent (< 1.8s FCP): ${metrics.filter(m => m.fcp < 1800).length}
- Good (1.8s - 3s FCP): ${metrics.filter(m => m.fcp >= 1800 && m.fcp < 3000).length}
- Needs Improvement (> 3s FCP): ${metrics.filter(m => m.fcp >= 3000).length}
`;
}
/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0)
        return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}
/**
 * Create a visual diff HTML report
 */
export async function createVisualDiffReport(diffs, outputPath) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Visual Regression Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .diff-container { margin: 20px 0; border: 1px solid #ddd; padding: 10px; }
        .diff-header { background: #f5f5f5; padding: 10px; margin: -10px -10px 10px; }
        .images { display: flex; gap: 10px; }
        .image-container { flex: 1; text-align: center; }
        img { max-width: 100%; border: 1px solid #ddd; }
        .pass { color: green; }
        .fail { color: red; }
    </style>
</head>
<body>
    <h1>Visual Regression Report</h1>
    ${diffs
        .map(diff => `
        <div class="diff-container">
            <div class="diff-header">
                <h2>${diff.name}</h2>
                <p class="${diff.percentage < 1 ? 'pass' : 'fail'}">
                    Difference: ${diff.percentage.toFixed(2)}%
                </p>
            </div>
            <div class="images">
                <div class="image-container">
                    <h3>Baseline</h3>
                    <img src="${diff.baseline}" alt="Baseline">
                </div>
                <div class="image-container">
                    <h3>Current</h3>
                    <img src="${diff.current}" alt="Current">
                </div>
                <div class="image-container">
                    <h3>Difference</h3>
                    <img src="${diff.diff}" alt="Difference">
                </div>
            </div>
        </div>
    `)
        .join('')}
</body>
</html>`;
    await fs.writeFile(outputPath, html);
}
export default {
    calculateContrast,
    calculateLuminance,
    hexToRgb,
    extractColors,
    compareScreenshots,
    generateScreenshotHash,
    waitForNetworkIdle,
    extractTextHierarchy,
    checkAnimationPerformance,
    measureElementTiming,
    generatePerformanceSummary,
    formatFileSize,
    createVisualDiffReport,
};
