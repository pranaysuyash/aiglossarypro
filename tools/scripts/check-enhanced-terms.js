import { db } from '../server/db';
import { enhancedTerms } from '../shared/enhancedSchema';
async function checkEnhancedTerms() {
    try {
        const terms = await db.select({
            id: enhancedTerms.id,
            name: enhancedTerms.name,
            slug: enhancedTerms.slug,
            createdAt: enhancedTerms.createdAt,
        }).from(enhancedTerms);
        console.log(`Found ${terms.length} enhanced terms:`);
        terms.forEach(term => {
            console.log(`- ${term.name} (ID: ${term.id}, Slug: ${term.slug})`);
        });
        // Check specifically for our CNN term
        const cnnTermId = '2d5e7c90-a123-45b6-9def-0123456789ab';
        const cnnTerm = terms.find(t => t.id === cnnTermId);
        if (cnnTerm) {
            console.log('\n✅ CNN term found!');
        }
        else {
            console.log('\n❌ CNN term NOT found with expected ID');
        }
    }
    catch (error) {
        console.error('Error checking enhanced terms:', error);
    }
    process.exit(0);
}
checkEnhancedTerms();
