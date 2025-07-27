#!/usr/bin/env tsx

/**
 * Setup Test Users in Firebase and Database
 */

import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import logger from '../server/utils/logger';

const TEST_USERS = [
  {
    email: 'free@aiglossarypro.com',
    password: 'testpassword123',
    firstName: 'Free',
    lastName: 'Test',
    lifetimeAccess: false,
    isAdmin: false,
  },
  {
    email: 'premium@aiglossarypro.com',
    password: 'testpassword123',
    firstName: 'Premium',
    lastName: 'Test',
    lifetimeAccess: true,
    isAdmin: false,
  },
  {
    email: 'admin@aiglossarypro.com',
    password: 'adminpass123',
    firstName: 'Admin',
    lastName: 'Test',
    lifetimeAccess: true,
    isAdmin: true,
  },
];

async function setupTestUsers() {
  console.log('🔧 Setting up test users...\n');

  for (const testUser of TEST_USERS) {
    try {
      console.log(`📝 Processing ${testUser.email}...`);

      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, testUser.email))
        .limit(1);

      if (existingUser.length > 0) {
        // Update existing user
        await db
          .update(users)
          .set({
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            lifetimeAccess: testUser.lifetimeAccess,
            isAdmin: testUser.isAdmin,
            emailVerified: true,
            updatedAt: new Date(),
          })
          .where(eq(users.email, testUser.email));

        console.log(`  ✅ Updated existing user`);
        console.log(`  🎭 Access: ${testUser.isAdmin ? 'Admin' : testUser.lifetimeAccess ? 'Premium' : 'Basic'}`);
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(testUser.password, 10);

        await db.insert(users).values({
          email: testUser.email,
          password: hashedPassword,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          lifetimeAccess: testUser.lifetimeAccess,
          isAdmin: testUser.isAdmin,
          emailVerified: true,
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`  ✅ Created new user`);
        console.log(`  🎭 Access: ${testUser.isAdmin ? 'Admin' : testUser.lifetimeAccess ? 'Premium' : 'Basic'}`);
      }
    } catch (error: Error | unknown) {
      console.error(`  ❌ Error processing ${testUser.email}:`, error.message);
    }
  }

  console.log('\n✅ Test user setup complete!');
  console.log('\n📋 Test User Credentials:');
  console.log('========================');
  for (const user of TEST_USERS) {
    console.log(`\n${user.firstName} ${user.lastName} (${user.isAdmin ? 'Admin' : user.lifetimeAccess ? 'Premium' : 'Basic'})`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
  }
  
  console.log('\n⚠️  Note: These users are created in the database but still need to be registered with Firebase.');
  console.log('Firebase registration happens when users sign up through the UI or API.');
}

// Run the setup
setupTestUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });