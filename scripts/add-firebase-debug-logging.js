import fs from 'fs';
import path from 'path';

// Add debug logging to firebase.ts
const firebasePath = path.join(process.cwd(), 'client/src/lib/firebase.ts');
const firebaseContent = fs.readFileSync(firebasePath, 'utf8');

// Add debug logging before signInWithEmailAndPassword
const debugCode = `
      // Debug logging for network issues
      console.log('🔍 [Debug] Network status:', navigator.onLine);
      console.log('🔍 [Debug] Current time:', new Date().toISOString());
      
      // Check service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('🔍 [Debug] Active service workers:', registrations.length);
        registrations.forEach((reg, i) => {
          console.log(\`  SW\${i}: \${reg.scope} (active: \${!!reg.active})\`);
        });
      }
      
      // Test direct fetch to Firebase
      try {
        const testStart = Date.now();
        const testResponse = await fetch('https://identitytoolkit.googleapis.com/v1/test', {
          method: 'HEAD',
          mode: 'cors'
        });
        console.log(\`🔍 [Debug] Direct Firebase fetch test: \${testResponse.status} in \${Date.now() - testStart}ms\`);
      } catch (e) {
        console.error('🔍 [Debug] Direct Firebase fetch failed:', e.message);
      }
`;

// Find the line with signInWithEmailAndPassword and add debug code before it
const signInPattern = /console\.log\('🔐 Calling signInWithEmailAndPassword\.\.\.'\);/;

if (firebaseContent.match(signInPattern)) {
  const updatedContent = firebaseContent.replace(
    signInPattern,
    debugCode + '\n      console.log(\'🔐 Calling signInWithEmailAndPassword...\');'
  );
  
  fs.writeFileSync(firebasePath, updatedContent);
  console.log('✅ Added debug logging to firebase.ts');
  console.log('\nDebug logging will show:');
  console.log('- Network status');
  console.log('- Active service workers');
  console.log('- Direct Firebase connectivity test');
  console.log('\nRestart your dev server and try logging in to see the debug output.');
} else {
  console.error('❌ Could not find the target line in firebase.ts');
  console.log('Please manually add the debug code before signInWithEmailAndPassword');
}