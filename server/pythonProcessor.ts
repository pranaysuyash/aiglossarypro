/**
 * Interface for Node.js to call the Python Excel processor
 */

import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { categories, subcategories, termSubcategories, terms } from '@shared/enhancedSchema';
import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { downloadFileFromS3 } from './s3Service';

/**
 * Run the Python Excel processor script with the given parameters
 */
export async function runPythonExcelProcessor(
  bucketName: string,
  fileKey?: string,
  _region: string = 'ap-south-1',
  maxChunks?: number
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create output and temp directories if they don't exist
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const outputPath = path.join(tempDir, `excel_output_${Date.now()}.json`);

      // If we have a fileKey, download the file from S3 first
      let localFilePath = '';
      if (fileKey) {
        console.log(`Downloading file from S3: ${bucketName}/${fileKey}`);
        const fileName =
          fileKey.split('/').pop() || `s3_${Date.now()}_${fileKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localFilePath = path.join(tempDir, fileName);

        await downloadFileFromS3(bucketName, fileKey, localFilePath);
        console.log(`File downloaded to ${localFilePath}`);
      } else {
        return reject(new Error('No file key provided'));
      }

      // Check if we're dealing with a CSV file
      const isCSV = fileKey.toLowerCase().endsWith('.csv');

      // Build the Python command based on file type
      let scriptPath = '';
      if (isCSV) {
        scriptPath = 'server/python/csv_processor.py';
      } else {
        scriptPath = 'server/python/excel_processor.py';
      }

      // Build the command using virtual environment with proper argument escaping
      const venvPath = path.join(process.cwd(), 'venv', 'bin', 'python');

      // Validate and sanitize inputs to prevent command injection
      if (!localFilePath || !outputPath || !scriptPath) {
        return reject(new Error('Invalid file paths provided'));
      }

      // Use execFile instead of exec to prevent command injection

      // Build arguments array (safer than string interpolation)
      const args = [scriptPath, '--input', localFilePath, '--output', outputPath];

      // Add max chunks if specified for testing or limiting processing
      if (maxChunks && typeof maxChunks === 'number' && maxChunks > 0) {
        args.push('--max-chunks', maxChunks.toString());
      }

      console.log(`Executing Python script: ${venvPath} ${args.join(' ')}`);

      // Execute the Python script with execFile (safer than exec)
      execFile(venvPath, args, (error, stdout, stderr) => {
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
            // Optionally clean up the downloaded file as well
            if (fs.existsSync(localFilePath)) {
              fs.unlinkSync(localFilePath);
            }
          } catch (e) {
            console.warn(`Error removing temp files: ${e}`);
          }

          resolve({
            ...result,
            data: outputData,
          });
        } catch (parseError) {
          console.error(`Error parsing Python script output: ${parseError}`);
          console.log('Raw output:', stdout);
          reject(parseError);
        }
      });
    } catch (e) {
      console.error(`Error in Python processor setup: ${e}`);
      reject(e);
    }
  });
}

/**
 * Import processed Excel data into the database
 */
export async function importProcessedData(data: any): Promise<any> {
  try {
    console.log(
      `Importing ${data.categories.length} categories, ${data.subcategories.length} subcategories, and ${data.terms.length} terms`
    );

    // Track successfully imported items
    const imported = {
      categories: 0,
      subcategories: 0,
      terms: 0,
    };

    // Create a map to track imported category IDs
    const categoryIdMap = new Map<string, string>();

    // Import categories first
    for (const category of data.categories) {
      try {
        const existing = await db
          .select()
          .from(categories)
          .where(eq(categories.name, category.name))
          .limit(1);

        if (existing.length === 0) {
          const [inserted] = await db
            .insert(categories)
            .values({
              id: category.id,
              name: category.name,
            })
            .returning({ id: categories.id });

          categoryIdMap.set(category.id, inserted.id);
          imported.categories++;
        } else {
          // Map existing category ID
          categoryIdMap.set(category.id, existing[0].id);
        }
      } catch (e) {
        console.warn(`Error importing category ${category.name}: ${e}`);
      }
    }

    // Import subcategories with proper category ID references
    for (const subcategory of data.subcategories) {
      try {
        // Check if the category exists
        const mappedCategoryId = categoryIdMap.get(subcategory.categoryId);
        if (!mappedCategoryId) {
          console.warn(
            `Skipping subcategory ${subcategory.name}: category ID ${subcategory.categoryId} not found`
          );
          continue;
        }

        const existing = await db
          .select()
          .from(subcategories)
          .where(
            and(
              eq(subcategories.name, subcategory.name),
              eq(subcategories.categoryId, mappedCategoryId)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(subcategories).values({
            id: subcategory.id,
            name: subcategory.name,
            categoryId: mappedCategoryId,
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
        const existing = await db.select().from(terms).where(eq(terms.name, term.name)).limit(1);

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
            mathFormulation: term.mathFormulation || null,
          };

          // Insert the term
          await db.insert(terms).values(termData);

          // Handle subcategory relationships if any
          if (term.subcategoryIds && term.subcategoryIds.length > 0) {
            for (const subcategoryId of term.subcategoryIds) {
              await db.insert(termSubcategories).values({
                termId: term.id,
                subcategoryId: subcategoryId,
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
      imported,
    };
  } catch (error) {
    console.error(`Error importing processed data: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process Excel file from S3 and import into database
 */
export async function processAndImportFromS3(
  bucketName: string = process.env.S3_BUCKET_NAME || '',
  fileKey?: string,
  region: string = 'ap-south-1',
  maxChunks?: number
): Promise<any> {
  try {
    console.log(`Processing Excel file from S3: ${bucketName}/${fileKey || 'latest'}`);

    // Run the Python processor
    const processingResult = await runPythonExcelProcessor(bucketName, fileKey, region, maxChunks);

    if (!processingResult.success) {
      return processingResult;
    }

    // Import the processed data
    const importResult = await importProcessedData(processingResult.data);

    return {
      success: true,
      processing: processingResult,
      import: importResult,
    };
  } catch (error) {
    console.error(`Error processing and importing Excel file: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
