#!/usr/bin/env node

/**
 * Debug script to check user data in the database
 */

import { optimizedStorage as storage } from '../server/optimizedStorage.ts';

async function debugUserData() {
  try {
    console.log('🔍 Checking user data in database...\n');
    
    // Get all users
    const users = await storage.getAllUsers();
    
    if (!users.success || !users.data) {
      console.error('❌ Failed to get users:', users.error);
      return;
    }
    
    console.log(`📊 Found ${users.data.length} users in database:\n`);
    
    // Check each Firebase test user
    const testUsers = [
      'admin@aimlglossary.com',
      'premium@aimlglossary.com', 
      'test@aimlglossary.com'
    ];
    
    for (const email of testUsers) {
      const user = users.data.find(u => u.email === email);
      
      if (user) {
        console.log(`✅ ${email}:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Name: ${user.firstName} ${user.lastName}`);
        console.log(`   - Admin: ${user.isAdmin || false}`);
        console.log(`   - Lifetime Access: ${user.lifetimeAccess || false}`);
        console.log(`   - Subscription Tier: ${user.subscriptionTier || 'free'}`);
        console.log(`   - Purchase Date: ${user.purchaseDate || 'N/A'}`);
        console.log(`   - Created: ${user.createdAt || 'N/A'}`);
        console.log('');
      } else {
        console.log(`❌ ${email}: Not found in database`);
        console.log('');
      }
    }
    
    // Show all users for debugging
    console.log('📋 All users in database:');
    users.data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.subscriptionTier || 'free'}) - Lifetime: ${user.lifetimeAccess || false}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging user data:', error);
  }
}

debugUserData().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
}); 