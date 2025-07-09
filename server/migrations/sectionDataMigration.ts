import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { enhancedTerms, sections } from '../../shared/enhancedSchema';
import { db } from '../db';

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
      // Get all existing terms using Drizzle query builder
      const termsResult = await tx
        .select({
          id: enhancedTerms.id,
          name: enhancedTerms.name,
        })
        .from(enhancedTerms);
      console.log(`Found ${termsResult.length} terms to migrate`);

      if (termsResult.length === 0) {
        console.log('No terms found for migration');
        return { success: true, sectionsCreated: 0 };
      }

      // Prepare bulk insert data for sections
      const sectionsToInsert = [];
      for (const term of termsResult) {
        for (const section of STANDARD_SECTIONS) {
          sectionsToInsert.push({
            termId: term.id,
            name: section.name,
            displayOrder: section.order,
          });
        }
      }

      // Perform bulk insert for sections using Drizzle query builder
      console.log(`Inserting ${sectionsToInsert.length} sections...`);

      // Split into chunks to avoid parameter limits
      const chunkSize = 1000;
      let totalSectionsCreated = 0;

      for (let i = 0; i < sectionsToInsert.length; i += chunkSize) {
        const chunk = sectionsToInsert.slice(i, i + chunkSize);

        await tx
          .insert(sections)
          .values(chunk)
          .onConflictDoNothing({ target: [sections.termId, sections.name] });

        totalSectionsCreated += chunk.length;
        console.log(
          `Processed ${Math.min(i + chunkSize, sectionsToInsert.length)}/${sectionsToInsert.length} sections`
        );
      }

      // Create basic section items for each term
      console.log('Creating basic section items...');
      for (const term of termsResult) {
        await createBasicSectionItems(tx, term.id);
      }

      console.log(`Migration completed! Created ${totalSectionsCreated} sections total.`);
      return { success: true, sectionsCreated: totalSectionsCreated };
    } catch (error) {
      console.error('Section data migration failed:', error);
      throw error;
    }
  });
}

async function createBasicSectionItems(tx: any, termId: string) {
  try {
    // Get the term's full data using Drizzle query builder
    const termData = await tx.select().from(enhancedTerms).where(eq(enhancedTerms.id, termId));

    if (termData.length === 0) return;

    const fullTerm = termData[0];

    // Get section IDs for this term using Drizzle query builder
    const sectionsResult = await tx
      .select({
        id: sections.id,
        name: sections.name,
      })
      .from(sections)
      .where(eq(sections.termId, termId));

    const sectionMap = new Map();
    for (const section of sectionsResult) {
      sectionMap.set(section.name, section.id);
    }

    // Create basic section items from existing term data
    const sectionItems = [
      {
        sectionName: 'Introduction',
        items: [
          {
            label: 'Definition and Overview',
            content: fullTerm.fullDefinition || fullTerm.shortDefinition || '',
            contentType: 'markdown',
            order: 1,
          },
          {
            label: 'Key Concepts',
            content: fullTerm.keywords?.join(', ') || '',
            contentType: 'markdown',
            order: 2,
          },
        ],
      },
      {
        sectionName: 'Applications',
        items: [
          {
            label: 'Real-world Use Cases',
            content: fullTerm.applicationDomains?.join(', ') || '',
            contentType: 'markdown',
            order: 1,
          },
        ],
      },
      {
        sectionName: 'Implementation',
        items: [
          {
            label: 'Code Examples',
            content: fullTerm.hasCodeExamples ? 'Code examples available' : '',
            contentType: 'code',
            order: 1,
          },
        ],
      },
      {
        sectionName: 'Related Concepts',
        items: [
          {
            label: 'Connected Terms',
            content: fullTerm.relatedConcepts ? JSON.stringify(fullTerm.relatedConcepts) : '',
            contentType: 'json',
            order: 1,
          },
        ],
      },
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
          isAiGenerated: false, // Default value since field doesn't exist in current schema
          verificationStatus: 'unverified', // Default value
        });
      }
    }

    // Bulk insert section items if any exist using Drizzle query builder
    if (itemsToInsert.length > 0) {
      await tx.insert(sectionItems).values(itemsToInsert).onConflictDoNothing();
    }
  } catch (error) {
    console.error(`Error creating section items for term ${termId}:`, error);
  }
}

// ES module version - no need for require.main check
