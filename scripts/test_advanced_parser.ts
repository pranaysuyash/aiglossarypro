#!/usr/bin/env tsx
/**
 * Test script to verify the AdvancedExcelParser can process row1.xlsx 
 * and extract the complete 42-section structure from 295 columns
 */

import { AdvancedExcelParser, importComplexTerms } from './server/advancedExcelParser';
import path from 'path';

async function testAdvancedParser() {
  console.log('🧪 Testing AdvancedExcelParser with row1.xlsx...');
  
  try {
    // Initialize the parser
    const parser = new AdvancedExcelParser();
    
    // Path to row1.xlsx
    const filePath = path.join(process.cwd(), 'data', 'row1.xlsx');
    console.log(`📂 Processing file: ${filePath}`);
    
    // Read the Excel file and parse it
    const fs = await import('fs');
    const buffer = fs.readFileSync(filePath);
    const parsedTerms = await parser.parseComplexExcel(buffer, {
      enableAI: false,
      mode: 'none',
      costOptimization: true
    }, 'row1.xlsx');
    
    console.log(`\n📊 Parsing Results:`);
    console.log(`   Terms found: ${parsedTerms.length}`);
    
    if (parsedTerms.length > 0) {
      const firstTerm = parsedTerms[0];
      console.log(`\n🔍 First term analysis:`);
      console.log(`   Name: ${firstTerm.name}`);
      console.log(`   Sections: ${firstTerm.sections.size}`);
      console.log(`   Categories: ${JSON.stringify(firstTerm.categories, null, 2)}`);
      
      // Show section details
      console.log(`\n📋 Section breakdown:`);
      let index = 1;
      for (const [sectionName, sectionData] of firstTerm.sections) {
        console.log(`   ${index}. ${sectionName}: ${JSON.stringify(sectionData).length} chars`);
        index++;
      }
      
      // Show Introduction section details
      const introSection = firstTerm.sections.get('Introduction');
      if (introSection) {
        console.log(`\n📝 Introduction section sample:`);
        console.log(`   Content: ${JSON.stringify(introSection, null, 2).substring(0, 300)}...`);
      }
      
      // Test import to database
      console.log(`\n💾 Testing database import...`);
      await importComplexTerms([firstTerm]);
      console.log(`✅ Successfully imported first term to database`);
      
      // Save parsed data for inspection
      const outputPath = path.join(process.cwd(), 'temp', 'advanced_parser_test_output.json');
      const fs = await import('fs/promises');
      await fs.writeFile(outputPath, JSON.stringify(parsedTerms, null, 2));
      console.log(`💾 Full parsed data saved to: ${outputPath}`);
      
    } else {
      console.log(`❌ No terms found - check file format or parser configuration`);
    }
    
  } catch (error) {
    console.error(`❌ Error testing advanced parser:`, error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
  }
}

// Run the test
testAdvancedParser()
  .then(() => {
    console.log(`\n🎉 Advanced parser test completed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`💥 Test failed:`, error);
    process.exit(1);
  });