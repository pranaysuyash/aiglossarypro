import { initializeFirebaseAdmin } from '../server/config/firebase';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

async function checkFirebaseUsers() {
  try {
    console.log(chalk.blue('🔍 Checking Firebase users...'));
    
    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    
    // List all users
    const listUsersResult = await getAuth().listUsers(1000);
    
    console.log(chalk.green(`\n✅ Found ${listUsersResult.users.length} users in Firebase:\n`));
    
    listUsersResult.users.forEach((userRecord) => {
      console.log(chalk.cyan('User:'), userRecord.email || 'No email');
      console.log('  UID:', userRecord.uid);
      console.log('  Email Verified:', userRecord.emailVerified);
      console.log('  Created:', new Date(userRecord.metadata.creationTime).toLocaleString());
      console.log('  Last Sign In:', userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime).toLocaleString() : 'Never');
      console.log('  Disabled:', userRecord.disabled);
      console.log('---');
    });
    
    // Check specific test users
    const testEmails = [
      'admin@aiglossarypro',
      'admin@aiglossarypro.com',
      'admin@aimlglossary.com',
      'test@aimlglossary.com',
      'premium@aimlglossary.com',
      'demo@aiglosspro.com'
    ];
    
    console.log(chalk.yellow('\n🔍 Checking specific test users:'));
    
    for (const email of testEmails) {
      try {
        const user = await getAuth().getUserByEmail(email);
        console.log(chalk.green(`✅ ${email} exists - UID: ${user.uid}`));
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.log(chalk.red(`❌ ${email} - NOT FOUND`));
        } else {
          console.log(chalk.red(`❌ ${email} - Error: ${error.message}`));
        }
      }
    }
    
  } catch (error) {
    console.error(chalk.red('Error checking Firebase users:'), error);
  }
}

checkFirebaseUsers();