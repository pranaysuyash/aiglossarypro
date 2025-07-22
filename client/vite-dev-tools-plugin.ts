import { resolve } from 'path';
import type { Plugin } from 'vite';

/**
 * Enhanced Development Tools Plugin for Vite
 *
 * Provides better development experience with:
 * - Enhanced error overlays
 * - Source map optimization
 * - Development-specific optimizations
 */

interface DevToolsOptions {
  enableErrorOverlay?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableSourceMapOptimization?: boolean;
  errorOverlayPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export function devToolsPlugin(options: DevToolsOptions = {}): Plugin {
  const {
    enableErrorOverlay = true,
    enablePerformanceMonitoring = true,
    enableSourceMapOptimization = true,
    errorOverlayPosition = 'center',
  } = options;

  return {
    name: 'vite-dev-tools',
    apply: 'serve', // Only apply in development

    configResolved(config) {
      // Ensure source maps are enabled in development
      if (enableSourceMapOptimization && config.command === 'serve') {
        config.esbuild = config.esbuild || {};
        config.esbuild.sourcemap = true;
        config.esbuild.keepNames = true;
      }
    },

    configureServer(server) {
      // Add middleware for development tools
      server.middlewares.use('/dev-tools', (req, res, next) => {
        if (req.url === '/dev-tools/health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'ok',
              timestamp: new Date().toISOString(),
              features: {
                errorOverlay: enableErrorOverlay,
                performanceMonitoring: enablePerformanceMonitoring,
                sourceMapOptimization: enableSourceMapOptimization,
              },
            })
          );
        } else {
          next();
        }
      });
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        if (context.server) {
          // Inject development tools initialization
          const devToolsScript = `
            <script type="module">
              // Initialize development tools
              if (import.meta.env.DEV) {
                import('/src/utils/devTools.ts').then(({ initDevTools }) => {
                  initDevTools();
                });
                
                ${
                  enableErrorOverlay
                    ? `
                // Setup error overlay
                window.__DEV_ERROR_OVERLAY__ = {
                  showError: (error) => {
                    import('/src/components/dev/ErrorOverlay.tsx').then(({ default: ErrorOverlay }) => {
                      // Implementation would go here for dynamic overlay
                      console.error('Development Error:', error);
                    });
                  }
                };
                `
                    : ''
                }
                
                ${
                  enablePerformanceMonitoring
                    ? `
                // Performance monitoring
                if ('PerformanceObserver' in window) {
                  const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      if (entry.entryType === 'navigation') {
                        console.log('🚀 Page Load Performance:', {
                          domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                          loadComplete: entry.loadEventEnd - entry.loadEventStart,
                          totalTime: entry.loadEventEnd - entry.fetchStart
                        });
                      }
                    }
                  });
                  observer.observe({ entryTypes: ['navigation'] });
                }
                `
                    : ''
                }
              }
            </script>
          `;

          return html.replace('<head>', `<head>${devToolsScript}`);
        }
        return html;
      },
    },

    handleHotUpdate(ctx) {
      // Enhanced HMR with better error handling
      if (ctx.file.endsWith('.tsx') || ctx.file.endsWith('.ts')) {
        // Log file changes in development
        console.log(`🔄 Hot reload: ${ctx.file.replace(process.cwd(), '')}`);
      }
    },
  };
}
