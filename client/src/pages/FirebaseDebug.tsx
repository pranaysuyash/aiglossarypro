import React, { useState } from 'react';
import { auth, signInWithEmail } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FirebaseDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  const testFirebase = async () => {
    setTesting(true);
    setLogs([]);
    
    try {
      addLog('🔥 Starting Firebase tests...');
      
      // Test 1: Check if Firebase is initialized
      addLog(`Firebase auth object exists: ${!!auth}`);
      addLog(`Firebase app name: ${auth?.app?.name || 'N/A'}`);
      addLog(`Firebase auth domain: ${auth?.app?.options?.authDomain || 'N/A'}`);
      
      // Test 2: Check auth state
      addLog('Checking authStateReady...');
      try {
        await auth?.authStateReady();
        addLog('✅ Auth state is ready');
      } catch (error: any) {
        addLog(`❌ Auth state error: ${error.message}`);
      }
      
      // Test 3: Check current user
      addLog(`Current user: ${auth?.currentUser ? auth.currentUser.email : 'None'}`);
      
      // Test 4: Try invalid login to test connection
      addLog('Testing invalid login to check Firebase connection...');
      try {
        await signInWithEmail('test@invalid.com', 'wrongpassword');
      } catch (error: any) {
        addLog(`Expected error: ${error.code} - ${error.message}`);
        if (error.code?.startsWith('auth/')) {
          addLog('✅ Firebase connection is working!');
        } else {
          addLog('❌ Unexpected error type');
        }
      }
      
      // Test 5: Check network
      addLog('Testing network connectivity...');
      try {
        const response = await fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: 'test' })
        });
        addLog(`Google API reachable: ${response.ok} (status: ${response.status})`);
      } catch (error: any) {
        addLog(`❌ Network error: ${error.message}`);
      }
      
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Firebase Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testFirebase} 
            disabled={testing}
            className="w-full"
          >
            {testing ? 'Testing...' : 'Run Firebase Tests'}
          </Button>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold mb-2">Test Results:</h3>
            <div className="space-y-1 font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">Click "Run Firebase Tests" to start</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={
                    log.includes('✅') ? 'text-green-600' :
                    log.includes('❌') ? 'text-red-600' :
                    'text-gray-700 dark:text-gray-300'
                  }>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-bold mb-2">Quick Info:</h3>
            <ul className="text-sm space-y-1">
              <li>• This page tests Firebase client-side configuration</li>
              <li>• Check the browser console for detailed logs</li>
              <li>• Network tab should show requests to googleapis.com</li>
              <li>• If no network requests appear, Firebase SDK may not be initializing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}