/**
 * Firebase initialization test
 * Run this to check if Firebase is properly configured
 */

import { auth, signInWithEmail } from './firebase';

export async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase connection...');
  
  // Check if Firebase is initialized
  console.log('🔥 Firebase auth object:', auth);
  console.log('🔥 Firebase auth app:', auth?.app);
  console.log('🔥 Firebase auth settings:', auth?.settings);
  
  // Check if we can reach Firebase
  try {
    console.log('🔥 Checking authStateReady...');
    await auth?.authStateReady();
    console.log('✅ Firebase auth state is ready');
  } catch (error) {
    console.error('❌ Failed to check auth state:', error);
  }
  
  // Try a test sign in with invalid credentials to see if we get a proper error
  try {
    console.log('🔥 Testing sign in with invalid credentials...');
    await signInWithEmail('test@invalid.com', 'wrongpassword');
  } catch (error: any) {
    console.log('🔥 Expected error from invalid login:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    
    // If we get a Firebase auth error, the connection is working
    if (error.code && error.code.startsWith('auth/')) {
      console.log('✅ Firebase connection is working (got expected auth error)');
    } else {
      console.error('❌ Unexpected error type:', error);
    }
  }
}

// Export for use in browser console
(window as any).testFirebaseConnection = testFirebaseConnection;