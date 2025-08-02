#!/usr/bin/env tsx
"use strict";
async function quickAuthTest() {
    console.log('Testing authentication endpoint...');
    let callCount = 0;
    const startTime = Date.now();
    // Monitor auth calls for 5 seconds
    const interval = setInterval(async () => {
        try {
            const response = await fetch('http://localhost:5173/api/auth/user', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });
            callCount++;
            console.log(`Call #${callCount}: ${response.status} - ${Date.now() - startTime}ms`);
            if (callCount > 10) {
                console.log('❌ LOOP DETECTED: More than 10 calls!');
                clearInterval(interval);
                process.exit(1);
            }
        }
        catch (error) {
            console.error('Error:', error.message);
        }
    }, 500);
    // Stop after 5 seconds
    setTimeout(() => {
        clearInterval(interval);
        console.log(`\n✅ Total calls in 5 seconds: ${callCount}`);
        if (callCount <= 2) {
            console.log('✅ No authentication loop detected!');
        }
        else {
            console.log(`⚠️ High call count: ${callCount}`);
        }
        process.exit(0);
    }, 5000);
}
quickAuthTest().catch(console.error);
