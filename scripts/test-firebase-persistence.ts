import { chromium } from 'playwright';

async function testFirebasePersistence() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('Browser console:', msg.text());
    }
  });
  
  try {
    console.log('🔍 Testing Firebase persistence...\n');
    
    // 1. Login
    console.log('1️⃣ Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    
    // Handle cookie consent
    try {
      const acceptButton = await page.waitForSelector('button:has-text("Accept")', { timeout: 2000 });
      if (acceptButton) await acceptButton.click();
    } catch {}
    
    await page.fill('input[type="email"]', 'test@aimlglossary.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log('✅ Logged in successfully');
    
    // 2. Check localStorage for Firebase
    console.log('\n2️⃣ Checking localStorage...');
    const localStorageData = await page.evaluate(() => {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('auth'))) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });
    
    console.log('Firebase localStorage keys:', Object.keys(localStorageData));
    
    // 3. Check IndexedDB for Firebase
    console.log('\n3️⃣ Checking IndexedDB...');
    const hasFirebaseDB = await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.databases();
        request.then(databases => {
          const firebaseDBs = databases.filter(db => 
            db.name?.includes('firebase') || db.name?.includes('firebaseLocalStorageDb')
          );
          resolve(firebaseDBs.length > 0);
        }).catch(() => resolve(false));
      });
    });
    
    console.log(`Firebase IndexedDB present: ${hasFirebaseDB ? 'Yes' : 'No'}`);
    
    // 4. Clear all Firebase data
    console.log('\n4️⃣ Clearing Firebase data...');
    await page.evaluate(() => {
      // Clear localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear IndexedDB
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name?.includes('firebase')) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    });
    
    // 5. Reload page and check auth state
    console.log('\n5️⃣ Reloading page...');
    await page.reload();
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`URL after reload: ${currentUrl}`);
    
    // Check if still logged in
    const avatar = await page.$('button.rounded-full');
    const loginButton = await page.$('a[href="/login"], button:has-text("Sign in")');
    
    console.log('\n📊 Results:');
    console.log(`- Firebase localStorage: ${Object.keys(localStorageData).length > 0 ? 'Present' : 'Not found'}`);
    console.log(`- Firebase IndexedDB: ${hasFirebaseDB ? 'Present' : 'Not found'}`);
    console.log(`- After clearing: ${loginButton ? '✅ Logged out' : avatar ? '❌ Still logged in' : '⚠️ Unknown'}`);
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
  }
}

testFirebasePersistence().catch(console.error);