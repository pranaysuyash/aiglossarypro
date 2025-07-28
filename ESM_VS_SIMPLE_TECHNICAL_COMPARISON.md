# ESM vs Simple Build Technical Comparison

## Build Configurations

### Simple (Working) Build

**package.json**:
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "commonjs",  // or omitted
  "scripts": {
    "build": "vite build && tsc -p tsconfig.server.json",
    "start": "node dist/server/index.js"
  }
}
```

**Build Output Structure**:
- Multiple JavaScript files mirroring source structure
- Each TypeScript file compiled to corresponding JS file
- No bundling, preserves file structure
- Uses `require()` and `module.exports`

**Dockerfile**:
```dockerfile
FROM node:18-alpine
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
```

**App Runner Config**:
```json
{
  "Port": "3000",
  "RuntimeEnvironmentVariables": {
    "PORT": "3000",
    "NODE_ENV": "production"
  }
}
```

### ESM (Failed) Build

**package.json**:
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",  // ESM mode
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --alias:@shared=./shared --minify=false",
    "start": "node dist/index.js"
  }
}
```

**Build Output Structure**:
- Single bundled `dist/index.js` file (2.1MB)
- All server code bundled together
- External packages not bundled (`--packages=external`)
- Uses `import` and `export`

**Dockerfile**:
```dockerfile
FROM node:20-alpine
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

**App Runner Config**:
```json
{
  "Port": "8080",
  "RuntimeEnvironmentVariables": {
    "PORT": "8080",
    "NODE_ENV": "production"
  }
}
```

## Key Technical Differences

### 1. Module System
| Aspect | Simple (CommonJS) | ESM |
|--------|------------------|-----|
| Import Syntax | `const x = require('x')` | `import x from 'x'` |
| Export Syntax | `module.exports = x` | `export default x` |
| File Extensions | `.js` (implicit) | `.js` (must be explicit) |
| Dynamic Imports | `require()` anywhere | `await import()` only |
| JSON Import | `require('./data.json')` | Requires special handling |

### 2. Build Process
| Aspect | Simple | ESM |
|--------|--------|-----|
| Build Tool | TypeScript Compiler (tsc) | esbuild bundler |
| Output | Multiple files | Single bundled file |
| Source Maps | Yes | Yes (but bundled) |
| Tree Shaking | No | Yes |
| Build Time | ~5s | ~40s |

### 3. Runtime Behavior
| Aspect | Simple | ESM |
|--------|--------|-----|
| Node Version | 18+ | 20+ (better ESM support) |
| Module Resolution | Node's CommonJS algorithm | ESM resolution algorithm |
| Circular Dependencies | Handled | Can cause issues |
| Top-level Await | No | Yes |

## Error Patterns Observed

### Simple Build Errors
- Clear error messages in App Runner logs
- Application logs available
- Standard Node.js errors

### ESM Build Errors
- No application logs created
- Only App Runner health check failures
- Container fails to start silently
- No debugging information available

## Environment Compatibility

### App Runner Environment
- Expects standard Node.js applications
- Health check on specified port
- No special ESM configuration options
- Limited debugging capabilities

### ESM Requirements
- Node.js 20+ for full ESM support
- Proper file extension handling
- Different module resolution
- May need special loader flags

## Deployment Logs Comparison

### Simple Build Success
```
[AppRunner] Successfully pulled your application image
[AppRunner] Provisioning instances and deploying image
[AppRunner] Performing health check on port 3000
[AppRunner] Health check passed
[AppRunner] Service is now running
```

### ESM Build Failure
```
[AppRunner] Successfully pulled your application image
[AppRunner] Provisioning instances and deploying image
[AppRunner] Performing health check on port 8080
[AppRunner] Health check failed on protocol HTTP
[AppRunner] No application logs available
```

## Conclusion
The fundamental issue appears to be AWS App Runner's compatibility with ESM modules and/or bundled Node.js applications. The platform reliably executes traditional CommonJS applications but fails to properly initialize ESM-based containers.