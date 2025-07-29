import { db } from '../server/db';
import { enhancedTerms } from '../shared/enhancedSchema';
import { eq } from 'drizzle-orm';

async function debugTermStructure() {
  try {
    const id = '6a4b16b3-a686-4d7c-91d2-284e805f6f9d';
    
    // Get the term directly from DB
    const [term] = await db
      .select()
      .from(enhancedTerms)
      .where(eq(enhancedTerms.id, id))
      .limit(1);
    
    console.log('Term keys:', Object.keys(term));
    console.log('Term has sections property:', 'sections' in term);
    if ('sections' in term) {
      console.log('Term.sections value:', term.sections);
      console.log('Term.sections type:', typeof term.sections);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

debugTermStructure();