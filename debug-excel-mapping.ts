#!/usr/bin/env tsx

import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import path from 'path';
import COMPLETE_CONTENT_SECTIONS from './scripts/complete_42_sections_config';

async function debugExcelMapping() {
  console.log('🔍 Debugging Excel → Section Mapping\n');

  // Read Excel file
  const filePath = path.join(process.cwd(), 'data', 'row1.xlsx');
  const buffer = await readFile(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  const headers = data[0] as string[];
  const row = data[1]; // First data row
  const termName = row[0];
  
  console.log(`📊 Excel File Info:`);
  console.log(`   - Headers: ${headers.length}`);
  console.log(`   - Data rows: ${data.length - 1}`);
  console.log(`   - First term: ${termName}\n`);
  
  // Create columns map
  const columns = new Map<string, any>();
  headers.forEach((header, index) => {
    if (header && row[index] !== undefined && row[index] !== null && row[index] !== '') {
      columns.set(header, row[index]);
    }
  });
  
  console.log(`📋 Non-empty columns: ${columns.size}\n`);
  
  // Test section mapping
  console.log(`🎯 Testing Section Mapping (42 sections):\n`);
  
  let totalMappedSections = 0;
  let totalMappedColumns = 0;
  
  for (let i = 0; i < Math.min(5, COMPLETE_CONTENT_SECTIONS.length); i++) {
    const sectionConfig = COMPLETE_CONTENT_SECTIONS[i];
    const sectionData: any = {};
    let hasData = false;
    let foundColumns = 0;
    
    // Test each column in this section
    for (const columnName of sectionConfig.columns) {
      const value = columns.get(columnName);
      if (value !== undefined && value !== null && value !== '') {
        const cleanKey = columnName
          .replace(sectionConfig.sectionName + ' – ', '')
          .replace(/^[^–]+– /, '');
        
        sectionData[cleanKey] = value;
        hasData = true;
        foundColumns++;
        totalMappedColumns++;
      }
    }
    
    if (hasData) totalMappedSections++;
    
    console.log(`${i + 1}. ${sectionConfig.sectionName}`);
    console.log(`   - Expected columns: ${sectionConfig.columns.length}`);
    console.log(`   - Found columns: ${foundColumns}`);
    console.log(`   - Display type: ${sectionConfig.displayType}`);
    console.log(`   - Has data: ${hasData ? '✅' : '❌'}`);
    
    if (hasData && i < 2) {
      console.log(`   - Sample keys: ${Object.keys(sectionData).slice(0, 3).join(', ')}`);
    }
    console.log('');
  }
  
  console.log(`📈 Summary:`);
  console.log(`   - Total sections with data: ${totalMappedSections}`);
  console.log(`   - Total columns mapped: ${totalMappedColumns}`);
  console.log(`   - Expected sections: ${COMPLETE_CONTENT_SECTIONS.length}`);
  
  // Show what Introduction section looks like
  const introSection = COMPLETE_CONTENT_SECTIONS[0];
  console.log(`\n🔎 Introduction Section Detail:`);
  console.log(`   Expected columns (${introSection.columns.length}):`);
  introSection.columns.forEach((col, i) => {
    const hasValue = columns.has(col);
    console.log(`   ${i + 1}. ${col} ${hasValue ? '✅' : '❌'}`);
  });
}

debugExcelMapping().catch(console.error);