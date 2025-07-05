const xlsx = require('xlsx');
const fs = require('fs');

console.log('🔄 Analyzing aiml.xlsx...');

try {
  const workbook = xlsx.readFile('./data/aiml.xlsx');
  console.log('📊 Workbook info:');
  console.log('Sheets:', workbook.SheetNames);
  
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    console.log(`\nSheet: ${sheetName}`);
    console.log('Worksheet exists:', !!worksheet);
    
    if (!worksheet) {
      console.log('Worksheet is null/undefined');
      continue;
    }
    
    console.log('Range:', worksheet['!ref']);
    
    // Try to get first few cells
    const cellA1 = worksheet['A1'];
    const cellB1 = worksheet['B1'];
    const cellC1 = worksheet['C1'];
    console.log('A1:', cellA1 ? cellA1.v : 'empty');
    console.log('B1:', cellB1 ? cellB1.v : 'empty');
    console.log('C1:', cellC1 ? cellC1.v : 'empty');
    
    // Count non-empty cells
    let cellCount = 0;
    for (const cell in worksheet) {
      if (cell[0] !== '!' && worksheet[cell].v) cellCount++;
    }
    console.log('Non-empty cells:', cellCount);
    
    // Try converting to JSON to see structure
    try {
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 5 });
      console.log('First 5 rows as JSON:');
      console.log(jsonData);
    } catch (jsonError) {
      console.log('JSON conversion failed:', jsonError.message);
    }
  }
  
  console.log('\n🔄 Attempting CSV conversion...');
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const csv = xlsx.utils.sheet_to_csv(worksheet);
  
  fs.writeFileSync('./data/aiml.csv', csv);
  
  const lines = csv.split('\n').filter(line => line.trim().length > 0);
  console.log(`✅ CSV created with ${lines.length} non-empty lines`);
  
  // Show first few lines
  console.log('\nFirst 3 lines of CSV:');
  lines.slice(0, 3).forEach((line, i) => {
    console.log(`${i + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}