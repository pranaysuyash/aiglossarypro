/**
 * Fix Database Import - Complete Fresh Import
 * Resolves the category ID mismatch by doing a clean import of all processed data
 */

import fs from 'fs';
import path from 'path';
import { db } from './server/db';
import { categories, subcategories, terms, termSubcategories } from './shared/schema';
import { enhancedTerms } from './shared/enhancedSchema';
import { sql } from 'drizzle-orm';

interface ImportStats {
  categories: number;
  subcategories: number;
  terms: number;
  enhanced: number;
  duration: number;
}

async function fixDatabaseImport(): Promise<ImportStats> {
  const startTime = Date.now();
  console.log('🚀 Starting complete database fix and fresh import...\n');
  
  const stats: ImportStats = {
    categories: 0,
    subcategories: 0,
    terms: 0,
    enhanced: 0,
    duration: 0
  };

  try {
    const chunksDir = 'temp/chunks_1750527121747';
    
    if (!fs.existsSync(chunksDir)) {
      throw new Error(`Chunks directory not found: ${chunksDir}`);
    }

    // Step 1: Clear existing data (in reverse dependency order)
    console.log('🧹 Clearing existing data...');
    await db.delete(termSubcategories);
    await db.delete(terms);
    await db.delete(enhancedTerms);
    await db.delete(subcategories);
    await db.delete(categories);
    console.log('   ✅ Existing data cleared\n');

    // Step 2: Import Categories
    console.log('📂 Importing categories...');
    const categoryFiles = fs.readdirSync(chunksDir)
      .filter(f => f.startsWith('categories_chunk_'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/categories_chunk_(\d+)\.json/)?.[1] || '0');
        const bNum = parseInt(b.match(/categories_chunk_(\d+)\.json/)?.[1] || '0');
        return aNum - bNum;
      });

    for (const file of categoryFiles) {
      const filePath = path.join(chunksDir, file);
      const chunkData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (chunkData.categories && chunkData.categories.length > 0) {
        await db.insert(categories).values(chunkData.categories);
        stats.categories += chunkData.categories.length;
        console.log(`   📦 Imported ${chunkData.categories.length} categories from ${file}`);
      }
    }
    console.log(`   ✅ Total categories imported: ${stats.categories}\n`);

    // Step 3: Import Subcategories
    console.log('📋 Importing subcategories...');
    const subcategoryFiles = fs.readdirSync(chunksDir)
      .filter(f => f.startsWith('subcategories_chunk_'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/subcategories_chunk_(\d+)\.json/)?.[1] || '0');
        const bNum = parseInt(b.match(/subcategories_chunk_(\d+)\.json/)?.[1] || '0');
        return aNum - bNum;
      });

    for (const file of subcategoryFiles) {
      const filePath = path.join(chunksDir, file);
      const chunkData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (chunkData.subcategories && chunkData.subcategories.length > 0) {
        await db.insert(subcategories).values(chunkData.subcategories);
        stats.subcategories += chunkData.subcategories.length;
        console.log(`   📦 Imported ${chunkData.subcategories.length} subcategories from ${file}`);
      }
    }
    console.log(`   ✅ Total subcategories imported: ${stats.subcategories}\n`);

    // Step 4: Import Terms
    console.log('📄 Importing terms...');
    const termFiles = fs.readdirSync(chunksDir)
      .filter(f => f.startsWith('terms_chunk_'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/terms_chunk_(\d+)\.json/)?.[1] || '0');
        const bNum = parseInt(b.match(/terms_chunk_(\d+)\.json/)?.[1] || '0');
        return aNum - bNum;
      });

    console.log(`   📦 Found ${termFiles.length} term chunks to process`);

    for (let i = 0; i < termFiles.length; i++) {
      const file = termFiles[i];
      const filePath = path.join(chunksDir, file);
      const chunkData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (chunkData.terms && chunkData.terms.length > 0) {
        // Import terms in smaller batches to avoid memory issues
        const batchSize = 50;
        const termsData = chunkData.terms;
        
        for (let j = 0; j < termsData.length; j += batchSize) {
          const batch = termsData.slice(j, j + batchSize);
          
          // Insert terms
          const insertedTerms = await db.insert(terms).values(
            batch.map(term => ({
              name: term.name,
              definition: term.definition,
              categoryId: term.categoryId
            }))
          ).returning();

          // Insert term-subcategory relationships
          const relationships = [];
          for (let k = 0; k < batch.length; k++) {
            const term = batch[k];
            const insertedTerm = insertedTerms[k];
            
            if (term.subcategoryIds && term.subcategoryIds.length > 0) {
              for (const subcategoryId of term.subcategoryIds) {
                relationships.push({
                  termId: insertedTerm.id,
                  subcategoryId: subcategoryId
                });
              }
            }
          }
          
          if (relationships.length > 0) {
            await db.insert(termSubcategories)
              .values(relationships)
              .onConflictDoNothing();
          }
          
          stats.terms += batch.length;
        }
        
        console.log(`   📦 Chunk ${i + 1}/${termFiles.length}: ${termsData.length} terms imported`);
        
        // Show progress every 10 chunks
        if ((i + 1) % 10 === 0) {
          console.log(`   📊 Progress: ${stats.terms} terms imported so far`);
        }
      }
    }
    console.log(`   ✅ Total terms imported: ${stats.terms}\n`);

    // Step 5: Migrate to Enhanced Terms
    console.log('✨ Creating enhanced terms from imported terms...');
    const allTerms = await db.select().from(terms);
    
    const enhancedData = allTerms.map(term => ({
      name: term.name,
      slug: term.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      shortDefinition: term.definition.substring(0, 200),
      fullDefinition: term.definition,
      difficultyLevel: 'intermediate' as const,
      parseVersion: '2.0'
    }));

    // Insert in batches
    const enhancedBatchSize = 100;
    for (let i = 0; i < enhancedData.length; i += enhancedBatchSize) {
      const batch = enhancedData.slice(i, i + enhancedBatchSize);
      await db.insert(enhancedTerms)
        .values(batch)
        .onConflictDoNothing();
      stats.enhanced += batch.length;
    }
    console.log(`   ✅ Enhanced terms created: ${stats.enhanced}\n`);

    // Final verification
    console.log('🔍 Final verification...');
    const finalCounts = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(categories),
      db.select({ count: sql<number>`count(*)` }).from(subcategories),
      db.select({ count: sql<number>`count(*)` }).from(terms),
      db.select({ count: sql<number>`count(*)` }).from(enhancedTerms)
    ]);

    console.log('📊 Final Database State:');
    console.log(`   📂 Categories: ${finalCounts[0][0].count}`);
    console.log(`   📋 Subcategories: ${finalCounts[1][0].count}`);
    console.log(`   📄 Terms: ${finalCounts[2][0].count}`);
    console.log(`   ✨ Enhanced Terms: ${finalCounts[3][0].count}`);

    stats.duration = (Date.now() - startTime) / 1000;
    
    console.log(`\n🎉 Database import completed successfully!`);
    console.log(`⏱️  Total duration: ${stats.duration.toFixed(2)} seconds`);
    console.log(`📈 Import rate: ${(stats.terms / stats.duration).toFixed(1)} terms/second`);

    return stats;

  } catch (error) {
    stats.duration = (Date.now() - startTime) / 1000;
    console.error('❌ Database import failed:', error);
    throw error;
  }
}

// Run the fix
fixDatabaseImport()
  .then((stats) => {
    console.log('\n✅ Database fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database fix failed:', error);
    process.exit(1);
  }); 