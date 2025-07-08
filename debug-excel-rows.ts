#!/usr/bin/env tsx

import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import path from 'path';

async function debugExcelRows() {
  const filePath = path.join(process.cwd(), 'data', 'row1.xlsx');
  const buffer = await readFile(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  console.log('Total rows in Excel:', data.length);
  console.log('Data rows (excluding header):', data.length - 1);
  
  // Check first few terms
  console.log('\nFirst 10 terms:');
  for (let i = 1; i <= Math.min(10, data.length - 1); i++) {
    const termName = data[i] && data[i][0] ? data[i][0] : '[EMPTY]';
    console.log(`${i}. ${termName}`);
  }
  
  // Check for empty rows
  console.log('\nEmpty term rows:');
  let emptyCount = 0;
  for (let i = 1; i < data.length; i++) {
    if (!data[i] || !data[i][0] || data[i][0] === '') {
      console.log(`Row ${i}: empty`);
      emptyCount++;
    }
  }
  console.log(`Total empty rows: ${emptyCount}`);
  console.log(`Valid term rows: ${data.length - 1 - emptyCount}`);
}

debugExcelRows().catch(console.error);