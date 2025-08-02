#!/usr/bin/env tsx
import { db } from './server/db';
import { enhancedTerms, termSections } from './shared/enhancedSchema';
async function checkDatabaseState() {
    try {
        console.log('🔍 Checking enhanced database state...');
        const enhancedTermsCount = await db.select().from(enhancedTerms);
        console.log(`📊 Enhanced terms count: ${enhancedTermsCount.length}`);
        if (enhancedTermsCount.length > 0) {
            console.log('📋 Enhanced terms:');
            enhancedTermsCount.forEach((term, i) => {
                console.log(`  ${i + 1}. ${term.name} (${term.mainCategories?.length || 0} categories)`);
            });
        }
        const sectionsCount = await db.select().from(termSections);
        console.log(`📑 Term sections count: ${sectionsCount.length}`);
        if (sectionsCount.length > 0) {
            console.log('📋 First 5 sections:');
            sectionsCount.slice(0, 5).forEach((section, i) => {
                console.log(`  ${i + 1}. ${section.sectionName} (${section.displayType})`);
            });
        }
        // Check for "Characteristic Function" specifically
        const charFuncTerm = enhancedTermsCount.find(t => t.name === 'Characteristic Function');
        if (charFuncTerm) {
            console.log(`\n🎯 Found "Characteristic Function" term:`);
            console.log(`  ID: ${charFuncTerm.id}`);
            console.log(`  Main Categories: ${charFuncTerm.mainCategories?.join(', ') || 'None'}`);
            console.log(`  Sub Categories: ${charFuncTerm.subCategories?.join(', ') || 'None'}`);
            console.log(`  Related Concepts: ${charFuncTerm.relatedConcepts?.join(', ') || 'None'}`);
            // Check sections for this term
            const termSectionsForChar = sectionsCount.filter(s => s.termId === charFuncTerm.id);
            console.log(`  Sections count: ${termSectionsForChar.length}`);
            if (termSectionsForChar.length > 0) {
                console.log(`  Section types: ${termSectionsForChar.map(s => s.sectionName).join(', ')}`);
            }
        }
        console.log('\n✅ Database state check completed');
    }
    catch (error) {
        console.error('❌ Error checking database state:', error);
    }
    process.exit(0);
}
checkDatabaseState();
