#!/usr/bin/env tsx

import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import path from 'path';

async function analyzeAIMLExcel() {
  console.log('📊 Analyzing AIML Excel file (6k terms)...\n');
  
  const filePath = path.join(process.cwd(), 'data', 'aiml.xlsx');
  
  try {
    console.log('⏳ Reading large Excel file (this may take a moment)...');
    const buffer = await readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    console.log(`📋 Workbook has ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}\n`);
    
    // Analyze first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get range
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    console.log(`📊 Sheet "${sheetName}" dimensions:`);
    console.log(`   Rows: ${range.e.r + 1} (including header)`);
    console.log(`   Columns: ${range.e.c + 1}\n`);
    
    // Get headers (first row)
    const headers: string[] = [];
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      headers.push(cell ? String(cell.v) : `Column ${col + 1}`);
    }
    
    console.log('📋 Column Headers:');
    headers.forEach((header, index) => {
      if (index < 10 || index > headers.length - 5) {
        console.log(`   ${index + 1}: ${header}`);
      } else if (index === 10) {
        console.log(`   ... (${headers.length - 15} more columns) ...`);
      }
    });
    
    // Sample first few rows to understand data
    console.log('\n📊 Sample Data (first 5 terms):');
    for (let row = 1; row <= Math.min(5, range.e.r); row++) {
      const termCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      const termName = termCell ? String(termCell.v) : '[Empty]';
      
      // Count non-empty cells in this row
      let nonEmptyCount = 0;
      for (let col = 0; col <= range.e.c; col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (cell && cell.v !== undefined && cell.v !== null && String(cell.v).trim() !== '') {
          nonEmptyCount++;
        }
      }
      
      console.log(`   Row ${row}: "${termName}" - ${nonEmptyCount}/${headers.length} columns filled`);
    }
    
    // Analyze column patterns
    console.log('\n📊 Column Pattern Analysis:');
    const columnGroups = {
      introduction: 0,
      prerequisites: 0,
      theoretical: 0,
      implementation: 0,
      applications: 0,
      metadata: 0,
      other: 0
    };
    
    headers.forEach(header => {
      const headerLower = header.toLowerCase();
      if (headerLower.includes('introduction')) columnGroups.introduction++;
      else if (headerLower.includes('prerequisite')) columnGroups.prerequisites++;
      else if (headerLower.includes('theoretical') || headerLower.includes('theory')) columnGroups.theoretical++;
      else if (headerLower.includes('implementation') || headerLower.includes('code')) columnGroups.implementation++;
      else if (headerLower.includes('application') || headerLower.includes('use case')) columnGroups.applications++;
      else if (headerLower.includes('metadata') || headerLower.includes('tag')) columnGroups.metadata++;
      else columnGroups.other++;
    });
    
    console.log('   Column Groups:');
    Object.entries(columnGroups).forEach(([group, count]) => {
      if (count > 0) {
        console.log(`     ${group}: ${count} columns`);
      }
    });
    
    // Check if this matches our 42-section structure
    console.log('\n✅ Summary:');
    console.log(`   Total Terms: ${range.e.r} (excluding header)`);
    console.log(`   Total Columns: ${headers.length}`);
    console.log(`   Expected Structure: ${headers.length === 295 ? '✅ Matches 295-column format' : '⚠️  Different from expected 295 columns'}`);
    
  } catch (error) {
    console.error('❌ Error analyzing Excel file:', error);
    if (error.message?.includes('out of memory')) {
      console.error('\n💡 Tip: The file is too large. Consider using streaming or processing in chunks.');
    }
  }
}

// Run analysis
analyzeAIMLExcel().catch(console.error);