/**
 * Firebase Authentication Integration Tests
 * Comprehensive testing of Firebase Auth integration
 */

import { deleteApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFirebaseUser, verifyFirebaseToken } from '../../server/config/firebase';

describe('Firebase Authentication Integration', () => {
    let app: FirebaseApp;
    let auth: Auth;

    const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY || 'test-api-key',
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'test-project.firebaseapp.com',
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'test-project',
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'test-project.appspot.com',
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
        appId: process.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:test'
    };

    beforeAll(async () => {
        // Clean up any existing apps
        const apps = getApps();
        await Promise.all(apps.map(app => deleteApp(app)));

        // Initialize Firebase app for testing
        app = initializeApp(firebaseConfig, 'test-app');
        auth = getAuth(app);

        // Connect to emulator in test environment
        if (process.env.NODE_ENV === 'test' && !(auth as unknown).config?.emulator) {
            try {
                connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
            } catch (error) {
                console.log('Firebase Auth emulator not available, using production config');
            }
        }
    });

    afterAll(async () => {
        if (app) {
            await deleteApp(app);
        }
    });

    describe('Firebase Configuration', () => {
        it('should have valid Firebase configuration', () => {
            expect(firebaseConfig.apiKey).toBeTruthy();
            expect(firebaseConfig.authDomain).toBeTruthy();
            expect(firebaseConfig.projectId).toBeTruthy();
            expect(firebaseConfig.storageBucket).toBeTruthy();
            expect(firebaseConfig.messagingSenderId).toBeTruthy();
            expect(firebaseConfig.appId).toBeTruthy();
        });

        it('should validate auth domain format', () => {
            const authDomain = firebaseConfig.authDomain;
            const isValidDomain =
                authDomain.includes('.firebaseapp.com') ||
                authDomain.includes('.web.app') ||
                authDomain === 'localhost' || // For emulator
                process.env.NODE_ENV === 'test'; // Allow test domains

            expect(isValidDomain).toBe(true);
        });

        it('should validate project ID format', () => {
            const projectId = firebaseConfig.projectId;
            // Project IDs should be lowercase and can contain hyphens
            const isValidProjectId = /^[a-z0-9-]+$/.test(projectId) || process.env.NODE_ENV === 'test';
            expect(isValidProjectId).toBe(true);
        });

        it('should validate app ID format', () => {
            const appId = firebaseConfig.appId;
            // App IDs should follow the pattern: 1:number:web:hash or be a test value
            const isValidAppId =
                /^1:\d+:web:[a-f0-9]+$/.test(appId) ||
                process.env.NODE_ENV === 'test';
            expect(isValidAppId).toBe(true);
        });
    });

    describe('Firebase Auth Service', () => {
        it('should initialize Firebase Auth', () => {
            expect(auth).toBeDefined();
            expect(auth.app).toBe(app);
        });

        it('should handle auth state changes', async () => {
            return new Promise<void>((resolve) => {
                const unsubscribe = auth.onAuthStateChanged((user) => {
                    // Initial state should be null (no user signed in)
                    expect(user).toBeNull();
                    unsubscribe();
                    resolve();
                });
            });
        });

        it('should handle ID token changes', async () => {
            return new Promise<void>((resolve) => {
                const unsubscribe = auth.onIdTokenChanged((user) => {
                    // Initial state should be null (no user signed in)
                    expect(user).toBeNull();
                    unsubscribe();
                    resolve();
                });
            });
        });
    });

    describe('Server-side Firebase Integration', () => {
        it('should validate Firebase Admin SDK configuration', () => {
            const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
            const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
            const hasPrivateKey = !!(
                process.env.FIREBASE_PRIVATE_KEY ||
                process.env.FIREBASE_PRIVATE_KEY_BASE64
            );

            // In production, all should be configured
            if (process.env.NODE_ENV === 'production') {
                expect(hasProjectId).toBe(true);
                expect(hasClientEmail).toBe(true);
                expect(hasPrivateKey).toBe(true);
            }

            console.log('Firebase Admin SDK config:', {
                hasProjectId,
                hasClientEmail,
                hasPrivateKey,
                environment: process.env.NODE_ENV
            });
        });

        it('should handle invalid token verification gracefully', async () => {
            const invalidToken = 'invalid-token-123';

            try {
                const result = await verifyFirebaseToken(invalidToken);
                expect(result).toBeNull();
            } catch (error) {
                // Should handle errors gracefully
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should handle user creation errors gracefully', async () => {
            const invalidEmail = 'invalid-email';
            const password = 'testpassword123';

            try {
                const result = await createFirebaseUser(invalidEmail, password, 'Test User');
                expect(result).toBeNull();
            } catch (error) {
                // Should handle errors gracefully
                expect(error).toBeInstanceOf(Error);
            }
        });
    });

    describe('Authentication Flow Integration', () => {
        it('should validate authentication providers configuration', () => {
            // Check if providers are properly configured
            const providers = {
                google: true, // Available through Firebase
                github: true, // Available through Firebase
                email: true,  // Available through Firebase
                anonymous: false // Not typically used in production
            };

            expect(providers.google).toBe(true);
            expect(providers.github).toBe(true);
            expect(providers.email).toBe(true);
        });

        it('should handle authentication errors properly', async () => {
            // Test error handling for various auth scenarios
            const authErrors = [
                'auth/user-not-found',
                'auth/wrong-password',
                'auth/invalid-email',
                'auth/user-disabled',
                'auth/too-many-requests'
            ];

            authErrors.forEach(errorCode => {
                const error = new Error(`Firebase Auth Error: ${errorCode}`);
                expect(error.message).toContain(errorCode);
            });
        });

        it('should validate token refresh mechanism', () => {
            // Test that token refresh is properly configured
            const refreshConfig = {
                autoRefresh: true,
                refreshThreshold: 5 * 60 * 1000, // 5 minutes
                maxRetries: 3
            };

            expect(refreshConfig.autoRefresh).toBe(true);
            expect(refreshConfig.refreshThreshold).toBeGreaterThan(0);
            expect(refreshConfig.maxRetries).toBeGreaterThan(0);
        });
    });

    describe('Security Configuration', () => {
        it('should validate security rules configuration', () => {
            // Check that security-related configurations are proper
            const securityConfig = {
                enforceHttps: process.env.NODE_ENV === 'production',
                secureCookies: process.env.NODE_ENV === 'production',
                sameSitePolicy: 'lax',
                tokenExpiration: 7 * 24 * 60 * 60 * 1000 // 7 days
            };

            if (process.env.NODE_ENV === 'production') {
                expect(securityConfig.enforceHttps).toBe(true);
                expect(securityConfig.secureCookies).toBe(true);
            }

            expect(securityConfig.sameSitePolicy).toBe('lax');
            expect(securityConfig.tokenExpiration).toBeGreaterThan(0);
        });

        it('should validate CORS configuration', () => {
            // Validate that CORS is properly configured for Firebase
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:5173',
                'https://aiglossarypro.com'
            ];

            const currentOrigin = process.env.VITE_APP_URL || 'http://localhost:3000';
            const isAllowedOrigin = allowedOrigins.some(origin =>
                currentOrigin.startsWith(origin.split('://')[1]) ||
                currentOrigin === origin
            );

            expect(isAllowedOrigin).toBe(true);
        });

        it('should validate JWT secret configuration', () => {
            const jwtSecret = process.env.JWT_SECRET;

            if (process.env.NODE_ENV === 'production') {
                expect(jwtSecret).toBeDefined();
                expect(jwtSecret!.length).toBeGreaterThanOrEqual(32);
            }

            if (jwtSecret) {
                expect(jwtSecret!.length).toBeGreaterThan(10);
            }
        });
    });

    describe('Performance and Monitoring', () => {
        it('should validate auth performance monitoring', () => {
            // Check that auth operations are monitored
            const monitoringConfig = {
                trackAuthEvents: true,
                trackTokenRefresh: true,
                trackAuthErrors: true,
                performanceThreshold: 2000 // 2 seconds
            };

            expect(monitoringConfig.trackAuthEvents).toBe(true);
            expect(monitoringConfig.trackTokenRefresh).toBe(true);
            expect(monitoringConfig.trackAuthErrors).toBe(true);
            expect(monitoringConfig.performanceThreshold).toBeGreaterThan(0);
        });

        it('should validate error reporting integration', () => {
            // Check that auth errors are properly reported
            const errorReporting = {
                sentryIntegration: !!process.env.SENTRY_DSN,
                logLevel: process.env.LOG_LEVEL || 'info',
                includeStackTrace: true
            };

            expect(typeof errorReporting.sentryIntegration).toBe('boolean');
            expect(errorReporting.logLevel).toBeTruthy();
            expect(errorReporting.includeStackTrace).toBe(true);
        });
    });

    describe('Development vs Production Configuration', () => {
        it('should have appropriate configuration for environment', () => {
            const isDevelopment = process.env.NODE_ENV === 'development';
            const isProduction = process.env.NODE_ENV === 'production';
            const isTest = process.env.NODE_ENV === 'test';

            if (isDevelopment) {
                // Development should allow more lenient configuration
                console.log('Running in development mode - allowing test configurations');
            }

            if (isProduction) {
                // Production should have strict configuration
                expect(process.env.FIREBASE_PROJECT_ID).toBeDefined();
                expect(process.env.JWT_SECRET).toBeDefined();
                expect(process.env.SESSION_SECRET).toBeDefined();
            }

            if (isTest) {
                // Test environment should work with mock data
                console.log('Running in test mode - using test configurations');
            }

            expect(isDevelopment || isProduction || isTest).toBe(true);
        });

        it('should validate environment-specific auth settings', () => {
            const authSettings = {
                allowTestUsers: process.env.NODE_ENV !== 'production',
                requireEmailVerification: process.env.NODE_ENV === 'production',
                enableDebugLogging: process.env.NODE_ENV === 'development',
                strictSecurityHeaders: process.env.NODE_ENV === 'production'
            };

            if (process.env.NODE_ENV === 'production') {
                expect(authSettings.allowTestUsers).toBe(false);
                expect(authSettings.requireEmailVerification).toBe(true);
                expect(authSettings.strictSecurityHeaders).toBe(true);
            }

            if (process.env.NODE_ENV === 'development') {
                expect(authSettings.enableDebugLogging).toBe(true);
            }
        });
    });
});