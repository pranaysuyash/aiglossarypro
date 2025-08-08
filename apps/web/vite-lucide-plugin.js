/**
 * Vite Plugin for Lucide React Tree Shaking
 *
 * This plugin automatically transforms lucide-react imports to enable better tree shaking.
 * It converts named imports to individual module imports, significantly reducing bundle size.
 *
 * Example transformation:
 * Before: import { Search, Menu, User } from 'lucide-react'
 * After:  import Search from 'lucide-react/dist/esm/icons/search'
 *         import Menu from 'lucide-react/dist/esm/icons/menu'
 *         import User from 'lucide-react/dist/esm/icons/user'
 */
export function lucideTreeShakePlugin() {
    return {
        name: 'lucide-tree-shake',
        transform(code, id) {
            // Only process TypeScript/JavaScript files
            if (!id.match(/\.(ts|tsx|js|jsx)$/)) {
                return null;
            }
            // Skip if no lucide-react imports
            if (!code.includes('lucide-react')) {
                return null;
            }
            // Transform named imports from lucide-react
            const transformedCode = code.replace(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"];?/g, (match, imports) => {
                // Parse the named imports
                const iconNames = imports
                    .split(',')
                    .map((name) => name.trim())
                    .filter((name) => name.length > 0)
                    .map((name) => {
                    // Handle aliased imports like "Link as LinkIcon"
                    const [originalName, alias] = name.split(' as ').map(n => n.trim());
                    const iconFileName = originalName
                        .replace(/([A-Z])/g, '-$1')
                        .toLowerCase()
                        .replace(/^-/, '')
                        .replace(/(\d+)/, '-$1');
                    if (alias) {
                        return `import ${alias} from 'lucide-react/dist/esm/icons/${iconFileName}';`;
                    }
                    else {
                        return `import ${originalName} from 'lucide-react/dist/esm/icons/${iconFileName}';`;
                    }
                });
                return iconNames.join('\n');
            });
            // Only return if we made changes
            if (transformedCode !== code) {
                return {
                    code: transformedCode,
                    map: null, // Simple transformation, source map not critical for this use case
                };
            }
            return null;
        },
    };
}
/**
 * Alternative approach using Vite's build optimizations
 * This configures Vite to better handle lucide-react imports
 */
export function lucideOptimizeConfig() {
    return {
        optimizeDeps: {
            include: [
                // Pre-bundle commonly used lucide icons to improve dev performance
                'lucide-react/dist/esm/icons/search',
                'lucide-react/dist/esm/icons/menu',
                'lucide-react/dist/esm/icons/user',
                'lucide-react/dist/esm/icons/home',
                'lucide-react/dist/esm/icons/settings',
                'lucide-react/dist/esm/icons/book-open',
                'lucide-react/dist/esm/icons/heart',
                'lucide-react/dist/esm/icons/star',
                'lucide-react/dist/esm/icons/eye',
                'lucide-react/dist/esm/icons/check',
                'lucide-react/dist/esm/icons/x',
                'lucide-react/dist/esm/icons/arrow-right',
                'lucide-react/dist/esm/icons/arrow-left',
                'lucide-react/dist/esm/icons/chevron-down',
                'lucide-react/dist/esm/icons/loader-2',
            ],
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        // Group lucide icons into a separate chunk for better caching
                        'lucide-icons': ['lucide-react'],
                    },
                },
            },
        },
    };
}
