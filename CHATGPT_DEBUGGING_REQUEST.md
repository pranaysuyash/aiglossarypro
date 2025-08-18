# Critical Production Deployment Issue - Need ChatGPT Analysis

**Date**: August 18, 2025  
**Priority**: URGENT - API down, Redis deletion warning active  
**Issue**: Node.js monorepo module resolution in production bundle

---

## 🚨 **PROBLEM STATEMENT**

Our production API on EC2 (52.0.112.85:8080) is stuck in restart loop due to:

```
Error: Cannot find module '@aiglossarypro/database/db/support-schema'
Require stack: /home/ec2-user/aiglossarypro/apps/api/dist/index.js
```

**Key Finding**: The esbuild bundle contains `require("@aiglossarypro/database/db/support-schema")` instead of bundling the actual module code.

---

## 🏗️ **CURRENT ARCHITECTURE**

### **Workspace Structure**
```
aiglossarypro/
├── apps/
│   └── api/                    # Main API application
├── packages/
│   ├── database/              # Database package
│   │   ├── dist/
│   │   │   └── db/
│   │   │       └── support-schema.js  ✅ EXISTS
│   │   └── package.json       # Has proper exports
│   └── shared/                # Shared utilities
```

### **Current esbuild Config** (`apps/api/esbuild.ec2-fixed.js`)
```javascript
const external = [
  '@aiglossarypro/*',  // ❌ This excludes workspace packages!
  'fs', 'path', 'url', 'crypto', 'os', 'util', 'buffer', 'stream', 'events',
  'vite', '@vitejs/*', 'esbuild', 'rollup', 'webpack',
  'bcrypt', 'sharp', 'canvas', 'jsdom',
  'fsevents', 'chokidar'
];
```

### **Package.json Exports** (✅ Already Fixed)
```json
// packages/database/package.json
"exports": {
  "./db/*": {
    "types": "./dist/db/*.d.ts",
    "import": "./dist/db/*.js", 
    "require": "./dist/db/*.js",
    "default": "./dist/db/*.js"
  }
}
```

---

## 🔍 **DIAGNOSTIC EVIDENCE**

### **1. File Verification**
```bash
# ✅ File exists on EC2
/home/ec2-user/aiglossarypro/packages/database/dist/db/support-schema.js

# ❌ Bundle tries to require instead of including
grep "@aiglossarypro/database/db/support-schema" dist/index.js
> var import_support_schema = require("@aiglossarypro/database/db/support-schema");
```

### **2. PM2 Restart Loop**
```
[INFO] PostHog analytics initialized
[INFO] [Redis] Starting with mock client
[progress.ts] Module loading - enhancedStorage: true
Error: Cannot find module '@aiglossarypro/database/db/support-schema'
[restart cycle repeats indefinitely]
```

### **3. Build Process**
```bash
# Current build command
pnpm build:api-ec2-fixed
# Runs: esbuild apps/api/src/index.ts --config=apps/api/esbuild.ec2-fixed.js
```

---

## ⚠️ **FAILED ATTEMPTS**

### **1. Package.json Export Fixes**
- ✅ Added import/require/default conditions
- ✅ Updated both @aiglossarypro/database and @aiglossarypro/shared
- ❌ Still fails because bundle externalizes packages

### **2. Multiple esbuild Configs**
- `esbuild.ec2.js` - Original config
- `esbuild.ec2-fixed.js` - Excluded Vite/dev tools
- `esbuild.ec2-no-externals.js` - Attempted to bundle everything
- ❌ All produce same module resolution error

### **3. Environment Variables**
- ✅ DATABASE_URL loaded correctly
- ✅ PM2 --update-env used
- ❌ Issue is code bundling, not environment

### **4. Workspace Package Rebuilds**
- ✅ Packages are built (dist/ folders exist)
- ✅ Local development works fine
- ❌ Production bundle can't resolve workspace packages

---

## 💡 **CORE QUESTION FOR CHATGPT**

**How do we configure esbuild to properly bundle workspace packages instead of externalizing them?**

### **Specific Issues:**
1. **Should we remove `'@aiglossarypro/*'` from external array?**
2. **How to handle workspace package resolution in esbuild?**
3. **Do we need different bundle strategy for monorepo packages?**
4. **Should we use different bundler (webpack, rollup) instead?**

---

## 🎯 **DESIRED OUTCOME**

### **Working Bundle Should:**
1. **Include actual code** from `@aiglossarypro/database/db/support-schema` 
2. **Not contain** `require("@aiglossarypro/database/...")` statements
3. **Bundle workspace dependencies** like any other npm package
4. **Run successfully** in PM2 production environment

### **Success Test:**
```bash
curl http://52.0.112.85:8080/health
# Should return: {"status": "healthy", "timestamp": "..."}
```

---

## 🔧 **CURRENT WORKING DIRECTORY CONTEXT**

### **Local Development** (✅ Works)
- `pnpm dev` runs perfectly
- All workspace packages resolve correctly
- TypeScript compilation successful

### **Production Bundle** (❌ Fails)
- Bundle created successfully (no build errors)
- Runtime fails on workspace package imports
- File exists but Node.js can't resolve it

---

## 📊 **ESBUILD CONFIGURATION OPTIONS TO EXPLORE**

### **Option 1: Remove Workspace External**
```javascript
const external = [
  // '@aiglossarypro/*',  // Remove this line?
  'fs', 'path', 'url', // ... keep Node.js builtins
];
```

### **Option 2: Explicit Package Inclusion**
```javascript
const external = [
  '!@aiglossarypro/*',  // Force include
  '@aiglossarypro/database',  // Or specific packages?
];
```

### **Option 3: Custom Resolver Plugin**
```javascript
plugins: [{
  name: 'workspace-resolver',
  setup(build) {
    // Custom resolution for workspace packages
  }
}]
```

---

## 🚀 **IMMEDIATE TESTING STRATEGY**

### **Quick Test Approach:**
1. **Try configuration suggestion from ChatGPT**
2. **Build locally**: `pnpm build:api-ec2-fixed`  
3. **Check bundle**: `grep "@aiglossarypro" dist/index.js`
4. **Deploy to EC2**: Transfer and restart PM2
5. **Verify**: `curl http://52.0.112.85:8080/health`

### **Time Constraint:**
- ⏰ **Redis deletion warning** requires resolution within hours
- 🔄 **Fast iteration needed** - test configurations quickly
- 📈 **Each attempt takes ~10 minutes** (build + deploy + test)

---

## 🆘 **SPECIFIC CHATGPT REQUESTS**

### **Primary Request:**
**"How do I configure esbuild to bundle workspace packages in a pnpm monorepo instead of externalizing them?"**

### **Secondary Questions:**
1. **Should external array exclude or include `@aiglossarypro/*`?**
2. **Are there esbuild plugins needed for workspace resolution?** 
3. **Is there a better bundler for this use case?**
4. **How do other teams handle monorepo production bundling?**

### **Context to Mention:**
- Using pnpm workspaces
- Node.js production deployment 
- Files exist but runtime resolution fails
- Local development works, production bundle fails

---

## 📋 **SUCCESS CRITERIA**

### **Immediate (30 min):**
- [ ] Bundle contains actual workspace package code
- [ ] No `require("@aiglossarypro/...")` in dist/index.js  
- [ ] API starts without module resolution errors

### **Validation (60 min):**
- [ ] Health endpoint returns 200 OK
- [ ] Basic API functionality works
- [ ] Redis deletion warning resolved
- [ ] Ready for Firebase user testing

---

**URGENT**: Please provide esbuild configuration to resolve workspace package bundling in monorepo production deployment.

**Current Status**: Production API down, Redis at risk, need immediate solution to get app live for testing.