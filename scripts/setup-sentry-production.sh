#!/bin/bash

# Sentry Production Setup Script
# This script helps configure Sentry for AI Glossary Pro error tracking

echo "🔍 Setting up Sentry Error Tracking for AI Glossary Pro"
echo "======================================================="

# Check if required tools are available
command -v curl >/dev/null 2>&1 || { echo "❌ curl is required but not installed. Aborting." >&2; exit 1; }

# Function to generate a random string for release
generate_release() {
    echo "aiglossary-pro@$(date +%Y%m%d.%H%M%S)-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}

# Function to validate Sentry DSN format
validate_dsn() {
    local dsn="$1"
    if [[ $dsn =~ ^https://[a-f0-9]+@[a-z0-9-]+\.ingest\.sentry\.io/[0-9]+$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to test Sentry connection
test_sentry_connection() {
    local dsn="$1"
    echo "🧪 Testing Sentry connection..."
    
    # Extract project ID from DSN
    project_id=$(echo "$dsn" | sed -n 's|.*/\([0-9]*\)$|\1|p')
    org_slug=$(echo "$dsn" | sed -n 's|.*@\([^.]*\)\..*|\1|p')
    
    if [ -z "$project_id" ] || [ -z "$org_slug" ]; then
        echo "❌ Could not extract project details from DSN"
        return 1
    fi
    
    echo "   Project ID: $project_id"
    echo "   Organization: $org_slug"
    
    # Test connection by sending a test event
    local test_payload=$(cat <<EOF
{
  "message": "Sentry setup test from AI Glossary Pro",
  "level": "info",
  "platform": "node",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "server_name": "$(hostname)",
  "release": "$(generate_release)",
  "environment": "production",
  "tags": {
    "component": "setup-script",
    "test": "true"
  },
  "extra": {
    "setup_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
    "script_version": "1.0.0"
  }
}
EOF
)
    
    # Send test event
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Sentry-Auth: Sentry sentry_version=7, sentry_key=$(echo "$dsn" | sed -n 's|https://\([^@]*\)@.*|\1|p'), sentry_client=setup-script/1.0.0" \
        -d "$test_payload" \
        "$dsn")
    
    http_status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://')
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_status" = "200" ]; then
        echo "✅ Sentry connection test successful"
        echo "   Event ID: $(echo "$response_body" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)"
        return 0
    else
        echo "❌ Sentry connection test failed (HTTP $http_status)"
        echo "   Response: $response_body"
        return 1
    fi
}

# Interactive setup
echo ""
echo "📋 Sentry Configuration Setup"
echo "============================="

# Check if DSN is already configured
if [ -f ".env.production" ] && grep -q "SENTRY_DSN=" .env.production; then
    current_dsn=$(grep "SENTRY_DSN=" .env.production | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    if [ -n "$current_dsn" ] && [ "$current_dsn" != "https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567" ]; then
        echo "📝 Current Sentry DSN found: ${current_dsn:0:50}..."
        read -p "Do you want to test the existing configuration? (y/n): " test_existing
        
        if [[ $test_existing =~ ^[Yy]$ ]]; then
            if test_sentry_connection "$current_dsn"; then
                echo "✅ Existing Sentry configuration is working!"
                echo ""
                echo "🎯 Next Steps:"
                echo "1. Your Sentry error tracking is already configured"
                echo "2. Run: node scripts/test-sentry-setup.js"
                echo "3. Deploy your application to start receiving error reports"
                exit 0
            else
                echo "❌ Existing configuration failed. Let's set up a new one."
            fi
        fi
    fi
fi

echo ""
echo "🔑 Setting up new Sentry configuration..."
echo ""
echo "To get your Sentry DSN:"
echo "1. Go to https://sentry.io"
echo "2. Create an account or log in"
echo "3. Create a new project:"
echo "   - Platform: Node.js (for backend)"
echo "   - Framework: Express"
echo "   - Name: AI Glossary Pro"
echo "4. Copy the DSN from the project settings"
echo ""

# Get DSN from user
while true; do
    read -p "Enter your Sentry DSN: " sentry_dsn
    
    if [ -z "$sentry_dsn" ]; then
        echo "❌ DSN cannot be empty"
        continue
    fi
    
    if validate_dsn "$sentry_dsn"; then
        echo "✅ DSN format is valid"
        break
    else
        echo "❌ Invalid DSN format. Should look like:"
        echo "   https://abc123@o123456.ingest.sentry.io/1234567"
        echo ""
    fi
done

# Test the connection
echo ""
if test_sentry_connection "$sentry_dsn"; then
    echo "✅ Sentry connection successful!"
else
    echo "❌ Connection failed. Please check your DSN and try again."
    exit 1
fi

# Get environment name
echo ""
read -p "Enter environment name (default: production): " sentry_env
sentry_env=${sentry_env:-production}

# Generate release version
release_version=$(generate_release)
echo ""
echo "📦 Generated release version: $release_version"

# Update environment files
echo ""
echo "📝 Updating environment configuration..."

# Update .env.production
if [ -f ".env.production" ]; then
    # Update existing file
    if grep -q "SENTRY_DSN=" .env.production; then
        sed -i.bak "s|SENTRY_DSN=.*|SENTRY_DSN=$sentry_dsn|g" .env.production
    else
        echo "SENTRY_DSN=$sentry_dsn" >> .env.production
    fi
    
    if grep -q "SENTRY_ENVIRONMENT=" .env.production; then
        sed -i.bak "s|SENTRY_ENVIRONMENT=.*|SENTRY_ENVIRONMENT=$sentry_env|g" .env.production
    else
        echo "SENTRY_ENVIRONMENT=$sentry_env" >> .env.production
    fi
    
    if grep -q "SENTRY_RELEASE=" .env.production; then
        sed -i.bak "s|SENTRY_RELEASE=.*|SENTRY_RELEASE=$release_version|g" .env.production
    else
        echo "SENTRY_RELEASE=$release_version" >> .env.production
    fi
    
    # Frontend Sentry DSN
    if grep -q "VITE_SENTRY_DSN=" .env.production; then
        sed -i.bak "s|VITE_SENTRY_DSN=.*|VITE_SENTRY_DSN=$sentry_dsn|g" .env.production
    else
        echo "VITE_SENTRY_DSN=$sentry_dsn" >> .env.production
    fi
    
    echo "✅ Updated .env.production"
else
    # Create new file
    cat > .env.production << EOF
# Sentry Error Tracking Configuration
SENTRY_DSN=$sentry_dsn
SENTRY_ENVIRONMENT=$sentry_env
SENTRY_RELEASE=$release_version
VITE_SENTRY_DSN=$sentry_dsn
EOF
    echo "✅ Created .env.production with Sentry configuration"
fi

# Update .env.production.example
if [ -f ".env.production.example" ]; then
    if grep -q "SENTRY_DSN=" .env.production.example; then
        sed -i.bak "s|SENTRY_DSN=.*|SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567|g" .env.production.example
    fi
    
    if grep -q "VITE_SENTRY_DSN=" .env.production.example; then
        sed -i.bak "s|VITE_SENTRY_DSN=.*|VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567|g" .env.production.example
    fi
    
    echo "✅ Updated .env.production.example with placeholder DSN"
fi

# Create Sentry configuration validation script
echo ""
echo "🧪 Creating Sentry test script..."

cat > scripts/test-sentry-setup.js << 'EOF'
#!/usr/bin/env node

/**
 * Sentry Setup Test Script
 * Tests Sentry configuration and error tracking functionality
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

import { initializeSentry, captureException, captureMessage, setUser, addBreadcrumb, isSentryEnabled } from '../server/config/sentry.js';

async function testSentrySetup() {
  console.log('🔍 Testing Sentry Setup for AI Glossary Pro');
  console.log('==========================================');
  
  // Test 1: Check configuration
  console.log('\n📋 Test 1: Configuration Check');
  console.log('------------------------------');
  
  const sentryDsn = process.env.SENTRY_DSN;
  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;
  const release = process.env.SENTRY_RELEASE;
  
  console.log(`Sentry DSN: ${sentryDsn ? sentryDsn.substring(0, 50) + '...' : 'NOT SET'}`);
  console.log(`Environment: ${environment}`);
  console.log(`Release: ${release}`);
  console.log(`Sentry Enabled: ${isSentryEnabled()}`);
  
  if (!sentryDsn) {
    console.log('❌ Sentry DSN not configured');
    process.exit(1);
  }
  
  // Test 2: Initialize Sentry
  console.log('\n🚀 Test 2: Sentry Initialization');
  console.log('--------------------------------');
  
  try {
    initializeSentry();
    console.log('✅ Sentry initialized successfully');
  } catch (error) {
    console.log('❌ Sentry initialization failed:', error.message);
    process.exit(1);
  }
  
  // Test 3: User Context
  console.log('\n👤 Test 3: User Context');
  console.log('----------------------');
  
  setUser({
    id: 'test-user-123',
    email: 'test@example.com',
    username: 'testuser'
  });
  console.log('✅ User context set');
  
  // Test 4: Breadcrumbs
  console.log('\n🍞 Test 4: Breadcrumbs');
  console.log('---------------------');
  
  addBreadcrumb('Test breadcrumb', 'test', 'info', { timestamp: new Date().toISOString() });
  console.log('✅ Breadcrumb added');
  
  // Test 5: Custom Message
  console.log('\n📝 Test 5: Custom Message');
  console.log('-------------------------');
  
  const messageId = captureMessage('Sentry test message from setup script', 'info', {
    tags: { component: 'setup-test', version: '1.0.0' },
    extra: { testTimestamp: new Date().toISOString() }
  });
  
  if (messageId) {
    console.log(`✅ Message captured with ID: ${messageId}`);
  } else {
    console.log('ℹ️  Message capture skipped (development mode)');
  }
  
  // Test 6: Exception Capture
  console.log('\n🚨 Test 6: Exception Capture');
  console.log('----------------------------');
  
  const testError = new Error('Test error for Sentry validation');
  const errorId = captureException(testError, {
    tags: { errorType: 'test', component: 'setup' },
    extra: { testData: 'This is a test error' },
    level: 'warning'
  });
  
  if (errorId) {
    console.log(`✅ Exception captured with ID: ${errorId}`);
  } else {
    console.log('ℹ️  Exception capture skipped (development mode)');
  }
  
  // Test 7: Performance Transaction
  console.log('\n⚡ Test 7: Performance Transaction');
  console.log('---------------------------------');
  
  const { startTransaction } = await import('../server/config/sentry.js');
  const transaction = startTransaction('test-operation', 'task', 'Testing Sentry performance monitoring');
  
  if (transaction) {
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    transaction.finish();
    console.log('✅ Performance transaction completed');
  } else {
    console.log('ℹ️  Performance transaction skipped (development mode)');
  }
  
  // Summary
  console.log('\n🎉 Sentry Setup Test Complete');
  console.log('=============================');
  
  if (isSentryEnabled()) {
    console.log('✅ Sentry is properly configured and enabled');
    console.log('📊 Check your Sentry dashboard for test events:');
    console.log(`   https://sentry.io/organizations/your-org/issues/`);
    console.log('');
    console.log('🚀 Your application is ready for production error tracking!');
  } else {
    console.log('ℹ️  Sentry is configured but disabled (development mode)');
    console.log('🔧 Set NODE_ENV=production to enable error tracking');
  }
  
  process.exit(0);
}

// Handle errors in the test script itself
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception in test script:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection in test script:', reason);
  process.exit(1);
});

// Run the test
testSentrySetup().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
EOF

chmod +x scripts/test-sentry-setup.js

# Test the setup
echo ""
echo "🧪 Running Sentry configuration test..."

if NODE_ENV=production node scripts/test-sentry-setup.js; then
    echo "✅ Sentry setup test passed!"
else
    echo "❌ Sentry setup test failed. Please check the configuration."
    exit 1
fi

# Create monitoring script
echo ""
echo "📊 Creating Sentry monitoring script..."

cat > scripts/sentry-status.sh << 'EOF'
#!/bin/bash

# Sentry Status Check Script

echo "📊 Sentry Status Report"
echo "======================"

# Check environment variables
echo "🔧 Configuration:"
echo "  SENTRY_DSN: $(if [ -n "$SENTRY_DSN" ]; then echo "${SENTRY_DSN:0:50}..."; else echo "NOT SET"; fi)"
echo "  SENTRY_ENVIRONMENT: ${SENTRY_ENVIRONMENT:-NOT SET}"
echo "  SENTRY_RELEASE: ${SENTRY_RELEASE:-NOT SET}"
echo "  NODE_ENV: ${NODE_ENV:-NOT SET}"

# Check if Sentry dependencies are installed
echo ""
echo "📦 Dependencies:"
if command -v npm >/dev/null 2>&1; then
    backend_sentry=$(npm list @sentry/node 2>/dev/null | grep @sentry/node || echo "NOT INSTALLED")
    frontend_sentry=$(npm list @sentry/react 2>/dev/null | grep @sentry/react || echo "NOT INSTALLED")
    
    echo "  Backend (@sentry/node): $backend_sentry"
    echo "  Frontend (@sentry/react): $frontend_sentry"
else
    echo "  npm not available - cannot check dependencies"
fi

# Check configuration files
echo ""
echo "📁 Configuration Files:"
if [ -f "server/config/sentry.ts" ]; then
    echo "  ✅ Backend config: server/config/sentry.ts"
else
    echo "  ❌ Backend config: NOT FOUND"
fi

if [ -f "client/src/utils/sentry.ts" ]; then
    echo "  ✅ Frontend config: client/src/utils/sentry.ts"
else
    echo "  ❌ Frontend config: NOT FOUND"
fi

# Check environment files
echo ""
echo "🔧 Environment Files:"
if [ -f ".env.production" ]; then
    echo "  ✅ .env.production exists"
    if grep -q "SENTRY_DSN=" .env.production; then
        echo "    ✅ Contains SENTRY_DSN"
    else
        echo "    ❌ Missing SENTRY_DSN"
    fi
else
    echo "  ❌ .env.production not found"
fi

# Test basic connectivity
echo ""
echo "🌐 Connectivity Test:"
if [ -n "$SENTRY_DSN" ]; then
    project_url=$(echo "$SENTRY_DSN" | sed 's|/[0-9]*$||')
    if curl -s --head "$project_url" | head -n 1 | grep -q "200 OK"; then
        echo "  ✅ Sentry endpoint reachable"
    else
        echo "  ❌ Cannot reach Sentry endpoint"
    fi
else
    echo "  ⚠️  No DSN configured - skipping connectivity test"
fi

echo ""
echo "🎯 Recommendations:"
if [ -z "$SENTRY_DSN" ]; then
    echo "  - Configure SENTRY_DSN in .env.production"
fi
if [ "$NODE_ENV" != "production" ]; then
    echo "  - Set NODE_ENV=production to enable Sentry in production"
fi
echo "  - Run: node scripts/test-sentry-setup.js"
echo "  - Check Sentry dashboard for incoming events"
EOF

chmod +x scripts/sentry-status.sh

# Final instructions
echo ""
echo "🎉 Sentry Setup Complete!"
echo "========================"
echo ""
echo "✅ Configuration Summary:"
echo "  - Sentry DSN configured in .env.production"
echo "  - Frontend and backend integration ready"
echo "  - Test scripts created"
echo "  - Monitoring tools available"
echo ""
echo "🔧 Available Commands:"
echo "  - Test setup: node scripts/test-sentry-setup.js"
echo "  - Check status: ./scripts/sentry-status.sh"
echo "  - View logs: Check your Sentry dashboard"
echo ""
echo "📊 Sentry Dashboard:"
echo "  - Login to: https://sentry.io"
echo "  - View project: Your configured project"
echo "  - Monitor errors in real-time"
echo ""
echo "🚀 Next Steps:"
echo "  1. Deploy your application with the new configuration"
echo "  2. Monitor the Sentry dashboard for incoming events"
echo "  3. Set up alerts and notifications in Sentry"
echo "  4. Configure team members and access controls"
echo ""
echo "✨ Your application now has comprehensive error tracking!"