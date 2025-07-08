#!/usr/bin/env tsx

import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import path from 'path';

async function checkAllExcelFiles() {
  const files = ['aiml.xlsx', 'aiml2.xlsx', 'row1.xlsx'];
  
  for (const file of files) {
    try {
      console.log(`\n📊 Checking ${file}:`);
      const filePath = path.join(process.cwd(), 'data', file);
      const buffer = await readFile(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      console.log(`  - Total rows: ${data.length}`);
      console.log(`  - Data rows: ${data.length - 1}`);
      console.log(`  - Columns: ${data[0] ? data[0].length : 0}`);
      
      // Check first few terms
      const validTerms = [];
      for (let i = 1; i < Math.min(6, data.length); i++) {
        if (data[i] && data[i][0] && data[i][0] !== '') {
          validTerms.push(data[i][0]);
        }
      }
      
      if (validTerms.length > 0) {
        console.log(`  - First terms: ${validTerms.slice(0, 3).join(', ')}${validTerms.length > 3 ? '...' : ''}`);
        console.log(`  - Valid terms found: ${validTerms.length}+`);
      } else {
        console.log(`  - No valid terms found`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error reading ${file}: ${error.message}`);
    }
  }
}

checkAllExcelFiles().catch(console.error);