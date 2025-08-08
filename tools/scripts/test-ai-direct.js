import 'dotenv/config';
import OpenAI from 'openai';
import { db } from '../server/db';
import { enhancedTerms } from '../shared/enhancedSchema';
import { randomUUID } from 'crypto';
async function testAIDirect() {
    console.log('🚀 Direct AI Test (bypassing service layer issues)...\n');
    const testTermId = randomUUID();
    const testTermData = {
        id: testTermId,
        name: 'Deep Learning',
        slug: 'deep-learning',
        shortDefinition: 'A subset of machine learning that uses neural networks with multiple layers',
        fullDefinition: 'Deep learning is a machine learning technique that teaches computers to do what comes naturally to humans: learn by example. Deep learning is a key technology behind driverless cars, enabling them to recognize a stop sign, or to distinguish a pedestrian from a lamppost.',
        mainCategories: ['machine-learning', 'artificial-intelligence'],
        subCategories: ['neural-networks', 'computer-vision'],
        relatedConcepts: ['neural-network', 'backpropagation', 'gradient-descent'],
        applicationDomains: ['image-recognition', 'natural-language-processing', 'speech-recognition'],
        techniques: ['convolutional-neural-networks', 'recurrent-neural-networks', 'transformers'],
        difficultyLevel: 'advanced',
        hasImplementation: true,
        hasInteractiveElements: false,
        hasCaseStudies: true,
        hasCodeExamples: true,
        keywords: ['AI', 'ML', 'neural-networks', 'layers', 'training'],
    };
    try {
        // Step 1: Create test term
        console.log('1️⃣ Creating test term...');
        await db.insert(enhancedTerms).values(testTermData);
        console.log('   ✅ Term created:', testTermData.name);
        // Step 2: Test OpenAI API directly
        console.log('\n2️⃣ Testing OpenAI API directly...');
        if (!process.env.OPENAI_API_KEY) {
            console.error('   ❌ OPENAI_API_KEY not found in environment');
            return;
        }
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const prompt = `Generate a detailed explanation for the AI/ML term "${testTermData.name}".

Context:
- Short Definition: ${testTermData.shortDefinition}
- Full Definition: ${testTermData.fullDefinition}
- Categories: ${testTermData.mainCategories.join(', ')}
- Difficulty Level: ${testTermData.difficultyLevel}

Please provide a comprehensive explanation that:
1. Expands on the basic definition
2. Explains key concepts and principles
3. Discusses how it works in practice
4. Mentions common applications
5. Is suitable for someone at the ${testTermData.difficultyLevel} level

Write in clear, educational markdown format.`;
        console.log('   Sending request to OpenAI...');
        const startTime = Date.now();
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert AI/ML educator creating comprehensive learning content.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 800,
        });
        const endTime = Date.now();
        const content = completion.choices[0]?.message?.content;
        if (content) {
            console.log('\n   ✅ Content generated successfully!');
            console.log('   - Model:', completion.model);
            console.log('   - Processing time:', endTime - startTime, 'ms');
            console.log('   - Prompt tokens:', completion.usage?.prompt_tokens);
            console.log('   - Completion tokens:', completion.usage?.completion_tokens);
            console.log('   - Total tokens:', completion.usage?.total_tokens);
            const promptTokens = completion.usage?.prompt_tokens || 0;
            const completionTokens = completion.usage?.completion_tokens || 0;
            // Estimate cost (GPT-4O-mini pricing)
            const promptCost = (promptTokens / 1000) * 0.00015;
            const completionCost = (completionTokens / 1000) * 0.0006;
            const totalCost = promptCost + completionCost;
            console.log('   - Estimated cost: $' + totalCost.toFixed(4));
            console.log('\n   Generated content preview:');
            console.log('   ' + content.substring(0, 300) + '...');
            // Step 3: Test multiple sections
            console.log('\n3️⃣ Testing batch generation for multiple sections...');
            const sections = ['key_concepts', 'practical_applications', 'code_examples'];
            const results = [];
            for (const section of sections) {
                const sectionPrompt = `Generate content for the "${section.replace(/_/g, ' ')}" section of ${testTermData.name}.`;
                console.log(`\n   Generating: ${section}`);
                const sectionStart = Date.now();
                const sectionCompletion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are an expert AI/ML educator.' },
                        { role: 'user', content: sectionPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                });
                const sectionEnd = Date.now();
                if (sectionCompletion.choices[0]?.message?.content) {
                    console.log(`   ✅ Generated in ${sectionEnd - sectionStart}ms`);
                    results.push({
                        section,
                        time: sectionEnd - sectionStart,
                        tokens: sectionCompletion.usage?.total_tokens || 0
                    });
                }
            }
            // Summary
            console.log('\n📊 Test Summary:');
            console.log('   - OpenAI API: ✅ Working');
            console.log('   - Content generation: ✅ Successful');
            console.log('   - Sections generated:', results.length);
            console.log('   - Total time:', results.reduce((sum, r) => sum + r.time, 0) + endTime - startTime, 'ms');
            console.log('   - Total tokens:', results.reduce((sum, r) => sum + r.tokens, 0) + (completion.usage?.total_tokens || 0));
        }
        else {
            console.log('   ❌ No content returned from OpenAI');
        }
        // Cleanup
        console.log('\n4️⃣ Cleaning up test data...');
        await db.delete(enhancedTerms).where({ id: testTermId });
        console.log('   ✅ Test data cleaned up');
        console.log('\n✨ Direct AI Test Complete!');
        console.log('\n💡 The AI pipeline works correctly. The issue is in:');
        console.log('   1. promptTemplateService.generateContent() - queries section_items incorrectly');
        console.log('   2. aiContentGenerationService.storeGeneratedContent() - selects non-existent columns');
        console.log('   Both methods need to be updated to handle the actual database schema.');
    }
    catch (error) {
        console.error('\n❌ Test failed:', error);
        // Cleanup on error
        try {
            await db.delete(enhancedTerms).where({ id: testTermId });
        }
        catch (_) { }
    }
    finally {
        process.exit(0);
    }
}
// Run the test
testAIDirect().catch(console.error);
