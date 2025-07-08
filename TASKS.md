# Development Environment Setup & Auth Debugging

## Firebase Authentication & Environment Variables

To ensure the backend always uses real Firebase authentication (never mock auth):

### 1. Dotenv Loading
- The backend (`server/index.ts`) **must load `.env` using `dotenv.config()` at the very top, before any other import**.
- This guarantees all environment variables are available to the backend, including `FIREBASE_PRIVATE_KEY_BASE64`.

### 2. Dev Script Environment Inheritance
- The dev script (`scripts/dev-start.js`) **must spawn the backend with `env: process.env`** to guarantee the backend process inherits all environment variables from the parent shell.
- This is now implemented as:
  ```js
  const serverProcess = spawnWithLogging('npm', ['run', 'dev:server'], {
    prefix: 'dev:server',
    cwd: process.cwd(),
    env: process.env
  });
  ```

### 3. Debugging
- On backend startup, you should see log lines like:
  ```
  FIREBASE_PROJECT_ID: ...
  FIREBASE_CLIENT_EMAIL: ...
  FIREBASE_PRIVATE_KEY_BASE64: set
  info: ✅ Firebase authentication setup complete (Google, GitHub, Email/Password)
  ```
- If you see `mock authentication` in logs, check the above two points.

### 4. If You Add New Env Vars
- Always restart the dev server after changing `.env`.

---

## Why This Matters
- If the backend does not load the environment correctly, it will fall back to mock authentication, causing all users to appear as premium/admin.
- This setup guarantees that test users (free, premium, admin) are correctly recognized by the backend.

---

## Quick Checklist
- [x] `dotenv.config()` is the first line in `server/index.ts`
- [x] `env: process.env` is passed to backend in `scripts/dev-start.js`
- [x] Backend logs show Firebase env vars and `Firebase authentication setup complete`
- [x] Free users show as free, not premium 