import * as fs from 'fs';
import * as path from 'path';
import { db } from './db';
import { categories, terms, subcategories, termSubcategories } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { getS3Config, features } from './config';

/**
 * Simple and direct import function for Excel data
 */
export async function importFromS3() {
  console.log('Starting S3 import...');
  
  if (!features.s3Enabled) {
    console.error('S3 functionality is not enabled');
    return {
      success: false,
      message: 'S3 functionality is not enabled'
    };
  }

  // Initialize S3 client
  const s3Config = getS3Config();
  const s3 = new S3Client({
    region: s3Config.region,
    credentials: s3Config.credentials
  });
  
  const bucketName = s3Config.bucketName;
  
  try {
    // List Excel files in bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName
    });
    
    const listResponse = await s3.send(listCommand);
    const files = listResponse.Contents?.filter(item => 
      item.Key?.endsWith('.xlsx') || item.Key?.endsWith('.xls')
    );
    
    if (!files || files.length === 0) {
      console.log('No Excel files found in bucket');
      return {
        success: false,
        message: 'No Excel files found in bucket'
      };
    }
    
    console.log(`Found ${files.length} Excel files in bucket`);
    
    // Download the first file
    const firstFile = files[0];
    if (!firstFile.Key) {
      console.error('No valid key for file');
      return {
        success: false,
        message: 'No valid key for file'
      };
    }
    
    console.log(`Processing file: ${firstFile.Key}`);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `s3_${Date.now()}_${path.basename(firstFile.Key)}`);
    
    // Download file
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: firstFile.Key
    });
    
    const response = await s3.send(getCommand);
    
    if (!response.Body) {
      console.error('No data received from S3');
      return {
        success: false,
        message: 'No data received from S3'
      };
    }
    
    // Create write stream for file
    const writeStream = fs.createWriteStream(tempFilePath);
    
    // Process the stream
    // @ts-ignore - Body should be a readable stream
    await new Promise((resolve, reject) => {
      // @ts-ignore
      response.Body.pipe(writeStream)
        .on('error', (err: Error) => {
          console.error('Error writing file:', err);
          reject(err);
        })
        .on('close', () => {
          console.log(`File downloaded to ${tempFilePath}`);
          resolve(true);
        });
    });
    
    console.log('Processing Excel file...');
    
    // Let's try a different approach - directly analyze the Excel file
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.default.Workbook();
    
    try {
      await workbook.xlsx.readFile(tempFilePath);
      
      // Define our main categories
      const mainCategories = [
        'Machine Learning',
        'Deep Learning',
        'Natural Language Processing',
        'Computer Vision',
        'Reinforcement Learning',
        'Statistics & Probability'
      ];
      
      // For storing categories and subcategories
      const categorySet = new Set<string>();
      const subcatMap = new Map<string, Set<string>>();
      
      // Process each worksheet
      for (const worksheet of workbook.worksheets) {
        console.log(`Processing worksheet: ${worksheet.name}`);
        
        // For storing terms
        const terms = [];
        
        // Track the current category context
        let currentCategory = '';
        
        // Process each row
        worksheet.eachRow((row, rowNumber) => {
          const cellValues = row.values;
          if (!cellValues || typeof cellValues === 'string') return;
          
          // Convert values to string array
          const rowData = Array.from(cellValues).map(val => 
            val !== null && val !== undefined ? String(val).trim() : ''
          ).filter(Boolean);
          
          if (rowData.length === 0) return;
          
          // Check if this is a category header
          const headerMatch = rowData[0].match(/^(#+)\s+(.+)$/);
          if (headerMatch) {
            const level = headerMatch[1].length;
            const headerText = headerMatch[2].trim();
            
            // If level 1, this is a main category
            if (level === 1) {
              // Find the closest main category this might belong to
              const matchedCategory = mainCategories.find(cat => 
                headerText.includes(cat) || cat.includes(headerText)
              );
              
              currentCategory = matchedCategory || headerText;
              categorySet.add(currentCategory);
              console.log(`Found category: ${currentCategory}`);
            } 
            // Otherwise, it's a subcategory
            else if (currentCategory) {
              if (!subcatMap.has(currentCategory)) {
                subcatMap.set(currentCategory, new Set<string>());
              }
              subcatMap.get(currentCategory)?.add(headerText);
              console.log(`Found subcategory: ${headerText} under ${currentCategory}`);
            }
            
            return;
          }
          
          // Check if this is a term with definition
          if (rowData.length >= 2) {
            const termName = rowData[0];
            const definition = rowData[1];
            
            if (termName && definition && !termName.startsWith('#')) {
              terms.push({
                name: termName,
                definition: definition,
                category: currentCategory
              });
              console.log(`Found term: ${termName}`);
            }
          }
        });
        
        console.log(`Extracted ${terms.length} terms from worksheet ${worksheet.name}`);
        
        // Save the terms to database
        for (const term of terms) {
          if (!term.category) continue;
          
          // Get the category ID
          const [category] = await db.select().from(categories)
            .where(eq(categories.name, term.category))
            .limit(1);
          
          if (!category) {
            // Create the category if it doesn't exist
            const [newCategory] = await db.insert(categories)
              .values({ name: term.category })
              .returning();
              
            // Create the term with the new category
            if (newCategory) {
              await db.insert(terms).values({
                name: term.name,
                definition: term.definition,
                shortDefinition: term.definition.slice(0, 150) + (term.definition.length > 150 ? '...' : ''),
                categoryId: newCategory.id
              });
            }
          } else {
            // Create the term with existing category
            await db.insert(terms).values({
              name: term.name,
              definition: term.definition,
              shortDefinition: term.definition.slice(0, 150) + (term.definition.length > 150 ? '...' : ''),
              categoryId: category.id
            });
          }
        }
      }
      
      // Store categories if they don't already exist
      console.log(`Found ${categorySet.size} categories`);
      for (const catName of categorySet) {
        const existingCat = await db.select().from(categories).where(eq(categories.name, catName)).limit(1);
        
        if (existingCat.length === 0) {
          await db.insert(categories).values({ name: catName });
          console.log(`Added category: ${catName}`);
        }
      }
      
      // Store subcategories
      let subcatCount = 0;
      for (const [catName, subcatSet] of subcatMap.entries()) {
        const [category] = await db.select().from(categories).where(eq(categories.name, catName)).limit(1);
        
        if (!category) continue;
        
        for (const subcatName of Array.from(subcatSet)) {
          const existingSubcat = await db.select().from(subcategories)
            .where(eq(subcategories.name, subcatName))
            .limit(1);
          
          if (existingSubcat.length === 0) {
            await db.insert(subcategories).values({
              name: subcatName,
              categoryId: category.id
            });
            subcatCount++;
          }
        }
      }
      console.log(`Added ${subcatCount} subcategories`);
      
    } catch (excelError) {
      console.error('Error processing Excel file:', excelError);
      return {
        success: false,
        error: excelError instanceof Error ? excelError.message : String(excelError)
      };
    } finally {
      // Clean up
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Removed temporary files');
      } catch (err) {
        console.error('Error cleaning up temp files:', err);
      }
    }
    
    return {
      success: true,
      message: 'Import completed'
    };
  } catch (error) {
    console.error('Error during import:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}