# App Runner Deployment Notes - What Works and What Doesn't

## Working Service Configuration
- **Service**: aiglossarypro-api-working
- **URL**: https://p9mwh22fhi.us-east-1.awsapprunner.com/
- **Configuration**: Repository-based (apprunner.yaml)
- **Runtime**: nodejs18

## What DOESN'T Work
1. **Docker Image Deployment**
   - ESM/CommonJS conflicts
   - ARM64 vs x86_64 architecture issues
   - Container exit code 1

2. **API Configuration with `bundle: false`**
   - Missing runtime dependencies
   - Container can't find node_modules

3. **Runtime Versions in apprunner.yaml**
   - ❌ `runtime-version: latest` - NOT SUPPORTED
   - ❌ `runtime-version: 18` - NOT SUPPORTED
   - ✅ Should be: Remove `runtime-version` entirely OR use full version like "18.20.0"

## What WORKS
1. **pnpm Support**
   - Install globally with npm
   - Add to PATH: `export PATH=$PATH:$(npm config get prefix)/bin`
   - Use `--no-frozen-lockfile` flag

2. **TypeScript Build**
   - Skip type checking: `SKIP_TYPE_CHECK=true`
   - Build works with existing build.js

3. **Repository Configuration**
   - Use `ConfigurationSource: "REPOSITORY"`
   - Place apprunner.yaml in root directory

## Correct apprunner.yaml Format
```yaml
version: 1.0
runtime: nodejs18  # NOT nodejs18, just nodejs18
build:
  commands:
    pre-build:
      - npm install -g pnpm
      - export PATH=$PATH:$(npm config get prefix)/bin
    build:
      - pnpm install --no-frozen-lockfile
      - cd apps/api && SKIP_TYPE_CHECK=true NODE_ENV=production pnpm run build
run:
  # DO NOT SPECIFY runtime-version or it will fail!
  command: cd apps/api && NODE_ENV=production node dist/index.js
  network:
    port: 8080
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    # Add all required environment variables
```

## Key Lessons
1. Working service uses repository config, not API config
2. Runtime should be `nodejs18` not `NODEJS_18`
3. Don't specify runtime-version in run section
4. Must include essential env vars in apprunner.yaml