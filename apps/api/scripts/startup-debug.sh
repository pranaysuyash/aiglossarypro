#!/bin/bash
set -e

echo "=== AIGlossaryPro API Startup Debug Script ==="
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "NODE_ENV: ${NODE_ENV}"
echo "Working directory: $(pwd)"
echo "Node version: $(node --version)"

# Function to check environment variable
check_env() {
    local var_name=$1
    local var_value="${!var_name}"
    if [ -n "$var_value" ]; then
        echo "✅ $var_name: Set (length: ${#var_value})"
    else
        echo "❌ $var_name: Not set"
    fi
}

echo ""
echo "=== Environment Variables Check ==="
echo "Critical variables:"
check_env "DATABASE_URL"
check_env "SESSION_SECRET"
check_env "JWT_SECRET"
check_env "NODE_ENV"
check_env "PORT"

echo ""
echo "Service configurations:"
check_env "POSTHOG_API_KEY"
check_env "POSTHOG_HOST"
check_env "REDIS_ENABLED"
check_env "UPSTASH_REDIS_REST_URL"
check_env "UPSTASH_REDIS_REST_TOKEN"
check_env "EMAIL_ENABLED"
check_env "EMAIL_SERVICE"
check_env "RESEND_API_KEY"

echo ""
echo "Authentication:"
check_env "FIREBASE_PROJECT_ID"
check_env "FIREBASE_CLIENT_EMAIL"
check_env "FIREBASE_PRIVATE_KEY_BASE64"

echo ""
echo "=== Testing Database Connection ==="
# Simple Node.js script to test database connection
node -e "
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

async function testConnection() {
    console.log('Creating connection pool...');
    const pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 10000,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log('Attempting to connect...');
        const client = await pool.connect();
        console.log('✅ Database connection successful!');
        
        const result = await client.query('SELECT NOW()');
        console.log('Database time:', result.rows[0].now);
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Error code:', error.code);
        if (error.code === 'ECONNREFUSED') {
            console.error('Cannot reach database host. Check security groups and network configuration.');
        }
        process.exit(1);
    }
}

testConnection();
"

echo ""
echo "=== Checking file structure ==="
if [ -f "dist/index.js" ]; then
    echo "✅ dist/index.js exists"
    ls -la dist/
else
    echo "❌ dist/index.js not found!"
    echo "Current directory contents:"
    ls -la
    if [ -d "dist" ]; then
        echo "dist directory contents:"
        ls -la dist/
    fi
    exit 1
fi

echo ""
echo "=== Starting application with enhanced logging ==="
# Use exec to replace shell process with node
exec node dist/index.js