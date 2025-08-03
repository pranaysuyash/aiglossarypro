#!/bin/sh
set -e

echo "=== AIGlossaryPro API Startup Script ==="
echo "NODE_ENV: ${NODE_ENV}"
echo "Working directory: $(pwd)"
echo "Starting application with deferred initialization..."

# Start the application - all initialization happens after server starts
exec node dist/index.js