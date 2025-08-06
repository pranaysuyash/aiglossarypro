import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
// Custom plugin to rename .tsx files to .js after they're written to disk
const customRename = () => ({
    name: 'custom-tsx-rename',
    generateBundle(options, bundle) {
        const filesToRename = [];
        // Find all .tsx files in the bundle
        for (const [fileName, file] of Object.entries(bundle)) {
            if (fileName.endsWith('.tsx')) {
                const newFileName = fileName.replace(/\.tsx$/, '.js');
                filesToRename.push({ old: fileName, new: newFileName });
                console.log(`🔄 Renaming in bundle: ${fileName} → ${newFileName}`);
            }
        }
        // Rename them in the bundle
        for (const { old, new: newName } of filesToRename) {
            bundle[newName] = bundle[old];
            delete bundle[old];
        }
        console.log(`✅ Renamed ${filesToRename.length} .tsx files to .js in bundle`);
    },
    async writeBundle(options, bundle) {
        // Also rename files on disk after Vite writes them
        const fs = await import('fs');
        const path = await import('path');
        const outDir = options.dir || 'dist';
        // Find .tsx files that were written to disk
        const findTsxFiles = (dir) => {
            const files = fs.readdirSync(dir);
            const tsxFiles = [];
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    tsxFiles.push(...findTsxFiles(fullPath));
                }
                else if (file.endsWith('.tsx')) {
                    tsxFiles.push(fullPath);
                }
            }
            return tsxFiles;
        };
        const tsxFiles = findTsxFiles(outDir);
        const renamedFiles = [];
        // Rename .tsx files to .js
        for (const tsxFile of tsxFiles) {
            const jsFile = tsxFile.replace(/\.tsx$/, '.js');
            console.log(`🔄 Renaming on disk: ${tsxFile} → ${jsFile}`);
            fs.renameSync(tsxFile, jsFile);
            // Track the rename for HTML update
            const relativeTsxPath = path.relative(outDir, tsxFile).replace(/\\/g, '/');
            const relativeJsPath = path.relative(outDir, jsFile).replace(/\\/g, '/');
            renamedFiles.push({ tsx: relativeTsxPath, js: relativeJsPath });
        }
        // Update HTML file references
        const htmlFile = path.join(outDir, 'index.html');
        if (fs.existsSync(htmlFile) && renamedFiles.length > 0) {
            let htmlContent = fs.readFileSync(htmlFile, 'utf8');
            let htmlUpdated = false;
            for (const { tsx, js } of renamedFiles) {
                const tsxPath = `/${tsx}`;
                const jsPath = `/${js}`;
                if (htmlContent.includes(tsxPath)) {
                    htmlContent = htmlContent.replace(new RegExp(tsxPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), jsPath);
                    console.log(`🔄 Updating HTML: ${tsxPath} → ${jsPath}`);
                    htmlUpdated = true;
                }
            }
            if (htmlUpdated) {
                fs.writeFileSync(htmlFile, htmlContent, 'utf8');
                console.log(`✅ Updated HTML file references`);
            }
        }
        console.log(`✅ Renamed ${tsxFiles.length} .tsx files to .js on disk`);
    }
});
export default defineConfig({
    plugins: [
        react(), // SWC already handles TypeScript compilation
        customRename() // Just rename the output files
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@shared': path.resolve(__dirname, '../../packages/shared/dist'),
            '@aiglossarypro/shared': path.resolve(__dirname, '../../packages/shared/dist'),
            '@aiglossarypro/database': path.resolve(__dirname, '../../packages/database/dist'),
            '@aiglossarypro/auth': path.resolve(__dirname, '../../packages/auth/dist'),
            '@aiglossarypro/config': path.resolve(__dirname, '../../packages/config/dist'),
            '@assets': path.resolve(__dirname, '../../attached_assets'),
        },
    },
    build: {
        outDir: '../../dist/public',
        emptyOutDir: true,
        // Explicitly set the input to ensure Vite processes HTML correctly
        rollupOptions: {
            input: path.resolve(__dirname, 'index.html'),
            external: id => {
                return (id.includes('.test.') ||
                    id.includes('.spec.') ||
                    id.includes('.stories.') ||
                    id.includes('__tests__') ||
                    id.includes('storybook') ||
                    id.includes('@storybook'));
            },
            output: {
                // Force JS extensions for all chunks
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
    },
});
