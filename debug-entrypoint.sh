#!/bin/sh

# Debug entrypoint script to capture early startup issues
echo "[DEBUG] Container starting at $(date)" >&2
echo "[DEBUG] Environment: NODE_ENV=$NODE_ENV, PORT=${PORT:-8080}" >&2
echo "[DEBUG] Working directory: $(pwd)" >&2
echo "[DEBUG] User: $(whoami)" >&2
echo "[DEBUG] Node version: $(node --version 2>&1)" >&2

# Check if node is executable
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js not found or not executable!" >&2
    exit 1
fi

# List files in current directory
echo "[DEBUG] Files in /app:" >&2
ls -la /app 2>&1 | head -10 >&2

# Check for the main application file
if [ -f "simple-api.js" ]; then
    echo "[DEBUG] Found simple-api.js" >&2
elif [ -f "dist/index.js" ]; then
    echo "[DEBUG] Found dist/index.js" >&2
elif [ -f "index.js" ]; then
    echo "[DEBUG] Found index.js" >&2
else
    echo "[ERROR] No application entry point found!" >&2
    echo "[DEBUG] Searching for .js files:" >&2
    find . -name "*.js" -type f | head -10 >&2
    exit 1
fi

# Try to load basic modules
echo "[DEBUG] Testing Node.js module loading..." >&2
node -e "console.error('[DEBUG] Basic Node test passed'); try { require('express'); console.error('[DEBUG] Express loaded successfully'); } catch(e) { console.error('[ERROR] Failed to load express:', e.message); }" 2>&1

# Start the actual application
echo "[DEBUG] Starting application..." >&2

# Determine which file to run
if [ -f "simple-api.js" ]; then
    exec node simple-api.js
elif [ -f "dist/index.js" ]; then
    exec node dist/index.js
elif [ -f "index.js" ]; then
    exec node index.js
else
    echo "[ERROR] Could not determine entry point!" >&2
    exit 1
fi