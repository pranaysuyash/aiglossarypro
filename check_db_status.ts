import { db } from './server/db';
import { categories, subcategories, terms } from './shared/schema';
import { enhancedTerms, termSections } from './shared/enhancedSchema';

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Checking database status...\n');
    
    // Count categories
    const categoriesResult = await db.select().from(categories);
    console.log(`📂 Categories: ${categoriesResult.length}`);
    
    // Count subcategories  
    const subcategoriesResult = await db.select().from(subcategories);
    console.log(`📋 Subcategories: ${subcategoriesResult.length}`);
    
    // Count regular terms
    const termsResult = await db.select().from(terms);
    console.log(`📄 Terms: ${termsResult.length}`);
    
    // Count enhanced terms
    const enhancedResult = await db.select().from(enhancedTerms);
    console.log(`✨ Enhanced Terms: ${enhancedResult.length}`);
    
    // Count sections
    const sectionsResult = await db.select().from(termSections);
    console.log(`📑 Term Sections: ${sectionsResult.length}`);
    
    console.log('\n📊 Summary:');
    console.log(`Total terms in database: ${termsResult.length}`);
    console.log(`Enhanced terms: ${enhancedResult.length}`);
    console.log(`Sections created: ${sectionsResult.length}`);
    
    // Calculate expected sections (200 terms × 42 sections = 8,400)
    const expectedSections = enhancedResult.length * 42;
    const sectionProgress = sectionsResult.length > 0 ? (sectionsResult.length / expectedSections * 100).toFixed(1) : 0;
    console.log(`Expected sections for ${enhancedResult.length} enhanced terms: ${expectedSections}`);
    console.log(`Section population progress: ${sectionProgress}%`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkDatabaseStatus(); 