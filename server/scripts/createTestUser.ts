/**
 * Create Test User for Development
 * Creates a Firebase test user and corresponding database record
 */

import { createFirebaseUser, setCustomUserClaims } from '../config/firebase';
import { optimizedStorage as storage } from '../optimizedStorage';
import { log } from '../utils/logger';

const TEST_USER_EMAIL = 'test@aimlglossary.com';
const TEST_USER_PASSWORD = 'testpass123';
const TEST_ADMIN_EMAIL = 'admin@aimlglossary.com';
const TEST_ADMIN_PASSWORD = 'adminpass123';

async function createTestUsers() {
  try {
    console.log('🔥 Creating Firebase test users...');

    // Create regular test user
    console.log('Creating regular test user...');
    const testUser = await createFirebaseUser(
      TEST_USER_EMAIL,
      TEST_USER_PASSWORD,
      'Test User'
    );

    if (testUser) {
      // Create database record
      const dbUser = await storage.upsertUser({
        email: TEST_USER_EMAIL,
        firstName: 'Test',
        lastName: 'User',
        authProvider: 'email',
        firebaseUid: testUser.uid,
        lifetimeAccess: false,
        isAdmin: false
      });

      console.log('✅ Regular test user created:', {
        firebase: testUser.uid,
        database: dbUser?.id,
        email: TEST_USER_EMAIL
      });
    }

    // Create admin test user
    console.log('Creating admin test user...');
    const adminUser = await createFirebaseUser(
      TEST_ADMIN_EMAIL,
      TEST_ADMIN_PASSWORD,
      'Admin User'
    );

    if (adminUser) {
      // Set admin custom claims in Firebase
      await setCustomUserClaims(adminUser.uid, { admin: true });

      // Create database record with admin privileges
      const dbAdminUser = await storage.upsertUser({
        email: TEST_ADMIN_EMAIL,
        firstName: 'Admin',
        lastName: 'User',
        authProvider: 'email',
        firebaseUid: adminUser.uid,
        lifetimeAccess: true,
        isAdmin: true
      });

      console.log('✅ Admin test user created:', {
        firebase: adminUser.uid,
        database: dbAdminUser?.id,
        email: TEST_ADMIN_EMAIL,
        isAdmin: true
      });
    }

    console.log('\n🎯 Test Users Ready:');
    console.log('Regular User:');
    console.log(`  Email: ${TEST_USER_EMAIL}`);
    console.log(`  Password: ${TEST_USER_PASSWORD}`);
    console.log('Admin User:');
    console.log(`  Email: ${TEST_ADMIN_EMAIL}`);
    console.log(`  Password: ${TEST_ADMIN_PASSWORD}`);
    console.log('\n✨ You can now test login with these credentials!');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  }
}

// Run if called directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { createTestUsers, TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD };