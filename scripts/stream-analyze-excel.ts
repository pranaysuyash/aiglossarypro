#!/usr/bin/env tsx

import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import * as XLSX from 'xlsx';

async function streamAnalyzeExcel() {
  console.log('📊 Analyzing AIML Excel file with streaming...\n');
  
  const filePath = path.join(process.cwd(), 'data', 'aiml.xlsx');
  
  try {
    // Use XLSX streaming to handle large file
    const stream = createReadStream(filePath);
    const workbook = XLSX.readFile(filePath, { 
      type: 'file',
      cellDates: true,
      cellStyles: false,
      sheetStubs: false,
      dense: false
    });
    
    console.log(`📋 Found ${workbook.SheetNames.length} sheet(s)\n`);
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Try to get basic info without loading entire sheet
    const ref = worksheet['!ref'];
    if (ref) {
      const range = XLSX.utils.decode_range(ref);
      console.log(`📊 Sheet dimensions:`);
      console.log(`   Total rows: ${range.e.r + 1}`);
      console.log(`   Total columns: ${range.e.c + 1}`);
      console.log(`   Data rows: ${range.e.r} (excluding header)\n`);
    }
    
    // Get just the headers
    const headers: string[] = [];
    let col = 0;
    while (true) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
      if (!cell) break;
      headers.push(String(cell.v || ''));
      col++;
      if (col > 300) break; // Safety limit
    }
    
    console.log(`📋 Found ${headers.length} columns\n`);
    
    // Show first 5 and last 5 headers
    console.log('First 5 columns:');
    headers.slice(0, 5).forEach((h, i) => {
      console.log(`  ${i + 1}: ${h}`);
    });
    
    if (headers.length > 10) {
      console.log('\nLast 5 columns:');
      headers.slice(-5).forEach((h, i) => {
        console.log(`  ${headers.length - 4 + i}: ${h}`);
      });
    }
    
    // Sample first few terms
    console.log('\n📊 First 10 terms:');
    for (let row = 1; row <= 10; row++) {
      const termCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      if (termCell) {
        console.log(`  ${row}: ${termCell.v}`);
      }
    }
    
    return {
      totalRows: ref ? XLSX.utils.decode_range(ref).e.r : 0,
      totalColumns: headers.length,
      headers
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try alternative approach - just get basic file info
    console.log('\n📊 Trying alternative analysis...');
    
    try {
      const { size } = require('fs').statSync(filePath);
      console.log(`File size: ${(size / 1024 / 1024).toFixed(2)} MB`);
      
      // For very large files, we might need to process in chunks
      console.log('\n💡 For a file this size, consider:');
      console.log('1. Processing in batches (e.g., 100 terms at a time)');
      console.log('2. Using the checkpoint system for resumable imports');
      console.log('3. Running the import with increased memory: NODE_OPTIONS="--max-old-space-size=8192"');
    } catch (e) {
      console.error('Could not get file stats:', e.message);
    }
  }
}

// Run analysis
streamAnalyzeExcel().catch(console.error);