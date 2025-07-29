#!/usr/bin/env tsx

/**
 * Direct Database Update for Test Users
 * Updates user permissions directly in the database
 */

import chalk from 'chalk';
import { optimizedStorage } from '../server/optimizedStorage';

const testUserUpdates = [
  {
    email: 'test@aimlglossary.com',
    updates: {
      isAdmin: false,
      lifetimeAccess: false,
      subscriptionTier: 'free',
    },
  },
  {
    email: 'premium@aimlglossary.com',
    updates: {
      isAdmin: false,
      lifetimeAccess: true,
      subscriptionTier: 'lifetime',
    },
  },
  {
    email: 'admin@aimlglossary.com',
    updates: {
      isAdmin: true,
      lifetimeAccess: true,
      subscriptionTier: 'admin',
    },
  },
];

async function updateTestUsersDirectly() {
  console.log(chalk.blue('🔧 Updating test users in database...'));

  for (const { email, updates } of testUserUpdates) {
    try {
      console.log(chalk.blue(`Updating user: ${email}`));

      // Get user by email first
      const user = await optimizedStorage.getUserByEmail(email);

      if (!user) {
        console.log(chalk.red(`❌ ${email} - User not found in database`));
        continue;
      }

      // Update user with new permissions
      await optimizedStorage.updateUser(user.id, updates);

      const userType = updates.isAdmin ? 'admin' : updates.lifetimeAccess ? 'premium' : 'free';
      console.log(chalk.green(`✅ ${email} - Updated to ${userType} user`));
    } catch (error) {
      console.error(chalk.red(`❌ ${email} - Error: ${error}`));
    }
  }

  console.log(chalk.blue('\n🧪 Verifying updates...'));

  // Verify the updates
  for (const { email, updates } of testUserUpdates) {
    try {
      const user = await optimizedStorage.getUserByEmail(email);
      if (user) {
        const userType = user.isAdmin ? 'admin' : user.lifetimeAccess ? 'premium' : 'free';
        console.log(chalk.green(`✅ ${email} - Verified as ${userType} user`));
        console.log(chalk.gray(`   - isAdmin: ${user.isAdmin}`));
        console.log(chalk.gray(`   - lifetimeAccess: ${user.lifetimeAccess}`));
        console.log(chalk.gray(`   - subscriptionTier: ${user.subscriptionTier || 'not set'}`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Verification failed for ${email}: ${error}`));
    }
  }

  console.log(chalk.green('\n✅ Test user permissions updated!'));
  console.log(chalk.blue('You can now test with these accounts:'));
  testUserUpdates.forEach(({ email, updates }) => {
    const userType = updates.isAdmin ? 'admin' : updates.lifetimeAccess ? 'premium' : 'free';
    console.log(chalk.gray(`  - ${email} (${userType})`));
  });
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  updateTestUsersDirectly().catch(console.error);
}

export { updateTestUsersDirectly };
