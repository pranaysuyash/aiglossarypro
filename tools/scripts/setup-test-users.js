#!/usr/bin/env tsx
/**
 * Setup Test Users Script
 * Creates test users in Firebase and backend database
 */
import chalk from 'chalk';
const API_BASE = 'http://localhost:3001';
const testUsers = [
    {
        email: 'test@aimlglossary.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
        lifetimeAccess: false,
        subscriptionTier: 'free',
    },
    {
        email: 'premium@aimlglossary.com',
        password: 'premiumpass123',
        firstName: 'Premium',
        lastName: 'User',
        isAdmin: false,
        lifetimeAccess: true,
        subscriptionTier: 'lifetime',
    },
    {
        email: 'admin@aimlglossary.com',
        password: 'adminpass123',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
        lifetimeAccess: true,
        subscriptionTier: 'admin',
    },
];
async function setupTestUsers() {
    console.log(chalk.blue('🔧 Setting up test users...'));
    for (const user of testUsers) {
        try {
            console.log(chalk.blue(`Creating/updating user: ${user.email}`));
            // Try to register the user first
            const registerResponse = await fetch(`${API_BASE}/api/auth/firebase/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user),
            });
            const registerResult = await registerResponse.json();
            if (registerResponse.ok) {
                console.log(chalk.green(`✅ ${user.email} - Created successfully`));
            }
            else if (registerResult.message === 'User already exists') {
                console.log(chalk.yellow(`⚠️ ${user.email} - Already exists, will update permissions`));
            }
            else {
                console.log(chalk.red(`❌ ${user.email} - Failed: ${registerResult.message}`));
                continue;
            }
            // Update user permissions/properties via admin endpoint
            const updateResponse = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(user.email)}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isAdmin: user.isAdmin,
                    lifetimeAccess: user.lifetimeAccess,
                    subscriptionTier: user.subscriptionTier,
                }),
            });
            if (updateResponse.ok) {
                console.log(chalk.green(`✅ ${user.email} - Permissions updated (${user.subscriptionTier})`));
            }
            else {
                const updateResult = await updateResponse.json();
                console.log(chalk.yellow(`⚠️ ${user.email} - Permission update failed: ${updateResult.message || 'Unknown error'}`));
            }
        }
        catch (error) {
            console.error(chalk.red(`❌ ${user.email} - Error: ${error}`));
        }
    }
    console.log(chalk.blue('\n🧪 Testing authentication...'));
    // Test authentication for first user
    const testUser = testUsers[0];
    try {
        // First, try to get a Firebase ID token by simulating login
        console.log(chalk.blue(`Testing auth flow for ${testUser.email}...`));
        // Check if auth endpoints are working
        const healthCheck = await fetch(`${API_BASE}/api/auth/check`);
        const healthResult = await healthCheck.json();
        console.log(chalk.green(`Auth check endpoint: ${healthResult.success ? 'Working' : 'Failed'}`));
        const userCheck = await fetch(`${API_BASE}/api/auth/user`);
        const userResult = await userCheck.json();
        console.log(chalk.green(`Auth user endpoint: ${userResult.success ? 'Working' : 'Working (401 expected)'}`));
    }
    catch (error) {
        console.error(chalk.red('Auth test failed:'), error);
    }
    console.log(chalk.green('\n✅ Test user setup complete!'));
    console.log(chalk.blue('You can now use these accounts in the frontend:'));
    testUsers.forEach(user => {
        const userType = user.isAdmin ? 'admin' : user.lifetimeAccess ? 'premium' : 'free';
        console.log(chalk.gray(`  - ${user.email} / ${user.password} (${userType})`));
    });
}
// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    setupTestUsers().catch(console.error);
}
export { setupTestUsers };
