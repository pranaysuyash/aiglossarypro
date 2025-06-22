import fs from 'fs';
import { db } from './server/db';
import {  terms, categories, subcategories, termSubcategories  } from "./shared/schema";
import { eq } from 'drizzle-orm';

async function testSingleChunkImport() {
  try {
    console.log('🧪 Testing single chunk import...');
    
    // Read the first terms chunk
    const chunkPath = 'temp/chunks_1750527121747/terms_chunk_1.json';
    const chunkData = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
    
    console.log(`📦 Chunk contains ${chunkData.terms.length} terms`);
    
    // Test importing first 5 terms
    const testTerms = chunkData.terms.slice(0, 5);
    console.log(`🎯 Testing with ${testTerms.length} terms`);
    
    let imported = 0;
    let errors = 0;
    
    for (const termData of testTerms) {
      try {
        console.log(`\n🔄 Processing term: ${termData.name}`);
        
        // Check if term already exists
        const existingTerm = await db.select()
          .from(terms)
          .where(eq(terms.name, termData.name))
          .limit(1);
        
        if (existingTerm.length > 0) {
          console.log(`   ⏭️  Term already exists, skipping`);
          continue;
        }
        
        // Verify category exists
        const categoryExists = await db.select()
          .from(categories)
          .where(eq(categories.id, termData.categoryId))
          .limit(1);
        
        if (categoryExists.length === 0) {
          console.log(`   ❌ Category ${termData.categoryId} not found`);
          errors++;
          continue;
        }
        
        // Insert term
        const insertedTerm = await db.insert(terms).values({
          name: termData.name,
          definition: termData.definition,
          categoryId: termData.categoryId,
        }).returning();
        
        console.log(`   ✅ Term inserted with ID: ${insertedTerm[0].id}`);
        
        // Insert subcategory relationships
        if (termData.subcategoryIds && termData.subcategoryIds.length > 0) {
          for (const subcategoryId of termData.subcategoryIds) {
            // Verify subcategory exists
            const subcategoryExists = await db.select()
              .from(subcategories)
              .where(eq(subcategories.id, subcategoryId))
              .limit(1);
            
            if (subcategoryExists.length > 0) {
              await db.insert(termSubcategories).values({
                termId: insertedTerm[0].id,
                subcategoryId: subcategoryId,
              });
              console.log(`   🔗 Linked to subcategory: ${subcategoryId}`);
            } else {
              console.log(`   ⚠️  Subcategory ${subcategoryId} not found`);
            }
          }
        }
        
        imported++;
        
      } catch (termError) {
        console.error(`   ❌ Error processing term ${termData.name}:`, termError);
        errors++;
      }
    }
    
    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Successfully imported: ${imported} terms`);
    console.log(`   ❌ Errors: ${errors}`);
    
    // Check final counts
    const finalTermsCount = await db.select().from(terms);
    console.log(`   📄 Total terms in database: ${finalTermsCount.length}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSingleChunkImport(); 