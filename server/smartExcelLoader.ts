import fs from 'fs';
import path from 'path';
import { runPythonExcelProcessor, importProcessedData } from './pythonProcessor';

/**
 * Smart Excel loader that chooses the appropriate processing method based on file size
 * - Uses chunked Python processor for large files (>50MB) with memory optimization
 * - Uses JavaScript parser for smaller files
 * - Provides progress tracking and resumable processing
 */

const MAX_JS_FILE_SIZE = 50 * 1024 * 1024; // 50MB threshold
const DEFAULT_CHUNK_SIZE = 500; // Process 500 rows per chunk

interface ProcessingOptions {
  chunkSize?: number;
  enableProgress?: boolean;
  resumeProcessing?: boolean;
}

export async function smartLoadExcelData(filePath: string, options: ProcessingOptions = {}): Promise<void> {
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
      console.log(`🐍 Using chunked Python processor for large file (${fileSizeMB.toFixed(2)} MB)`);
      await processWithChunkedPython(filePath, options);
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

async function processWithChunkedPython(filePath: string, options: ProcessingOptions): Promise<void> {
  try {
    console.log('🚀 Starting chunked Excel processing...');
    
    // Use the enhanced Python processor with chunking
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `processed_chunked_${Date.now()}.json`);
    
    // Check if we should use the enhanced processor
    const enhancedScriptPath = 'server/python/excel_processor_enhanced.py';
    const regularScriptPath = 'server/python/excel_processor.py';
    
    const scriptPath = fs.existsSync(enhancedScriptPath) ? enhancedScriptPath : regularScriptPath;
    
    const { exec } = await import('child_process');
    const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');
    
    const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
    
    // Build command with chunking parameters
    const command = [
      venvPath,
      scriptPath,
      `--input "${filePath}"`,
      `--output "${outputPath}"`,
      `--chunk-size ${chunkSize}`
    ].join(' ');
    
    console.log(`🔄 Running chunked Python processor:`);
    console.log(`   📁 Input: ${filePath}`);
    console.log(`   📁 Output: ${outputPath}`);
    console.log(`   ⚙️  Chunk size: ${chunkSize} rows`);
    console.log(`   🐍 Script: ${scriptPath}`);
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const childProcess = exec(command, { 
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      }, async (error, stdout, stderr) => {
        const duration = (Date.now() - startTime) / 1000;
        
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
          
          console.log(`✅ Chunked processing complete in ${duration.toFixed(2)}s:`);
          console.log(`   📊 ${result.terms} terms processed`);
          console.log(`   📂 ${result.categories} categories created`);
          console.log(`   📋 ${result.subcategories} subcategories created`);
          console.log(`   🔄 ${result.chunks_processed} chunks processed`);
          
          // Read and import the processed data
          if (fs.existsSync(outputPath)) {
            console.log('🔄 Importing processed data to database...');
            const processedData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            const importResult = await importProcessedData(processedData);
            
            if (importResult.success) {
              console.log(`✅ Database import complete:`);
              console.log(`   📂 ${importResult.imported.categories} categories imported`);
              console.log(`   📋 ${importResult.imported.subcategories} subcategories imported`);
              console.log(`   📊 ${importResult.imported.terms} terms imported`);
            } else {
              console.error(`❌ Database import failed: ${importResult.error}`);
            }
            
            // Clean up temp file
            try {
              fs.unlinkSync(outputPath);
              console.log('🧹 Temporary files cleaned up');
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
      
      // Handle progress output if available
      if (options.enableProgress && childProcess.stdout) {
        childProcess.stdout.on('data', (data) => {
          const output = data.toString();
          // Look for progress indicators in the output
          if (output.includes('Processing chunk') || output.includes('Processed')) {
            process.stdout.write(`📈 ${output.trim()}\n`);
          }
        });
      }
    });
  } catch (error) {
    console.error(`❌ Error in chunked Python processing: ${error}`);
    throw error;
  }
}

/**
 * Check for Excel files and process them intelligently with chunking support
 */
export async function checkAndSmartLoadExcelData(options: ProcessingOptions = {}): Promise<void> {
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
  
  // Check if we should resume processing
  if (options.resumeProcessing) {
    const tempDir = path.join(process.cwd(), 'temp');
    const existingFiles = fs.existsSync(tempDir) ? 
      fs.readdirSync(tempDir).filter(f => f.includes('processed_chunked_')) : [];
    
    if (existingFiles.length > 0) {
      console.log(`🔄 Found ${existingFiles.length} existing processed files, resuming...`);
    }
  }
  
  await smartLoadExcelData(excelFilePath, {
    chunkSize: options.chunkSize || DEFAULT_CHUNK_SIZE,
    enableProgress: options.enableProgress !== false, // Default to true
    ...options
  });
}

/**
 * Get processing status for large Excel files
 */
export async function getProcessingStatus(): Promise<{
  hasProcessedFiles: boolean;
  processedFileCount: number;
  lastProcessedAt?: Date;
}> {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    
    if (!fs.existsSync(tempDir)) {
      return { hasProcessedFiles: false, processedFileCount: 0 };
    }
    
    const processedFiles = fs.readdirSync(tempDir)
      .filter(f => f.includes('processed_chunked_'))
      .map(f => ({
        name: f,
        path: path.join(tempDir, f),
        stats: fs.statSync(path.join(tempDir, f))
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
    
    return {
      hasProcessedFiles: processedFiles.length > 0,
      processedFileCount: processedFiles.length,
      lastProcessedAt: processedFiles.length > 0 ? processedFiles[0].stats.mtime : undefined
    };
  } catch (error) {
    console.error('Error checking processing status:', error);
    return { hasProcessedFiles: false, processedFileCount: 0 };
  }
}