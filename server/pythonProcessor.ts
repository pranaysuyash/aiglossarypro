/**
 * Interface for Node.js to call the Python Excel processor
 */
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { db } from './db';
import { categories, subcategories, terms, termSubcategories } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Run the Python Excel processor script with the given parameters
 */
export async function runPythonExcelProcessor(
  bucketName: string,
  fileKey?: string,
  region: string = 'ap-south-1'
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Create output directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `excel_output_${Date.now()}.json`);
    
    // Check if we're dealing with a CSV file
    const isCSV = fileKey?.toLowerCase().endsWith('.csv');
    
    // Build the command
    let command = `python server/python/excel_processor.py --bucket "${bucketName}" --output "${outputPath}" --region "${region}"`;
    
    if (fileKey) {
      command += ` --file-key "${fileKey}"`;
    }
    
    if (isCSV) {
      command += ' --csv';
    }
    
    console.log(`Executing Python script: ${command}`);
    
    // Execute the Python script
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        return reject(error);
      }
      
      if (stderr) {
        console.warn(`Python script warnings: ${stderr}`);
      }
      
      // Parse the output
      try {
        const result = JSON.parse(stdout);
        
        if (!result.success) {
          return reject(new Error(result.error || 'Unknown error processing file'));
        }
        
        // Check if the output file exists
        if (!fs.existsSync(outputPath)) {
          return reject(new Error('Output file not created'));
        }
        
        // Read the output file
        const outputData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        
        // Clean up
        try {
          fs.unlinkSync(outputPath);
        } catch (e) {
          console.warn(`Error removing temp file: ${e}`);
        }
        
        resolve({
          ...result,
          data: outputData
        });
      } catch (parseError) {
        console.error(`Error parsing Python script output: ${parseError}`);
        console.log('Raw output:', stdout);
        reject(parseError);
      }
    });
  });
}

/**
 * Import processed Excel data into the database
 */
export async function importProcessedData(data: any): Promise<any> {
  try {
    console.log(`Importing ${data.categories.length} categories, ${data.subcategories.length} subcategories, and ${data.terms.length} terms`);
    
    // Track successfully imported items
    const imported = {
      categories: 0,
      subcategories: 0,
      terms: 0
    };
    
    // Import categories
    for (const category of data.categories) {
      try {
        const existing = await db.select()
          .from(categories)
          .where(eq(categories.name, category.name))
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(categories).values({
            id: category.id,
            name: category.name
          });
          imported.categories++;
        }
      } catch (e) {
        console.warn(`Error importing category ${category.name}: ${e}`);
      }
    }
    
    // Import subcategories
    for (const subcategory of data.subcategories) {
      try {
        const existing = await db.select()
          .from(subcategories)
          .where(eq(subcategories.name, subcategory.name))
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(subcategories).values({
            id: subcategory.id,
            name: subcategory.name,
            categoryId: subcategory.categoryId
          });
          imported.subcategories++;
        }
      } catch (e) {
        console.warn(`Error importing subcategory ${subcategory.name}: ${e}`);
      }
    }
    
    // Import terms
    for (const term of data.terms) {
      try {
        const existing = await db.select()
          .from(terms)
          .where(eq(terms.name, term.name))
          .limit(1);
        
        if (existing.length === 0) {
          // Extract basic term data
          const termData = {
            id: term.id,
            name: term.name,
            definition: term.definition,
            shortDefinition: term.shortDefinition,
            categoryId: term.categoryId,
            // Handle additional fields if needed
            characteristics: term.characteristics || null,
            visualUrl: term.visualUrl || null,
            visualCaption: term.visualCaption || null,
            mathFormulation: term.mathFormulation || null
          };
          
          // Insert the term
          await db.insert(terms).values(termData);
          
          // Handle subcategory relationships if any
          if (term.subcategoryIds && term.subcategoryIds.length > 0) {
            for (const subcategoryId of term.subcategoryIds) {
              await db.insert(termSubcategories).values({
                termId: term.id,
                subcategoryId: subcategoryId
              });
            }
          }
          
          imported.terms++;
        }
      } catch (e) {
        console.warn(`Error importing term ${term.name}: ${e}`);
      }
    }
    
    return {
      success: true,
      imported
    };
  } catch (error) {
    console.error(`Error importing processed data: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Process Excel file from S3 and import into database
 */
export async function processAndImportFromS3(
  bucketName: string = process.env.S3_BUCKET_NAME || '',
  fileKey?: string,
  region: string = 'ap-south-1'
): Promise<any> {
  try {
    console.log(`Processing Excel file from S3: ${bucketName}/${fileKey || 'latest'}`);
    
    // Run the Python processor
    const processingResult = await runPythonExcelProcessor(bucketName, fileKey, region);
    
    if (!processingResult.success) {
      return processingResult;
    }
    
    // Import the processed data
    const importResult = await importProcessedData(processingResult.data);
    
    return {
      success: true,
      processing: processingResult,
      import: importResult
    };
  } catch (error) {
    console.error(`Error processing and importing Excel file: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}