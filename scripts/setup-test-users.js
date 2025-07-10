/**
 * Setup Test Users Script
 * Creates the test users in Firebase if they don't exist
 */

// Use dynamic import for fetch
const fetch = (await import('node-fetch')).default;

const BASE_URL = 'http://localhost:3001';

const TEST_USERS = [
  {
    email: 'test@aimlglossary.com',
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User',
    type: 'regular'
  },
  {
    email: 'premium@aimlglossary.com', 
    password: 'premiumpass123',
    firstName: 'Premium',
    lastName: 'User',
    type: 'premium'
  },
  {
    email: 'admin@aimlglossary.com',
    password: 'adminpass123',
    firstName: 'Admin',
    lastName: 'User',
    type: 'admin'
  }
];

async function createTestUser(userData) {
  try {
    console.log(`📝 Creating test user: ${userData.email}`);
    
    const response = await fetch(`${BASE_URL}/api/auth/firebase/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Successfully created ${userData.type} user: ${userData.email}`);
      return true;
    } else if (response.status === 409) {
      console.log(`ℹ️  User already exists: ${userData.email}`);
      return true;
    } else {
      console.log(`❌ Failed to create user ${userData.email}: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message);
    return false;
  }
}

async function setupTestUsers() {
  console.log('🚀 Setting up Firebase test users...');
  console.log('=====================================\\n');

  // Check if server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/health`);
    if (!healthCheck.ok) {
      throw new Error('Server health check failed');
    }
    console.log('✅ Backend server is running\\n');
  } catch (error) {
    console.log('⚠️  Cannot connect to backend server. Trying to proceed anyway...');
    console.log('   Make sure the server is running with: npm run dev\\n');
  }

  let successCount = 0;
  
  for (const userData of TEST_USERS) {
    const success = await createTestUser(userData);
    if (success) successCount++;
    console.log(''); // Add spacing
  }

  console.log('=====================================');
  console.log(`📊 Summary: ${successCount}/${TEST_USERS.length} users ready`);
  
  if (successCount === TEST_USERS.length) {
    console.log('🎉 All test users are ready!');
    console.log('\\n💡 You can now use these accounts in the login page:');
    TEST_USERS.forEach(user => {
      console.log(`   ${user.type.toUpperCase()}: ${user.email} / ${user.password}`);
    });
  } else {
    console.log('⚠️  Some users could not be created. Check the errors above.');
  }
}

// Run the setup
setupTestUsers().catch(console.error);