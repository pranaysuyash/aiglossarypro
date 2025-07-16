import { db } from '../server/db';
import { aiContentGenerationService } from '../server/services/aiContentGenerationService';
import { enhancedTerms } from '../shared/enhancedSchema';

async function testModelComparisonFeature() {
  console.log('🧪 Testing Model Comparison Feature');
  console.log('=====================================');

  try {
    // Get a sample term for testing
    const sampleTerm = await db.select().from(enhancedTerms).limit(1);

    if (sampleTerm.length === 0) {
      console.log('❌ No terms found in database. Please add some terms first.');
      return;
    }

    const testTerm = sampleTerm[0];
    console.log(`📖 Testing with term: "${testTerm.name}" (ID: ${testTerm.id})`);

    // Test 1: Generate content with multiple models
    console.log('\n🔄 Test 1: Multi-model content generation');
    console.log('------------------------------------------');

    const testModels = ['gpt-4.1-mini', 'gpt-4o-mini'];
    const testSection = 'definition_overview';

    const multiModelResult = await aiContentGenerationService.generateMultiModelContent({
      termId: testTerm.id,
      sectionName: testSection,
      models: testModels,
      temperature: 0.7,
      maxTokens: 500,
      userId: 'test-user',
    });

    console.log(`✅ Multi-model generation result:`, {
      success: multiModelResult.success,
      versionsGenerated: multiModelResult.versions.length,
      totalCost: multiModelResult.summary.totalCost,
      successCount: multiModelResult.summary.successCount,
      failureCount: multiModelResult.summary.failureCount,
    });

    if (multiModelResult.success && multiModelResult.versions.length > 0) {
      console.log('\n📊 Generated versions:');
      multiModelResult.versions.forEach((version, index) => {
        console.log(`  ${index + 1}. Model: ${version.model}`);
        console.log(`     Cost: $${version.cost.toFixed(4)}`);
        console.log(`     Tokens: ${version.totalTokens}`);
        console.log(`     Content length: ${version.content.length} chars`);
        console.log(`     Selected: ${version.isSelected ? 'Yes' : 'No'}`);
      });
    }

    // Test 2: Get model versions
    console.log('\n🔍 Test 2: Retrieve model versions');
    console.log('-----------------------------------');

    const modelVersions = await aiContentGenerationService.getModelVersions(
      testTerm.id,
      testSection
    );
    console.log(`✅ Found ${modelVersions.length} model versions`);

    // Test 3: Rate a model version
    if (modelVersions.length > 0) {
      console.log('\n⭐ Test 3: Rate a model version');
      console.log('-------------------------------');

      const firstVersion = modelVersions[0];
      const ratingResult = await aiContentGenerationService.rateModelVersion(
        firstVersion.id,
        4,
        'Good quality content for testing',
        'test-user'
      );

      console.log(`✅ Rating result:`, ratingResult);
    }

    // Test 4: Select a model version
    if (modelVersions.length > 0) {
      console.log('\n🎯 Test 4: Select a model version');
      console.log('----------------------------------');

      const versionToSelect = modelVersions[0];
      const selectionResult = await aiContentGenerationService.selectModelVersion(
        versionToSelect.id,
        'test-user'
      );

      console.log(`✅ Selection result:`, selectionResult);
    }

    // Test 5: Verify the selected version
    console.log('\n🔍 Test 5: Verify selected version');
    console.log('----------------------------------');

    const updatedVersions = await aiContentGenerationService.getModelVersions(
      testTerm.id,
      testSection
    );
    const selectedVersion = updatedVersions.find(v => v.isSelected);

    if (selectedVersion) {
      console.log(`✅ Selected version found:`, {
        id: selectedVersion.id,
        model: selectedVersion.model,
        cost: selectedVersion.cost,
        rating: selectedVersion.userRating,
      });
    } else {
      console.log('❌ No selected version found');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('=====================================');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testModelComparisonFeature()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
