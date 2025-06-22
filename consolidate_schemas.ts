import fs from 'fs';
import path from 'path';

// Script to consolidate the duplicate schema issue
// Since both tables are empty, we can safely consolidate

async function consolidateSchemas() {
  console.log('🔄 Starting schema consolidation...\n');
  
  // Files that need to be updated to use enhanced schema
  const filesToUpdate = [
    './server/routes/search.ts',
    './server/routes/admin.ts',
    './server/streamingImporter.ts',
    './server/batchedImporter.ts',
    './server/chunkedImporter.ts',
    './complete_terms_import.ts',
    './fix_database_import.ts',
    './check_db_status.ts',
    './test_single_chunk_import.ts'
  ];
  
  console.log('📋 Files to update:');
  filesToUpdate.forEach(file => console.log(`  - ${file}`));
  
  // Update each file
  for (const filePath of filesToUpdate) {
    try {
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace imports from original schema to enhanced schema
        const originalImport = /import\s*{([^}]+)}\s*from\s*['"]\.\.?\/.*shared\/schema['"];?/g;
        const enhancedImport = /import\s*{([^}]+)}\s*from\s*['"]\.\.?\/.*shared\/enhancedSchema['"];?/g;
        
        // Check if file already has enhanced schema import
        const hasEnhancedImport = enhancedImport.test(content);
        
        if (!hasEnhancedImport) {
          // Replace original schema imports with enhanced schema imports
          content = content.replace(originalImport, (match, imports) => {
            // Determine the correct relative path
            const relativePath = filePath.startsWith('./server/') 
              ? '../../shared/enhancedSchema'
              : './shared/enhancedSchema';
            
            return `import { ${imports} } from "${relativePath}";`;
          });
          
          // Write the updated content back
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ Updated ${filePath}`);
        } else {
          console.log(`⏭️  ${filePath} already uses enhanced schema`);
        }
      } else {
        console.log(`⚠️  ${filePath} does not exist`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error);
    }
  }
  
  console.log('\n🎯 Schema consolidation complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Review the updated files for any type mismatches');
  console.log('2. Update storage methods to work with enhanced schema');
  console.log('3. Test the application to ensure everything works');
  console.log('4. Consider removing the original schema file if no longer needed');
}

consolidateSchemas().catch(console.error); 