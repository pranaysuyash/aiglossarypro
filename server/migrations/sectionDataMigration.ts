import { db } from '../db';
import { sql, eq, and } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { enhancedTerms } from '../../shared/enhancedSchema';

// Load standardized sections from external configuration
function loadStandardSections() {
  try {
    const configPath = join(__dirname, '../config/standardSections.json');
    const configData = readFileSync(configPath, 'utf-8');
    return JSON.parse(configData) as Array<{ name: string; order: number }>;
  } catch (error) {
    console.error('Failed to load standard sections configuration:', error);
    throw new Error('Standard sections configuration file not found or invalid');
  }
}

export const STANDARD_SECTIONS = loadStandardSections();

export async function migrateSectionData() {
  console.log('Starting section data migration...');

  return await db.transaction(async (tx) => {
    try {
      // Get all existing terms
      const terms = await tx.execute(sql`SELECT id, name FROM enhanced_terms`);
      console.log(`Found ${terms.rows.length} terms to migrate`);

      if (terms.rows.length === 0) {
        console.log('No terms found for migration');
        return { success: true, sectionsCreated: 0 };
      }

      // Prepare bulk insert data for sections
      const sectionsToInsert = [];
      for (const term of terms.rows) {
        for (const section of STANDARD_SECTIONS) {
          sectionsToInsert.push({
            termId: term.id,
            name: section.name,
            displayOrder: section.order,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      // Perform bulk insert for sections
      console.log(`Inserting ${sectionsToInsert.length} sections...`);
      
      // Split into chunks to avoid parameter limits
      const chunkSize = 1000;
      let totalSectionsCreated = 0;
      
      for (let i = 0; i < sectionsToInsert.length; i += chunkSize) {
        const chunk = sectionsToInsert.slice(i, i + chunkSize);
        
        // Build VALUES clause for bulk insert
        const values = chunk.map((_, index) => {
          const baseIndex = i + index;
          return `($${baseIndex * 5 + 1}, $${baseIndex * 5 + 2}, $${baseIndex * 5 + 3}, $${baseIndex * 5 + 4}, $${baseIndex * 5 + 5})`;
        }).join(', ');
        
        const params = chunk.flatMap(section => [
          section.termId,
          section.name,
          section.displayOrder,
          section.createdAt,
          section.updatedAt
        ]);
        
        const insertQuery = sql.raw(`
          INSERT INTO sections (term_id, name, display_order, created_at, updated_at)
          VALUES ${values}
          ON CONFLICT (term_id, name) DO NOTHING
        `, params);
        
        await tx.execute(insertQuery);
        totalSectionsCreated += chunk.length;
        console.log(`Processed ${Math.min(i + chunkSize, sectionsToInsert.length)}/${sectionsToInsert.length} sections`);
      }

      // Create basic section items for each term
      console.log('Creating basic section items...');
      for (const term of terms.rows) {
        await createBasicSectionItems(tx, term.id as number);
      }

      console.log(`Migration completed! Created ${totalSectionsCreated} sections total.`);
      return { success: true, sectionsCreated: totalSectionsCreated };
      
    } catch (error) {
      console.error('Section data migration failed:', error);
      throw error;
    }
  });
}

async function createBasicSectionItems(tx: any, termId: number) {
  try {
    // Get the term's full data
    const termData = await tx.execute(sql`
      SELECT * FROM enhanced_terms WHERE id = ${termId}
    `);
    
    if (termData.rows.length === 0) return;
    
    const fullTerm = termData.rows[0];

    // Get section IDs for this term
    const sectionsResult = await tx.execute(sql`
      SELECT id, name FROM sections WHERE term_id = ${termId}
    `);

    const sectionMap = new Map();
    for (const section of sectionsResult.rows) {
      sectionMap.set(section.name, section.id);
    }

    // Create basic section items from existing term data
    const sectionItems = [
      {
        sectionName: 'Introduction',
        items: [
          {
            label: 'Definition and Overview',
            content: fullTerm.definition || fullTerm.short_definition || '',
            contentType: 'markdown',
            order: 1
          },
          {
            label: 'Key Concepts',
            content: fullTerm.key_concepts || '',
            contentType: 'markdown',
            order: 2
          }
        ]
      },
      {
        sectionName: 'Applications',
        items: [
          {
            label: 'Real-world Use Cases',
            content: fullTerm.applications || '',
            contentType: 'markdown',
            order: 1
          }
        ]
      },
      {
        sectionName: 'Implementation',
        items: [
          {
            label: 'Code Examples',
            content: fullTerm.code_examples || '',
            contentType: 'code',
            order: 1
          }
        ]
      },
      {
        sectionName: 'Related Concepts',
        items: [
          {
            label: 'Connected Terms',
            content: fullTerm.related_terms ? JSON.stringify(fullTerm.related_terms) : '',
            contentType: 'json',
            order: 1
          }
        ]
      }
    ];

    // Collect all section items for bulk insert
    const itemsToInsert = [];
    for (const sectionData of sectionItems) {
      const sectionId = sectionMap.get(sectionData.sectionName);
      if (!sectionId) continue;

      for (const item of sectionData.items) {
        if (!item.content) continue; // Skip empty content
        
        itemsToInsert.push({
          sectionId,
          label: item.label,
          content: item.content,
          contentType: item.contentType,
          displayOrder: item.order,
          isAiGenerated: fullTerm.is_ai_generated || false,
          verificationStatus: fullTerm.verification_status || 'unverified',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Bulk insert section items if any exist
    if (itemsToInsert.length > 0) {
      const values = itemsToInsert.map((_, index) => {
        return `($${index * 9 + 1}, $${index * 9 + 2}, $${index * 9 + 3}, $${index * 9 + 4}, $${index * 9 + 5}, $${index * 9 + 6}, $${index * 9 + 7}, $${index * 9 + 8}, $${index * 9 + 9})`;
      }).join(', ');
      
      const params = itemsToInsert.flatMap(item => [
        item.sectionId,
        item.label,
        item.content,
        item.contentType,
        item.displayOrder,
        item.isAiGenerated,
        item.verificationStatus,
        item.createdAt,
        item.updatedAt
      ]);
      
      const insertQuery = sql.raw(`
        INSERT INTO section_items (
          section_id, label, content, content_type, display_order,
          is_ai_generated, verification_status, created_at, updated_at
        )
        VALUES ${values}
        ON CONFLICT DO NOTHING
      `, params);
      
      await tx.execute(insertQuery);
    }

  } catch (error) {
    console.error(`Error creating section items for term ${termId}:`, error);
  }
}

// ES module version - no need for require.main check 