#!/usr/bin/env bash

echo "🔄 Stopping development servers..."

# Kill any existing development processes
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true  
pkill -f "vite.*dev" 2>/dev/null || true
pkill -f "dev-start" 2>/dev/null || true

# Kill processes on specific ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "⏱️  Waiting for processes to terminate..."
sleep 3

echo "🚀 Starting development servers..."
cd /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro
npm run dev
