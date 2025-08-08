import 'dotenv/config';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../server/db';
import { enhancedTerms } from '../shared/enhancedSchema';
import { randomUUID } from 'crypto';
// Firebase config from environment
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};
async function testAIViaAPI() {
    console.log('🚀 Testing AI Content Generation via API...\n');
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    try {
        // Step 1: Create test term in database
        console.log('1️⃣ Creating test term in database...');
        const testTermId = randomUUID();
        const testTermData = {
            id: testTermId,
            name: 'Machine Learning',
            slug: 'machine-learning',
            shortDefinition: 'A branch of artificial intelligence that enables computers to learn from data without being explicitly programmed',
            fullDefinition: 'Machine Learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computer systems to improve their performance on a specific task through experience. Instead of following explicitly programmed instructions, machine learning systems identify patterns in data and make decisions based on those patterns.',
            mainCategories: ['artificial-intelligence', 'data-science'],
            subCategories: ['supervised-learning', 'unsupervised-learning', 'reinforcement-learning'],
            relatedConcepts: ['neural-networks', 'deep-learning', 'data-mining', 'predictive-analytics'],
            applicationDomains: ['healthcare', 'finance', 'autonomous-vehicles', 'recommendation-systems'],
            techniques: ['regression', 'classification', 'clustering', 'dimensionality-reduction'],
            difficultyLevel: 'intermediate',
            hasImplementation: true,
            hasInteractiveElements: true,
            hasCaseStudies: true,
            hasCodeExamples: true,
            keywords: ['AI', 'ML', 'algorithms', 'data', 'prediction', 'training', 'model'],
        };
        await db.insert(enhancedTerms).values(testTermData);
        console.log('   ✅ Term created:', testTermData.name);
        console.log('   - ID:', testTermId);
        // Step 2: Authenticate with Firebase (if you have test credentials)
        console.log('\n2️⃣ Testing without authentication (expecting 401)...');
        // Test without auth first
        try {
            const noAuthResponse = await axios.post('http://localhost:5000/api/admin/generate', {
                termId: testTermId,
                sectionName: 'detailed_explanation',
                model: 'gpt-4o-mini',
                temperature: 0.7,
                maxTokens: 500,
                regenerate: true
            });
            console.log('   ⚠️  Unexpected: Request succeeded without auth');
        }
        catch (error) {
            if (error.response?.status === 401) {
                console.log('   ✅ Correctly rejected unauthenticated request');
            }
            else {
                console.log('   ❌ Unexpected error:', error.response?.data || error.message);
            }
        }
        // Step 3: If you have test credentials, use them here
        const testEmail = process.env.TEST_USER_EMAIL;
        const testPassword = process.env.TEST_USER_PASSWORD;
        if (testEmail && testPassword) {
            console.log('\n3️⃣ Authenticating with test credentials...');
            try {
                const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
                const idToken = await userCredential.user.getIdToken();
                console.log('   ✅ Authentication successful');
                // Step 4: Test AI generation with authentication
                console.log('\n4️⃣ Testing AI content generation with auth...');
                const response = await axios.post('http://localhost:5000/api/admin/generate', {
                    termId: testTermId,
                    sectionName: 'detailed_explanation',
                    model: 'gpt-4o-mini',
                    temperature: 0.7,
                    maxTokens: 500,
                    regenerate: true
                }, {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                });
                if (response.data.success) {
                    console.log('   ✅ Content generated successfully!');
                    console.log('   - Model:', response.data.metadata?.model);
                    console.log('   - Tokens:', response.data.metadata?.totalTokens);
                    console.log('   - Cost: $' + response.data.metadata?.cost.toFixed(4));
                    console.log('   - Content preview:', response.data.content?.substring(0, 150) + '...');
                }
                else {
                    console.log('   ❌ Generation failed:', response.data.error);
                }
                // Step 5: Test bulk generation
                console.log('\n5️⃣ Testing bulk content generation...');
                const bulkResponse = await axios.post('http://localhost:5000/api/admin/generate/bulk', {
                    termId: testTermId,
                    sectionNames: ['key_concepts', 'practical_applications', 'code_examples'],
                    model: 'gpt-4o-mini',
                    regenerate: true
                }, {
                    headers: {
                        Authorization: `Bearer ${idToken}`
                    }
                });
                if (bulkResponse.data.success) {
                    console.log('   ✅ Bulk generation completed!');
                    console.log('   - Total sections:', bulkResponse.data.summary.totalSections);
                    console.log('   - Successful:', bulkResponse.data.summary.successCount);
                    console.log('   - Failed:', bulkResponse.data.summary.failureCount);
                    console.log('   - Total cost: $' + bulkResponse.data.summary.totalCost.toFixed(4));
                }
            }
            catch (authError) {
                console.log('   ❌ Authentication failed:', authError.message);
                console.log('   ℹ️  To test with authentication, add TEST_USER_EMAIL and TEST_USER_PASSWORD to .env');
            }
        }
        else {
            console.log('\n   ℹ️  No test credentials found in .env');
            console.log('   Add TEST_USER_EMAIL and TEST_USER_PASSWORD to test authenticated requests');
        }
        // Cleanup
        console.log('\n6️⃣ Cleaning up test data...');
        await db.delete(enhancedTerms).where({ id: testTermId });
        console.log('   ✅ Test data cleaned up');
        console.log('\n✨ API Test Complete!');
    }
    catch (error) {
        console.error('\n❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
    }
    finally {
        process.exit(0);
    }
}
// Run the test
testAIViaAPI().catch(console.error);
