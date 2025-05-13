import fs from 'fs';
import path from 'path';
import { parseExcelFile, importToDatabase } from './excelParser';

/**
 * Auto loads Excel data from a specified file path
 * @param filePath Path to the Excel file (relative to project root)
 */
export async function autoLoadExcelData(filePath: string): Promise<void> {
  try {
    console.log(`Attempting to load Excel data from: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Excel file not found at: ${filePath}`);
      return;
    }
    
    // Read the file
    const buffer = fs.readFileSync(filePath);
    console.log(`Successfully read file, size: ${buffer.length} bytes`);
    
    // Parse and import data
    const parsedData = await parseExcelFile(buffer);
    console.log(`Parsed data from Excel: ${parsedData.terms.length} terms, ${parsedData.categories.size} categories`);
    
    const result = await importToDatabase(parsedData);
    console.log(`Successfully imported ${result.termsImported} terms and ${result.categoriesImported} categories`);
  } catch (error) {
    console.error('Error auto-loading Excel data:', error);
  }
}

/**
 * Checks for Excel files in the data directory and loads them if found
 */
export async function checkAndLoadExcelData(): Promise<void> {
  // First try the fixed file path (for development/testing)
  const specificFilePath = path.join(process.cwd(), 'data', 'glossary.xlsx');
  if (fs.existsSync(specificFilePath)) {
    console.log('Found glossary.xlsx file in data directory');
    await autoLoadExcelData(specificFilePath);
    return;
  }
  
  const dataDir = path.join(process.cwd(), 'data');
  
  // Check if data directory exists
  if (!fs.existsSync(dataDir)) {
    console.log(`Data directory not found at: ${dataDir}`);
    return;
  }
  
  // Look for .xlsx files
  const files = fs.readdirSync(dataDir);
  const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));
  
  if (excelFiles.length === 0) {
    console.log('No Excel files found in data directory');
    return;
  }
  
  // Use the first Excel file found
  const excelFilePath = path.join(dataDir, excelFiles[0]);
  await autoLoadExcelData(excelFilePath);
}