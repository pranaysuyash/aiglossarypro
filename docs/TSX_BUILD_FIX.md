# Vite TSX Production Build Bug - Solution Implementation

## Problem Overview

### Issue Description
Vite 7.x has a known bug where production builds output raw `.tsx` files instead of compiled `.js` files when using:
- HTML entry points (index.html)
- React.lazy() dynamic imports
- TypeScript/TSX components

This causes MIME type errors in browsers:
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/plain"
```

### Related Issues
- Vite GitHub Issue: [#16773](https://github.com/vitejs/vite/issues/16773)
- Affects: Vite 5.4.14+ and 7.x versions
- Impact: Production deployments fail to load React components

## Solution Implemented

### ChatGPT Consultation
Consulted ChatGPT for solutions after multiple failed attempts:
1. ❌ Removed Million.js (suspected cause)
2. ❌ Fixed TypeScript jsx config (preserve → react-jsx)
3. ❌ Upgraded Vite (5.4.14 → 7.0.6)
4. ❌ Switched to @vitejs/plugin-react-swc
5. ❌ Created JSX entry point (partial success)

ChatGPT provided three solutions - we implemented **Solution A**.

### Solution A: Custom Rollup Plugin (Implemented)

Created a custom Rollup plugin that:
1. Renames `.tsx` files to `.js` in the bundle
2. Renames files on disk after Vite writes them

## Technical Implementation

### 1. Dependencies Installed
```bash
pnpm add -D @rollup/plugin-typescript rollup-plugin-rename
```

### 2. Production Vite Config
Created `apps/web/vite.config.prod.ts`:

```typescript
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
        } else if (file.endsWith('.tsx')) {
          tsxFiles.push(fullPath);
        }
      }
      
      return tsxFiles;
    };
    
    const tsxFiles = findTsxFiles(outDir);
    
    for (const tsxFile of tsxFiles) {
      const jsFile = tsxFile.replace(/\.tsx$/, '.js');
      console.log(`🔄 Renaming on disk: ${tsxFile} → ${jsFile}`);
      fs.renameSync(tsxFile, jsFile);
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
        return (
          id.includes('.test.') ||
          id.includes('.spec.') ||
          id.includes('.stories.') ||
          id.includes('__tests__') ||
          id.includes('storybook') ||
          id.includes('@storybook')
        );
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
```

### 3. Package.json Update
```json
{
  "scripts": {
    "build:prod": "vite build --config vite.config.prod.ts"
  }
}
```

### 4. GitHub Actions Integration
Updated `.github/workflows/production.yml`:

```yaml
- name: Build web app
  run: |
    cd apps/web
    pnpm build:prod

- name: Validate build output (no TSX files)
  run: |
    cd dist/public
    if find . -name "*.tsx" -type f | grep -q .; then
      echo "❌ .tsx files found in bundle:"
      find . -name "*.tsx" -type f
      exit 1
    else
      echo "✅ Bundle clean - no .tsx files found"
    fi
```

## Plugin Architecture

### Why Two Hooks Are Needed

1. **generateBundle Hook**: Operates on Rollup's internal bundle object
   - Renames files in the bundle data structure
   - Prevents references to .tsx files in the bundle

2. **writeBundle Hook**: Operates after files are written to disk
   - Vite writes .tsx files to disk AFTER bundle generation
   - This hook renames the actual files on the filesystem

### Technical Challenge
The core issue was that Vite's file writing process occurs after Rollup's `generateBundle` hook, so even though we renamed files in the bundle, Vite still wrote `.tsx` files to disk.

## Verification Process

### Local Testing
```bash
# Clean build
rm -rf ../../dist/public && pnpm build:prod

# Verify no TSX files
find ../../dist/public -name "*.tsx" -type f
# Should return nothing

# Verify JS files exist
find ../../dist/public -name "*App*.js" -type f
# Should return: ../../dist/public/assets/App-DhRzLOYG.js
```

### Build Output Logs
```
🔄 Renaming in bundle: assets/App-DhRzLOYG.tsx → assets/App-DhRzLOYG.js
✅ Renamed 1 .tsx files to .js in bundle
🔄 Renaming on disk: /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/dist/public/assets/App-DhRzLOYG.tsx → /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/dist/public/assets/App-DhRzLOYG.js
✅ Renamed 1 .tsx files to .js on disk
```

## Deployment Results

### Before Fix
- ❌ `App-DhRzLOYG.tsx` in production build
- ❌ MIME type errors: `text/plain` instead of `application/javascript`
- ❌ Frontend failed to load React components

### After Fix
- ✅ `App-DhRzLOYG.js` in production build
- ✅ Correct MIME type: `application/javascript`
- ✅ Frontend loads successfully at https://d1bnbqox1m8zqp.cloudfront.net/

## Alternative Solutions (Not Implemented)

### Solution B: TSC Pre-compilation
```typescript
// Pre-compile TSX with TypeScript compiler
// Then use Vite to bundle the compiled JS
```

### Solution C: MIME Type Workaround
```typescript
// Configure CloudFront/S3 to serve .tsx with JavaScript MIME type
// Less elegant, doesn't fix root cause
```

## Lessons Learned

1. **Vite Bug Confirmed**: This is a known issue with Vite's HTML entry + React.lazy combination
2. **Rollup Hook Timing**: Understanding when Vite writes files vs when Rollup processes bundles
3. **Multi-Hook Solution**: Some fixes require multiple plugin hooks to work properly
4. **Validation Importance**: Always verify build output in CI/CD pipelines

## Future Considerations

- Monitor Vite releases for official bug fix
- Consider migrating to Solution B if this becomes problematic
- Document for other projects with similar architecture

## Related Files
- `apps/web/vite.config.prod.ts` - Production configuration
- `apps/web/package.json` - Build script
- `.github/workflows/production.yml` - CI/CD validation
- `apps/web/src/main.jsx` - JSX entry point (partial fix attempt)

## Commit History
- `c1bce513`: Enhanced Vite plugin to rename .tsx files both in bundle and on disk
- Previous attempts documented in git history

---

**Status**: ✅ Resolved  
**Date**: 2025-08-04  
**Solution**: Custom Rollup plugin with dual-hook approach  
**Deployment**: Production deployment successful