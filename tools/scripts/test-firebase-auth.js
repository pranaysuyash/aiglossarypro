#!/usr/bin/env node

/**
 * Test Firebase authentication directly without service workers
 */

import https from 'https';
import dns from 'dns';

// Test direct API call to Firebase
function testFirebaseEndpoint() {
  console.log('Testing Firebase Auth endpoint directly...\n');
  
  const options = {
    hostname: 'identitytoolkit.googleapis.com',
    port: 443,
    path: '/v1/accounts:signInWithPassword?key=AIzaSyBBMv0o12J-irIDt0vqjQFgHwgO_Qp6g9Q',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const data = JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    returnSecureToken: true
  });

  const startTime = Date.now();
  
  const req = https.request(options, (res) => {
    const elapsed = Date.now() - startTime;
    console.log(`Response received in ${elapsed}ms`);
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('\nResponse body:');
      try {
        const parsed = JSON.parse(responseData);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(responseData);
      }
      
      console.log(`\nTotal time: ${Date.now() - startTime}ms`);
      
      if (res.statusCode === 400 && responseData.includes('INVALID_LOGIN_CREDENTIALS')) {
        console.log('\n✅ Firebase Auth endpoint is working correctly!');
        console.log('(Invalid credentials error is expected for test data)');
      }
    });
  });

  req.on('error', (error) => {
    console.error(`\n❌ Request failed after ${Date.now() - startTime}ms:`, error);
  });

  req.setTimeout(60000, () => {
    console.error(`\n❌ Request timed out after 60 seconds`);
    req.destroy();
  });

  console.log('Sending request...');
  req.write(data);
  req.end();
}

// Test DNS resolution
function testDNS() {
  console.log('Testing DNS resolution for Firebase domains...\n');
  
  const domains = [
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebaseapp.com',
    'googleapis.com'
  ];
  
  domains.forEach(domain => {
    dns.resolve4(domain, (err, addresses) => {
      if (err) {
        console.log(`❌ ${domain}: DNS resolution failed - ${err.message}`);
      } else {
        console.log(`✅ ${domain}: Resolved to ${addresses.join(', ')}`);
      }
    });
  });
  
  setTimeout(() => {
    console.log('\n' + '='.repeat(50) + '\n');
    testFirebaseEndpoint();
  }, 2000);
}

// Run tests
console.log('Firebase Authentication Network Test');
console.log('=' + '='.repeat(50) + '\n');

testDNS();