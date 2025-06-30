#!/usr/bin/env node

/**
 * Analyze row1.xlsx structure to understand the actual content
 */

const ExcelJS = require('exceljs');
const fs = require('fs');

async function analyzeRow1Excel() {
  console.log('🔍 Analyzing row1.xlsx Structure');
  console.log('================================');
  
  const filePath = __dirname + '/data/row1.xlsx';
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found:', filePath);
    return;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      console.log('❌ No worksheet found');
      return;
    }
    
    console.log(`📊 Total rows: ${worksheet.rowCount}`);
    console.log(`📊 Total columns: ${worksheet.columnCount}`);
    
    // Analyze headers
    console.log('\n📋 Headers Analysis:');
    console.log('===================');
    const firstRow = worksheet.getRow(1);
    const headers = [];
    
    firstRow.eachCell((cell, colNumber) => {
      const headerName = cell.value?.toString().trim() || '';
      if (headerName) {
        headers.push({ column: colNumber, name: headerName });
      }
    });
    
    console.log(`✅ Found ${headers.length} headers`);
    console.log('📋 Sample headers:');
    headers.slice(0, 10).forEach(h => {
      console.log(`   Col ${h.column}: ${h.name}`);
    });
    
    // Analyze data rows
    console.log('\n📊 Data Rows Analysis:');
    console.log('======================');
    
    const termColumn = headers.find(h => h.name.toLowerCase().includes('term'))?.column || 1;
    console.log(`🔍 Using column ${termColumn} as term column`);
    
    const terms = [];
    const duplicates = [];
    const termCounts = {};
    
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      if (row.hasValues) {
        const termValue = row.getCell(termColumn).value?.toString().trim();
        
        if (termValue) {
          terms.push({
            row: rowNumber,
            term: termValue
          });
          
          // Track duplicates
          if (termCounts[termValue]) {
            termCounts[termValue]++;
            duplicates.push({
              term: termValue,
              row: rowNumber,
              count: termCounts[termValue]
            });
          } else {
            termCounts[termValue] = 1;
          }
        }
      }
    }
    
    console.log(`📊 Total data rows with values: ${terms.length}`);
    console.log(`📊 Unique terms: ${Object.keys(termCounts).length}`);
    console.log(`📊 Duplicate entries: ${duplicates.length}`);
    
    // Show unique terms
    console.log('\n📝 Unique Terms Found:');
    console.log('======================');
    Object.keys(termCounts).forEach((term, index) => {
      const count = termCounts[term];
      console.log(`${index + 1}. "${term}" (appears ${count} times)`);
    });
    
    // Show duplicates if any
    if (duplicates.length > 0) {
      console.log('\n⚠️  Duplicate Entries:');
      console.log('=====================');
      duplicates.forEach(dup => {
        console.log(`Row ${dup.row}: "${dup.term}" (occurrence #${dup.count})`);
      });
    }
    
    // Analyze data completeness
    console.log('\n📊 Data Completeness Analysis:');
    console.log('==============================');
    
    for (const uniqueTerm of Object.keys(termCounts)) {
      console.log(`\n🔍 Term: "${uniqueTerm}"`);
      
      // Find the first row with this term
      const termRow = terms.find(t => t.term === uniqueTerm);
      if (termRow) {
        const row = worksheet.getRow(termRow.row);
        
        let filledCells = 0;
        let emptyCells = 0;
        
        // Check a sample of important columns
        const sampleColumns = headers.slice(0, 10); // First 10 columns
        
        sampleColumns.forEach(header => {
          const cellValue = row.getCell(header.column).value?.toString().trim();
          if (cellValue) {
            filledCells++;
          } else {
            emptyCells++;
          }
        });
        
        console.log(`   📊 Filled cells: ${filledCells}/${sampleColumns.length} (${((filledCells/sampleColumns.length)*100).toFixed(1)}%)`);
        console.log(`   📊 Empty cells: ${emptyCells}/${sampleColumns.length}`);
        
        if (emptyCells > 0) {
          console.log(`   💡 This term has empty cells that could trigger AI generation`);
        }
      }
    }
    
    // Summary
    console.log('\n📋 Summary:');
    console.log('============');
    console.log(`📊 Expected terms: ${Object.keys(termCounts).length}`);
    console.log(`📊 Actual processing count: 29 (from previous test)`);
    console.log(`❓ Discrepancy: ${29 - Object.keys(termCounts).length} extra rows`);
    
    if (29 > Object.keys(termCounts).length) {
      console.log('\n🔍 Possible explanations for extra rows:');
      console.log('- Duplicate term entries (same term in multiple rows)');
      console.log('- Empty rows being counted');
      console.log('- Data parsing treating duplicates as separate terms');
    }
    
  } catch (error) {
    console.error('❌ Error analyzing file:', error);
  }
}

analyzeRow1Excel().catch(console.error);