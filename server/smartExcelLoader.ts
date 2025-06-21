import fs from 'fs';
import path from 'path';
import { runPythonExcelProcessor, importProcessedData } from './pythonProcessor';

/**
 * Smart Excel loader that chooses the appropriate processing method based on file size
 * - Uses Python processor for large files (>50MB)
 * - Uses JavaScript parser for smaller files
 */

const MAX_JS_FILE_SIZE = 50 * 1024 * 1024; // 50MB threshold

export async function smartLoadExcelData(filePath: string): Promise<void> {
  try {
    console.log(`🔍 Analyzing Excel file: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Excel file not found at: ${filePath}`);
      return;
    }
    
    // Get file size
    const stats = fs.statSync(filePath);
    const fileSizeBytes = stats.size;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    
    console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeBytes > MAX_JS_FILE_SIZE) {
      console.log(`🐍 Using Python processor for large file (${fileSizeMB.toFixed(2)} MB)`);
      await procesWithPython(filePath);
    } else {
      console.log(`📄 Using JavaScript parser for small file (${fileSizeMB.toFixed(2)} MB)`);
      // Import the existing JavaScript parser
      const { parseExcelFile, importToDatabase } = await import('./excelParser');
      const buffer = fs.readFileSync(filePath);
      const parsedData = await parseExcelFile(buffer);
      await importToDatabase(parsedData);
    }
  } catch (error) {
    console.error('❌ Error in smart Excel loading:', error);
  }
}

async function procesWithPython(filePath: string): Promise<void> {
  try {
    // Use the Python processor to handle large files
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `processed_${Date.now()}.json`);
    
    // Run Python processor directly on local file
    const { exec } = await import('child_process');
    const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
    const scriptPath = 'server/python/excel_processor.py';
    
    // Process without chunk limit to get full dataset
    const command = `${venvPath} ${scriptPath} --input "${filePath}" --output "${outputPath}"`;
    
    console.log(`🔄 Running Python processor: ${command}`);
    
    return new Promise((resolve, reject) => {
      exec(command, { maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Python processor error: ${error.message}`);
          console.error(`stderr: ${stderr}`);
          return reject(error);
        }
        
        if (stderr) {
          console.warn(`⚠️  Python processor warnings: ${stderr}`);
        }
        
        try {
          const result = JSON.parse(stdout);
          
          if (!result.success) {
            return reject(new Error(result.error || 'Unknown error processing file'));
          }
          
          console.log(`✅ Python processing complete: ${result.terms} terms, ${result.categories} categories, ${result.subcategories} subcategories`);
          
          // Read and import the processed data
          if (fs.existsSync(outputPath)) {
            const processedData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            const importResult = await importProcessedData(processedData);
            
            if (importResult.success) {
              console.log(`✅ Database import complete: ${importResult.imported.categories} categories, ${importResult.imported.subcategories} subcategories, ${importResult.imported.terms} terms`);
            } else {
              console.error(`❌ Database import failed: ${importResult.error}`);
            }
            
            // Clean up temp file
            try {
              fs.unlinkSync(outputPath);
            } catch (e) {
              console.warn(`⚠️  Could not remove temp file: ${e}`);
            }
          }
          
          resolve();
        } catch (parseError) {
          console.error(`❌ Error parsing Python output: ${parseError}`);
          console.log('Raw output:', stdout);
          reject(parseError);
        }
      });
    });
  } catch (error) {
    console.error(`❌ Error in Python processing: ${error}`);
    throw error;
  }
}

/**
 * Check for Excel files and process them intelligently
 */
export async function checkAndSmartLoadExcelData(): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Check if data directory exists
  if (!fs.existsSync(dataDir)) {
    console.log(`📁 Data directory not found at: ${dataDir}`);
    return;
  }
  
  // Look for .xlsx files
  const files = fs.readdirSync(dataDir);
  const excelFiles = files.filter(file => 
    (file.endsWith('.xlsx') || file.endsWith('.xls')) && 
    !file.startsWith('~$') // Exclude temp files
  );
  
  if (excelFiles.length === 0) {
    console.log('📄 No Excel files found in data directory');
    return;
  }
  
  console.log(`📊 Found ${excelFiles.length} Excel file(s): ${excelFiles.join(', ')}`);
  
  // Process the main file (aiml.xlsx) if it exists, otherwise use the first file
  const mainFile = excelFiles.find(f => f.includes('aiml')) || excelFiles[0];
  const excelFilePath = path.join(dataDir, mainFile);
  
  console.log(`🎯 Processing main Excel file: ${mainFile}`);
  await smartLoadExcelData(excelFilePath);
}