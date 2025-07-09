import { db } from '../server/db';
import { modelContentVersions } from '../shared/enhancedSchema';
import { eq, and } from 'drizzle-orm';

async function quickTest() {
  console.log('🧪 Quick test of model versions functionality...');
  
  try {
    // Check if we have any model versions in the database
    const versions = await db.select()
      .from(modelContentVersions)
      .limit(5);
    
    console.log(`✅ Found ${versions.length} model versions in database`);
    
    if (versions.length > 0) {
      console.log('📋 Recent versions:');
      versions.forEach((version, index) => {
        console.log(`  ${index + 1}. Term: ${version.termId.substring(0, 8)}..., Model: ${version.model}, Section: ${version.sectionName}`);
      });
      
      // Test the getModelVersions function from the service
      const aiContentGenerationService = await import('../server/services/aiContentGenerationService');
      const testTermId = versions[0].termId;
      const testSectionName = versions[0].sectionName;
      
      console.log(`\n🔍 Testing getModelVersions for term ${testTermId.substring(0, 8)}...`);
      const serviceVersions = await aiContentGenerationService.aiContentGenerationService.getModelVersions(testTermId, testSectionName);
      
      console.log(`✅ Service returned ${serviceVersions.length} versions`);
      serviceVersions.forEach((version, index) => {
        console.log(`  ${index + 1}. Model: ${version.model}, Cost: $${version.cost}, Tokens: ${version.totalTokens}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
}

quickTest().catch(console.error);