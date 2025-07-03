#!/usr/bin/env tsx

import { readFile } from 'fs/promises';
import * as XLSX from 'xlsx';
import path from 'path';

async function analyzeExcelColumns() {
  const filePath = path.join(process.cwd(), 'data', 'row1.xlsx');
  
  console.log('📊 Analyzing Excel file structure...\n');
  
  try {
    // Read the Excel file
    const buffer = await readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON to analyze
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Get headers (first row)
    const headers = jsonData[0] as string[];
    console.log(`Total columns: ${headers.length}\n`);
    
    // Get first data row (second row)
    const dataRow = jsonData[1] as any[];
    
    console.log('📋 Column Analysis (Header → Sample Value):\n');
    console.log('='.repeat(100));
    
    // Analyze each column
    headers.forEach((header, index) => {
      const value = dataRow[index];
      const valueType = typeof value;
      const displayValue = value ? 
        (String(value).length > 100 ? String(value).substring(0, 100) + '...' : String(value)) : 
        '[EMPTY]';
      
      console.log(`Column ${index + 1}: ${header}`);
      console.log(`  Type: ${valueType}`);
      console.log(`  Value: ${displayValue}`);
      console.log('-'.repeat(100));
    });
    
    // Group columns by apparent purpose
    console.log('\n📊 Column Grouping Analysis:\n');
    
    const groups = {
      core: [] as string[],
      definitions: [] as string[],
      categories: [] as string[],
      examples: [] as string[],
      technical: [] as string[],
      metadata: [] as string[],
      empty: [] as string[]
    };
    
    headers.forEach((header, index) => {
      const value = dataRow[index];
      const headerLower = header.toLowerCase();
      
      if (!value || String(value).trim() === '') {
        groups.empty.push(`${index + 1}: ${header}`);
      } else if (headerLower.includes('term') || headerLower.includes('name')) {
        groups.core.push(`${index + 1}: ${header}`);
      } else if (headerLower.includes('definition') || headerLower.includes('description') || headerLower.includes('explanation')) {
        groups.definitions.push(`${index + 1}: ${header}`);
      } else if (headerLower.includes('category') || headerLower.includes('domain') || headerLower.includes('field')) {
        groups.categories.push(`${index + 1}: ${header}`);
      } else if (headerLower.includes('example') || headerLower.includes('use case') || headerLower.includes('application')) {
        groups.examples.push(`${index + 1}: ${header}`);
      } else if (headerLower.includes('formula') || headerLower.includes('algorithm') || headerLower.includes('implementation')) {
        groups.technical.push(`${index + 1}: ${header}`);
      } else {
        groups.metadata.push(`${index + 1}: ${header}`);
      }
    });
    
    console.log('Core Information:', groups.core.join(', ') || 'None');
    console.log('Definitions:', groups.definitions.join(', ') || 'None');
    console.log('Categories:', groups.categories.join(', ') || 'None');
    console.log('Examples:', groups.examples.join(', ') || 'None');
    console.log('Technical:', groups.technical.join(', ') || 'None');
    console.log('Metadata:', groups.metadata.join(', ') || 'None');
    console.log('Empty Columns:', groups.empty.length, 'columns');
    
    // Analyze data quality
    console.log('\n📈 Data Quality Analysis:\n');
    
    let filledColumns = 0;
    let totalDataPoints = 0;
    let filledDataPoints = 0;
    
    headers.forEach((header, index) => {
      let columnFilledCount = 0;
      for (let row = 1; row < Math.min(jsonData.length, 10); row++) {
        const value = jsonData[row][index];
        totalDataPoints++;
        if (value && String(value).trim() !== '') {
          columnFilledCount++;
          filledDataPoints++;
        }
      }
      if (columnFilledCount > 0) filledColumns++;
    });
    
    console.log(`Columns with data: ${filledColumns}/${headers.length} (${(filledColumns/headers.length*100).toFixed(1)}%)`);
    console.log(`Data completeness: ${filledDataPoints}/${totalDataPoints} cells filled (${(filledDataPoints/totalDataPoints*100).toFixed(1)}%)`);
    
    // Show specific column recommendations
    console.log('\n🎯 Recommended Column Mappings for 42-Section Structure:\n');
    
    const recommendations = [
      { section: 'Term Name', columns: findMatchingColumns(headers, ['term', 'name', 'title']) },
      { section: 'Definition', columns: findMatchingColumns(headers, ['definition', 'description', 'meaning']) },
      { section: 'Categories', columns: findMatchingColumns(headers, ['category', 'domain', 'field', 'area']) },
      { section: 'Examples', columns: findMatchingColumns(headers, ['example', 'use case', 'application', 'instance']) },
      { section: 'Mathematical', columns: findMatchingColumns(headers, ['formula', 'equation', 'mathematical']) },
      { section: 'Implementation', columns: findMatchingColumns(headers, ['code', 'implementation', 'algorithm', 'pseudo']) },
      { section: 'Related Terms', columns: findMatchingColumns(headers, ['related', 'similar', 'see also']) },
      { section: 'Prerequisites', columns: findMatchingColumns(headers, ['prerequisite', 'required', 'background']) },
      { section: 'History', columns: findMatchingColumns(headers, ['history', 'origin', 'development']) },
      { section: 'Research', columns: findMatchingColumns(headers, ['research', 'paper', 'reference']) }
    ];
    
    recommendations.forEach(rec => {
      if (rec.columns.length > 0) {
        console.log(`${rec.section}: ${rec.columns.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('Error analyzing Excel file:', error);
  }
}

function findMatchingColumns(headers: string[], keywords: string[]): string[] {
  return headers
    .map((header, index) => ({ header, index: index + 1 }))
    .filter(({ header }) => 
      keywords.some(keyword => header.toLowerCase().includes(keyword))
    )
    .map(({ header, index }) => `Column ${index}: ${header}`);
}

// Run the analysis
analyzeExcelColumns().catch(console.error);