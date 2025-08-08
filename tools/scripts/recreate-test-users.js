import { initializeFirebaseAdmin } from '../server/config/firebase';
import { getAuth } from 'firebase-admin/auth';
import { optimizedStorage as storage } from '../server/optimizedStorage';
import dotenv from 'dotenv';
import chalk from 'chalk';
// Load environment variables
dotenv.config();
// Test users configuration
const TEST_USERS = [
    {
        email: 'free@aiglossarypro.com',
        password: 'freepass123',
        displayName: 'Free Test User',
        type: 'free',
        lifetimeAccess: false,
        isAdmin: false
    },
    {
        email: 'premium@aiglossarypro.com',
        password: 'premiumpass123',
        displayName: 'Premium Test User',
        type: 'premium',
        lifetimeAccess: true,
        isAdmin: false
    },
    {
        email: 'admin@aiglossarypro.com',
        password: 'adminpass123',
        displayName: 'Admin Test User',
        type: 'admin',
        lifetimeAccess: true,
        isAdmin: true
    }
];
// Old test users to remove
const OLD_TEST_USERS = [
    'test@aimlglossary.com',
    'premium@aimlglossary.com',
    'admin@aimlglossary.com',
    'test-auth@example.com'
];
async function recreateTestUsers() {
    try {
        console.log(chalk.blue('🔄 Starting test user recreation process...\n'));
        // Initialize Firebase Admin
        initializeFirebaseAdmin();
        const auth = getAuth();
        // Step 1: Remove old test users
        console.log(chalk.yellow('📤 Removing old test users...'));
        for (const email of OLD_TEST_USERS) {
            try {
                const user = await auth.getUserByEmail(email);
                await auth.deleteUser(user.uid);
                console.log(chalk.red(`  ❌ Deleted: ${email} (${user.uid})`));
                // Also remove from database
                const dbUsers = await storage.getUsersByEmail(email);
                if (dbUsers.length > 0) {
                    await storage.deleteUser(dbUsers[0].id);
                    console.log(chalk.red(`  ❌ Removed from database: ${email}`));
                }
            }
            catch (error) {
                if (error.code === 'auth/user-not-found') {
                    console.log(chalk.gray(`  ⏭️  ${email} - already deleted`));
                }
                else {
                    console.log(chalk.red(`  ⚠️  Error deleting ${email}: ${error.message}`));
                }
            }
        }
        // Step 2: Create new test users
        console.log(chalk.green('\n📥 Creating new test users...'));
        for (const testUser of TEST_USERS) {
            try {
                // Create Firebase user
                const userRecord = await auth.createUser({
                    email: testUser.email,
                    password: testUser.password,
                    displayName: testUser.displayName,
                    emailVerified: true
                });
                console.log(chalk.green(`  ✅ Created Firebase user: ${testUser.email} (${userRecord.uid})`));
                // Set custom claims
                const customClaims = {};
                if (testUser.isAdmin) {
                    customClaims.admin = true;
                }
                if (testUser.lifetimeAccess) {
                    customClaims.premium = true;
                }
                if (Object.keys(customClaims).length > 0) {
                    await auth.setCustomUserClaims(userRecord.uid, customClaims);
                    console.log(chalk.blue(`  🔧 Set custom claims for ${testUser.email}:`, customClaims));
                }
                // Create database record
                const dbUser = await storage.upsertUser({
                    id: userRecord.uid,
                    email: testUser.email,
                    firstName: testUser.displayName.split(' ')[0],
                    lastName: testUser.displayName.split(' ')[1] || 'User',
                    authProvider: 'email',
                    firebaseUid: userRecord.uid,
                    lifetimeAccess: testUser.lifetimeAccess,
                    isAdmin: testUser.isAdmin,
                });
                console.log(chalk.green(`  ✅ Created database record for ${testUser.email}`));
            }
            catch (error) {
                console.log(chalk.red(`  ❌ Error creating ${testUser.email}: ${error.message}`));
            }
        }
        // Step 3: Display summary
        console.log(chalk.cyan('\n📋 Test Users Summary:'));
        console.log(chalk.cyan('━'.repeat(60)));
        for (const user of TEST_USERS) {
            console.log(chalk.white(`\n${user.type.toUpperCase()} USER:`));
            console.log(`  Email: ${chalk.yellow(user.email)}`);
            console.log(`  Password: ${chalk.yellow(user.password)}`);
            console.log(`  Type: ${chalk.magenta(user.type)}`);
            console.log(`  Lifetime Access: ${user.lifetimeAccess ? chalk.green('✓') : chalk.red('✗')}`);
            console.log(`  Admin: ${user.isAdmin ? chalk.green('✓') : chalk.red('✗')}`);
        }
        console.log(chalk.cyan('\n' + '━'.repeat(60)));
        console.log(chalk.green('\n✨ Test users recreation complete!'));
        console.log(chalk.yellow('\n⚠️  Update your test scripts with these new credentials.'));
    }
    catch (error) {
        console.error(chalk.red('\n❌ Fatal error:'), error);
        throw error;
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    recreateTestUsers()
        .then(() => process.exit(0))
        .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}
export { recreateTestUsers, TEST_USERS };
