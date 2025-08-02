/**
 * API Endpoint Integration Test
 * Tests the actual API endpoints to ensure they're working
 */
import fetch from 'node-fetch';
const BASE_URL = 'http://localhost:3001';
const results = [];
async function testEndpoint(method, endpoint, body) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const result = {
            endpoint,
            method,
            status: response.status,
            success: response.ok,
        };
        if (!response.ok && response.status !== 401) {
            try {
                const errorData = await response.json();
                result.error = errorData.message || `Status: ${response.status}`;
            }
            catch {
                result.error = `Status: ${response.status}`;
            }
        }
        results.push(result);
        return response;
    }
    catch (error) {
        results.push({
            endpoint,
            method,
            status: 0,
            success: false,
            error: error.message,
        });
        return null;
    }
}
async function runTests() {
    console.log('🚀 Testing API Endpoints\n');
    console.log(`Testing against: ${BASE_URL}\n`);
    // Test Learning Paths endpoints
    console.log('📚 Testing Learning Paths Endpoints...');
    await testEndpoint('GET', '/api/learning-paths');
    await testEndpoint('GET', '/api/learning-paths?limit=5');
    await testEndpoint('GET', '/api/learning-paths?difficulty=beginner');
    // Test a non-existent learning path
    await testEndpoint('GET', '/api/learning-paths/test-id-123');
    // Test authenticated endpoints (should return 401 without auth)
    await testEndpoint('POST', '/api/learning-paths', {
        name: 'Test Learning Path',
        description: 'Test Description',
    });
    await testEndpoint('GET', '/api/learning-paths/progress');
    await testEndpoint('GET', '/api/learning-paths/recommended');
    // Test Code Examples endpoints
    console.log('\n💻 Testing Code Examples Endpoints...');
    await testEndpoint('GET', '/api/code-examples');
    await testEndpoint('GET', '/api/code-examples?language=python');
    await testEndpoint('GET', '/api/code-examples?difficulty=beginner');
    // Test a non-existent code example
    await testEndpoint('GET', '/api/code-examples/test-id-456');
    // Test term-specific code examples
    await testEndpoint('GET', '/api/terms/test-term-id/code-examples');
    // Test authenticated endpoints
    await testEndpoint('POST', '/api/code-examples', {
        title: 'Test Code Example',
        language: 'python',
        code: 'print("Hello World")',
    });
    await testEndpoint('POST', '/api/code-examples/test-id/vote', { vote: 'up' });
    await testEndpoint('POST', '/api/code-examples/test-id/run', {
        execution_time: 100,
        success: true,
    });
    // Test health check
    console.log('\n🏥 Testing Health Check...');
    await testEndpoint('GET', '/api/health');
    // Print results
    console.log('\n📊 Test Results:\n');
    console.log('Endpoint                                          | Method | Status | Result');
    console.log('--------------------------------------------------|--------|--------|--------');
    results.forEach(result => {
        const endpoint = result.endpoint.padEnd(48);
        const method = result.method.padEnd(6);
        const status = result.status.toString().padEnd(6);
        const icon = result.success ? '✅' : result.status === 401 ? '🔒' : '❌';
        console.log(`${endpoint} | ${method} | ${status} | ${icon}`);
        if (result.error && result.status !== 401) {
            console.log(`   └─ Error: ${result.error}`);
        }
    });
    // Summary
    const successful = results.filter(r => r.success || r.status === 401).length;
    const failed = results.filter(r => !r.success && r.status !== 401).length;
    const authRequired = results.filter(r => r.status === 401).length;
    console.log('\n📈 Summary:');
    console.log(`Total Endpoints Tested: ${results.length}`);
    console.log(`✅ Successful: ${successful - authRequired}`);
    console.log(`🔒 Auth Required (Expected): ${authRequired}`);
    console.log(`❌ Failed: ${failed}`);
    if (failed === 0) {
        console.log('\n🎉 All API endpoints are responding correctly!');
    }
    else {
        console.log('\n⚠️  Some endpoints failed. Please check the server logs.');
    }
}
// Check if server is running first
async function checkServer() {
    try {
        const response = await fetch(`${BASE_URL}/api/health`);
        if (response.ok) {
            console.log('✅ Server is running\n');
            return true;
        }
    }
    catch (_error) {
        console.log('❌ Server is not running');
        console.log('Please start the server with: npm run dev\n');
        return false;
    }
}
// Main execution
(async () => {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await runTests();
    }
})();
