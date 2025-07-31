# Build Optimization with esbuild

## Overview

We've implemented a more efficient build strategy using esbuild to dramatically reduce build times while maintaining compatibility with AWS App Runner deployment.

## Build Scripts

### 1. Fast Production Build (Recommended)
```bash
npm run build:fast
```
- Uses esbuild for ultra-fast TypeScript transpilation
- Skips type checking for maximum speed
- Build time: ~200-300ms
- Perfect for production deployments where CI has already validated types

### 2. Standard Build
```bash
npm run build
```
- Runs type checking first, then uses esbuild
- Build time: ~2-5 seconds (depending on type checking)
- Good for local development to catch type errors

### 3. Development Watch Mode
```bash
npm run dev
```
- Uses esbuild in watch mode
- Automatically rebuilds on file changes
- Instant feedback during development

### 4. Type Checking Only
```bash
npm run type-check
```
- Runs TypeScript compiler for type validation only
- No output files generated
- Use in CI/CD pipelines for validation

### 5. Legacy TypeScript Build
```bash
npm run build:tsc
```
- Original TypeScript compiler build
- Very slow (~30-60 seconds)
- Kept for compatibility/debugging purposes

## Build Configuration

### esbuild.simple.js
- Main build configuration
- Transpiles all TypeScript files to CommonJS
- Preserves directory structure
- Excludes test files automatically

### esbuild.config.js
- Alternative bundled build (not currently used)
- Can create a single bundled output file
- Useful for different deployment scenarios

### esbuild.dev.js
- Development configuration with watch mode
- Similar to simple build but with watch enabled

## AWS App Runner Compatibility

The build output is configured for CommonJS format to ensure compatibility with AWS App Runner:
- Format: CommonJS (`cjs`)
- Target: Node.js 18
- All dependencies remain external (not bundled)

## Performance Comparison

Based on benchmarks:
- esbuild: ~200-300ms
- TypeScript compiler: ~30,000-60,000ms
- **Speed improvement: 100-200x faster!**

## Deployment Process

1. AWS App Runner uses `package.deploy.json` which is configured to use the fast build
2. The build process in `apprunner.yaml` runs:
   - Workspace package builds (if needed)
   - Fast esbuild compilation
   - No type checking (assumes CI has validated)

## Benefits

1. **Faster Deployments**: Build time reduced from minutes to seconds
2. **Lower Memory Usage**: No need for 8GB heap allocation
3. **Same Output**: CommonJS format compatible with existing infrastructure
4. **Development Speed**: Instant rebuilds in watch mode
5. **CI/CD Friendly**: Separate type checking from building

## Migration Notes

- All existing npm scripts work as before
- The default `npm run build` now uses esbuild
- Type checking is separated but still available
- No changes needed to deployment configurations