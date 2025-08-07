# Front‑End Production Build Fix (August 2025)
_AIGlossaryPro – Eliminating raw `.tsx` artifacts in Vite builds_

---

## 1  |  Problem Statement

Until 4 Aug 2025, every production build created **raw TypeScript bundles**:

```
dist/public/assets/App‑xxxxxxxx.tsx
dist/public/assets/main‑xxxxxxxx.tsx
```

Browsers refused to execute those files (wrong MIME), CloudFront served 403s, and the site stalled on the loading skeleton.

Root cause: **Vite / Rollup HTML‑plugin bug** (entry file + `React.lazy` chain) that bypassed esbuild and wrote the original `.tsx` source.

---

## 2  |  Solution Overview (ChatGPT "Solution A")

1. **Transpile everything again** inside Rollup with  
   `@rollup/plugin-typescript`
2. **Rename any lingering `.tsx` artifact to `.js`** during `generateBundle`
   and `writeBundle` hooks (`rollup-plugin-rename` style, inlined below).

Outcome: final bundle contains only `.js` files → browser and CDN happy.

---

## 3  |  Implementation Details

### 3.1  New production‑only Vite config  
File: `apps/web/vite.config.prod.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import ts from '@rollup/plugin-typescript';

/** Rename .tsx → .js in final output */
function renameTSX() {
  return {
    name: 'rename‑tsx',
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.tsx')) {
          const newName = fileName.replace(/\.tsx$/, '.js');
          // @ts‑ignore – mutate bundle in‑place
          bundle[newName] = { ...chunk, fileName: newName };
          delete bundle[fileName];
        }
      }
    },
    writeBundle(opts) {
      // filesystem rename for safety
      if (opts.dir) {
        const fs = require('fs');
        fs.readdirSync(opts.dir)
          .filter(f => f.endsWith('.tsx'))
          .forEach(f =>
            fs.renameSync(`${opts.dir}/${f}`, `${opts.dir}/${f.replace(/\.tsx$/, '.js')}`)
          );
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), ts({ tsconfig: './tsconfig.json', noEmitOnError: false }), renameTSX()],
  build: {
    outDir: 'dist/public',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
```

### 3.2  Package.json scripts (`apps/web`)

```jsonc
{
  "scripts": {
    "build":       "vite build",              // dev / preview
    "build:prod":  "vite build --config vite.config.prod.ts"
  }
}
```

### 3.3  GitHub Actions changes

`.github/workflows/production.yml` (frontend job snippet)

```yaml
- name: Build shared package
  run: pnpm --filter @aiglossarypro/shared run build

- name: Build frontend (production – TSX fix)
  run: pnpm --filter @aiglossarypro/web run build:prod

- name: Assert bundle is TS‑free
  run: |
    if grep -R --quiet "\.tsx" apps/web/dist/public; then
      echo "::error ::.tsx file detected in bundle"; exit 1;
    fi
```

> *Why the guard?* Future upgrades to Vite/Million should never re‑introduce this regression unnoticed.

### 3.4  S3 + CloudFront deployment steps (unchanged)

The existing `aws s3 sync …` + `aws cloudfront create-invalidation` logic remains intact; now it uploads only `.js` chunks.

---

## 4  |  Validation Results

| Check                                                   | Status                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Local `pnpm run build:prod` ➜ `dist/assets/*.tsx` count | **0**                                                                            |
| CI "Assert bundle is TS‑free" step                      | **Passed**                                                                       |
| S3 object listing                                       | No `.tsx` keys                                                                   |
| MIME check                                              | `curl -I https://<CF>/assets/main-*.js` ➜ `content-type: application/javascript` |
| Browser console                                         | No MIME or 403 errors                                                            |
| Full page load                                          | Glossary UI renders, routing works                                               |
| API health                                              | `https://<CF>/api/health` ➜ `{ "status": "healthy" }`                            |

Live site: [https://d1bnbqox1m8zqp.cloudfront.net/](https://d1bnbqox1m8zqp.cloudfront.net/)

---

## 5  |  Future Maintenance

* Keep this workaround until Vite ships a patch (tracked in **vitejs/vite#16773**).
* When upgrading Vite, **remove** the `renameTSX()` plug‑in and CI guard; run a test build to ensure no `.tsx` appears.
* Optionally re‑enable Million.js once Vite is stable; guard remains your safety net.

---

## 6  |  Rollback Procedure

1. In GitHub → Actions → select the previous successful "Deploy to Production" run.
2. Click **"Re‑run job"** with same commit (pipeline redeploys last‑known‑good Docker image & S3 bundle).
   *OR* manually update ECS task definition to prior revision `aiglossarypro-api:XX` and sync old `dist/` to S3.

---

### Appendix A – Package Versions

| Package                   | Version   |
| ------------------------- | --------- |
| vite                      | **7.0.6** |
| @vitejs/plugin-react-swc  | 3.5.x     |
| @rollup/plugin-typescript | 11.x      |
| react / react-dom         | 18.x      |
| pnpm                      | 9.x       |

### Appendix B – Useful commands

```bash
# local clean build
pnpm -F @aiglossarypro/web exec rimraf dist && pnpm -F @aiglossarypro/web run build:prod

# check for stray TSX
grep -R "\.tsx" apps/web/dist/public || echo "✅ bundle clean"

# test CloudFront
open https://d1bnbqox1m8zqp.cloudfront.net
```

---

*Document prepared 4 Aug 2025 – commit `a7baba09`.*