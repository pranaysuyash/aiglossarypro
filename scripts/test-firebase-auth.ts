import { chromium } from 'playwright';

async function testFirebaseAuth() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable detailed console logging
  page.on('console', msg => {
    console.log(`Browser [${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    console.error('Page error:', error);
  });
  
  try {
    console.log('🔍 Testing Firebase authentication flow...\n');
    
    // 1. Go to login page
    console.log('1️⃣ Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);
    
    // Close any modals
    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch {}
    
    // 2. Fill login form
    console.log('\n2️⃣ Filling login form...');
    await page.fill('input[type="email"]', 'test@aimlglossary.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    // 3. Monitor network requests
    console.log('\n3️⃣ Monitoring authentication requests...');
    
    // Set up request logging
    page.on('request', request => {
      if (request.url().includes('/api/auth')) {
        console.log(`→ ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/auth')) {
        console.log(`← ${response.status()} ${response.url()}`);
      }
    });
    
    // 4. Submit form and wait
    console.log('\n4️⃣ Submitting login form...');
    
    // Click submit button
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
    } else {
      await page.keyboard.press('Enter');
    }
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    // 5. Check authentication state
    console.log('\n5️⃣ Checking authentication state...');
    
    const authState = await page.evaluate(async () => {
      // Check cookies
      const cookies = document.cookie;
      
      // Check localStorage
      const localStorageData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('firebase'))) {
          localStorageData[key] = localStorage.getItem(key);
        }
      }
      
      // Check auth API
      let authCheck;
      try {
        const response = await fetch('/api/auth/check', { credentials: 'include' });
        authCheck = await response.json();
      } catch (e) {
        authCheck = { error: e.message };
      }
      
      return {
        cookies,
        localStorage: localStorageData,
        authCheck,
        currentUrl: window.location.href
      };
    });
    
    console.log('\n📊 Authentication State:');
    console.log('- Current URL:', authState.currentUrl);
    console.log('- Cookies:', authState.cookies || 'None');
    console.log('- LocalStorage keys:', Object.keys(authState.localStorage));
    console.log('- Auth check:', authState.authCheck);
    
    // 6. Test Firebase token exchange
    console.log('\n6️⃣ Testing direct Firebase token exchange...');
    
    const tokenExchange = await page.evaluate(async () => {
      try {
        // Try to get Firebase instance
        const firebase = (window as any).firebase;
        if (!firebase) {
          return { error: 'Firebase not available' };
        }
        
        // Check if user is signed in to Firebase
        const auth = firebase.auth();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          
          // Exchange token with backend
          const response = await fetch('/api/auth/firebase/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ idToken })
          });
          
          return await response.json();
        } else {
          return { error: 'No Firebase user' };
        }
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('- Token exchange result:', tokenExchange);
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Test error:', error);
    
    // Take screenshot
    try {
      await page.screenshot({ path: 'firebase-auth-error.png' });
      console.log('📸 Screenshot saved as firebase-auth-error.png');
    } catch {}
    
    await browser.close();
  }
}

testFirebaseAuth().catch(console.error);