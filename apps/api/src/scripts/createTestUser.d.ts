/**
 * Create Test User for Development
 * Creates a Firebase test user and corresponding database record
 */
declare const TEST_USER_EMAIL = "test@aimlglossary.com";
declare const TEST_USER_PASSWORD = "testpass123";
declare const TEST_ADMIN_EMAIL = "admin@aimlglossary.com";
declare const TEST_ADMIN_PASSWORD = "adminpass123";
declare function createTestUsers(): Promise<void>;
export { createTestUsers, TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, };
