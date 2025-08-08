import { enhancedStorage } from '../server/enhancedTermsStorage';
async function testEnhancedTermsStorage() {
    try {
        const termId = '6a4b16b3-a686-4d7c-91d2-284e805f6f9d';
        console.log('Testing enhancedTermsStorage.getTermSections...');
        const sections = await enhancedStorage.getTermSections(termId);
        console.log(`Found ${sections.length} sections`);
        if (sections.length > 0) {
            console.log('\nFirst 3 sections:');
            sections.slice(0, 3).forEach(section => {
                console.log(`- ${section.sectionName} (Type: ${section.displayType})`);
            });
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}
testEnhancedTermsStorage();
