import { db } from '../server/db';
import { sections, enhancedTerms } from '../shared/enhancedSchema';
import { eq } from 'drizzle-orm';

async function checkTermSections() {
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

    // Check sections
    const termSections = await db.select().from(sections)
      .where(eq(sections.termId, cnnTerm.id));

    console.log(`\nFound ${termSections.length} sections for this term`);

    if (termSections.length > 0) {
      console.log('\nFirst 5 sections:');
      termSections.slice(0, 5).forEach(section => {
        console.log(`- ${section.name} (Order: ${section.order}, Completed: ${section.isCompleted})`);
      });
    }

  } catch (error) {
    console.error('Error checking sections:', error);
  }
  process.exit(0);
}

checkTermSections();