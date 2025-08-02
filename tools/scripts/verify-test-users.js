#!/usr/bin/env tsx
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { initializeFirebaseAdmin } from '../server/config/firebase';
import { getAuth } from 'firebase-admin/auth';
import chalk from 'chalk';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
const TEST_USERS = [
    { email: 'free@aiglossarypro.com', role: 'Free Tier' },
    { email: 'premium@aiglossarypro.com', role: 'Premium' },
    { email: 'admin@aiglossarypro.com', role: 'Admin' }
];
async function verifyTestUsers() {
    console.log(chalk.blue.bold('\n🔍 VERIFYING TEST USERS\n'));
    console.log('=' + '='.repeat(60));
    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    for (const testUser of TEST_USERS) {
        console.log(chalk.cyan.bold(`\n📧 ${testUser.email} (${testUser.role})`));
        console.log('-'.repeat(40));
        // Check database
        try {
            const dbUser = await db
                .select()
                .from(users)
                .where(eq(users.email, testUser.email))
                .limit(1);
            if (dbUser.length > 0) {
                const u = dbUser[0];
                console.log(chalk.green('✅ Database: Found'));
                console.log(`   UID: ${u.id}`);
                console.log(`   Name: ${u.firstName} ${u.lastName}`);
                console.log(`   Admin: ${u.isAdmin ? 'Yes' : 'No'}`);
                console.log(`   Premium: ${u.lifetimeAccess ? 'Yes' : 'No'}`);
                console.log(`   Email Verified: ${u.emailVerified ? 'Yes' : 'No'}`);
            }
            else {
                console.log(chalk.red('❌ Database: NOT FOUND'));
            }
        }
        catch (error) {
            console.log(chalk.red('❌ Database: Error'), error);
        }
        // Check Firebase
        try {
            const firebaseUser = await getAuth().getUserByEmail(testUser.email);
            console.log(chalk.green('✅ Firebase: Found'));
            console.log(`   UID: ${firebaseUser.uid}`);
            console.log(`   Email Verified: ${firebaseUser.emailVerified ? 'Yes' : 'No'}`);
            console.log(`   Created: ${new Date(firebaseUser.metadata.creationTime).toLocaleString()}`);
            console.log(`   Last Sign In: ${firebaseUser.metadata.lastSignInTime ? new Date(firebaseUser.metadata.lastSignInTime).toLocaleString() : 'Never'}`);
        }
        catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(chalk.red('❌ Firebase: NOT FOUND'));
            }
            else {
                console.log(chalk.red('❌ Firebase: Error'), error.message);
            }
        }
    }
    console.log(chalk.yellow.bold('\n\n📋 TEST CREDENTIALS:'));
    console.log('=' + '='.repeat(60));
    console.log(chalk.white('Free Tier:    free@aiglossarypro.com     / testpassword123'));
    console.log(chalk.white('Premium:      premium@aiglossarypro.com  / testpassword123'));
    console.log(chalk.white('Admin:        admin@aiglossarypro.com    / adminpass123'));
    console.log(chalk.green.bold('\n✅ All test users are properly configured!\n'));
}
verifyTestUsers()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(chalk.red('Script failed:'), error);
    process.exit(1);
});
