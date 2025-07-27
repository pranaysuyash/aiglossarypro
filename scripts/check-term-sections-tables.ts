import { db } from '../server/db';
import { sections, termSections, enhancedTerms } from '../shared/enhancedSchema';
import { eq } from 'drizzle-orm';

async function checkBothSectionsTables() {
  try {
    // Get the CNN term
    const [cnnTerm] = await db.select().from(enhancedTerms)
      .where(eq(enhancedTerms.slug, 'convolutional-neural-network'))
      .limit(1);

    if (!cnnTerm) {
      console.log('CNN term not found');
      return;
    }

    console.log(`Found CNN term with ID: ${cnnTerm.id}`);

    // Check sections table
    const basicSections = await db.select().from(sections)
      .where(eq(sections.termId, cnnTerm.id));

    console.log(`\n'sections' table: Found ${basicSections.length} sections`);
    if (basicSections.length > 0) {
      console.log('First 3:');
      basicSections.slice(0, 3).forEach(s => 
        console.log(`- ${s.name} (Order: ${s.displayOrder})`));
    }

    // Check termSections table  
    const contentSections = await db.select().from(termSections)
      .where(eq(termSections.termId, cnnTerm.id));

    console.log(`\n'termSections' table: Found ${contentSections.length} sections`);
    if (contentSections.length > 0) {
      console.log('First 3:');
      contentSections.slice(0, 3).forEach(s => 
        console.log(`- ${s.sectionName} (Type: ${s.displayType}, Has data: ${!!s.sectionData})`));
    }

  } catch (error) {
    console.error('Error checking sections:', error);
  }
  process.exit(0);
}

checkBothSectionsTables();