import { enhancedStorage } from '../server/enhancedStorage';
import { db } from '../server/db';
import { enhancedTerms } from '../shared/enhancedSchema';
import { eq } from 'drizzle-orm';

async function testAPILogic() {
  try {
    const id = '6a4b16b3-a686-4d7c-91d2-284e805f6f9d';
    
    // Get the term like the API does
    const [term] = await db
      .select()
      .from(enhancedTerms)
      .where(eq(enhancedTerms.id, id))
      .limit(1);
    
    console.log('Term found:', !!term);
    
    // Get sections
    const sections = await enhancedStorage.getTermSections(id);
    console.log(`Sections found: ${sections.length}`);
    
    // Get AI content
    const aiContent = await enhancedStorage.getTermContent(id);
    console.log('AI content keys:', Object.keys(aiContent));
    
    // Build response like API does
    const enhancedTerm = {
      ...term,
      sections,
      aiContent,
      hasContent: sections.length > 0,
      completionStatus: {
        totalSections: 42,
        completedSections: sections.filter((s: any) => s.isCompleted).length,
        percentage: Math.round((sections.filter((s: any) => s.isCompleted).length / 42) * 100),
      },
    };
    
    console.log('\nEnhanced term sections length:', enhancedTerm.sections.length);
    console.log('First section:', enhancedTerm.sections[0]);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testAPILogic();