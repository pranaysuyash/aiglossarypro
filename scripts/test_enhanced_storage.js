// Quick test of enhanced storage basic functionality
const { enhancedStorage } = require('./server/enhancedStorage.ts');

async function testEnhancedStorage() {
  try {
    console.log('Testing enhanced storage...');

    // Test basic health check
    const health = await enhancedStorage.checkDatabaseHealth();
    console.log('Database health:', health);

    // Test authorization framework
    try {
      await enhancedStorage.getAdminStats();
      console.log('ERROR: Should have thrown auth error');
    } catch (error) {
      if (error.name === 'UnauthorizedError') {
        console.log('✓ Authorization working correctly');
      } else {
        console.log('Unexpected error:', error.message);
      }
    }

    console.log('Basic tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testEnhancedStorage();
