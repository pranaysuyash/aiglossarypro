import { sql } from 'drizzle-orm';
import { db } from './db';

// The 42 standardized sections identified from the Excel analysis
export const STANDARD_SECTIONS = [
  { name: 'Introduction', order: 1 },
  { name: 'Prerequisites', order: 2 },
  { name: 'Historical Context', order: 3 },
  { name: 'Theoretical Concepts', order: 4 },
  { name: 'How It Works', order: 5 },
  { name: 'Implementation', order: 6 },
  { name: 'Tools & Frameworks', order: 7 },
  { name: 'Evaluation and Metrics', order: 8 },
  { name: 'Applications', order: 9 },
  { name: 'Real-world Datasets & Benchmarks', order: 10 },
  { name: 'Case Studies', order: 11 },
  { name: 'Hands-on Tutorials', order: 12 },
  { name: 'Best Practices', order: 13 },
  { name: 'Optimization Techniques', order: 14 },
  { name: 'Common Challenges and Pitfalls', order: 15 },
  { name: 'Security Considerations', order: 16 },
  { name: 'Ethics and Responsible AI', order: 17 },
  { name: 'Comparison with Alternatives', order: 18 },
  { name: 'Variants or Extensions', order: 19 },
  { name: 'Related Concepts', order: 20 },
  { name: 'Industry Adoption', order: 21 },
  { name: 'Innovation Spotlight', order: 22 },
  { name: 'Future Directions', order: 23 },
  { name: 'Research Papers', order: 24 },
  { name: 'References', order: 25 },
  { name: 'Further Reading', order: 26 },
  { name: 'Recommended Websites & Courses', order: 27 },
  { name: 'Career Guidance', order: 28 },
  { name: 'Project Suggestions', order: 29 },
  { name: 'Collaboration and Community', order: 30 },
  { name: 'Advantages and Disadvantages', order: 31 },
  { name: 'Interactive Elements', order: 32 },
  { name: 'Quick Quiz', order: 33 },
  { name: 'Did You Know?', order: 34 },
  { name: 'Glossary', order: 35 },
  { name: 'Tags & Keywords', order: 36 },
  { name: 'FAQs', order: 37 },
  { name: 'Conclusion', order: 38 },
  { name: 'Appendices', order: 39 },
  { name: 'Metadata', order: 40 },
  { name: 'Feedback & Ratings', order: 41 },
  { name: 'Version History', order: 42 },
] as const;

export async function migrateSectionData() {
  try {
    console.log('Starting section data migration...');

    // Get all existing terms
    const terms = await db.execute(sql`SELECT id, name FROM enhanced_terms`);
    console.log(`Found ${terms.rows.length} terms to migrate`);

    let totalSectionsCreated = 0;

    // For each term, create all 42 sections
    for (const term of terms.rows) {
      const termId = term.id as string;
      const termName = term.name as string;

      console.log(`Creating sections for term: ${termName} (ID: ${termId})`);

      // Insert all sections for this term
      for (const section of STANDARD_SECTIONS) {
        try {
          await db.execute(sql`
            INSERT INTO sections (term_id, name, display_order, created_at, updated_at)
            VALUES (${termId}, ${section.name}, ${section.order}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (term_id, name) DO NOTHING
          `);
          totalSectionsCreated++;
        } catch (error) {
          console.error(`Error creating section ${section.name} for term ${termName}:`, error);
        }
      }

      // Create basic section items for key sections using existing term data
      await createBasicSectionItems(termId, term);
    }

    console.log(`Migration completed! Created ${totalSectionsCreated} sections total.`);
    return { success: true, sectionsCreated: totalSectionsCreated };
  } catch (error) {
    console.error('Section data migration failed:', error);
    throw error;
  }
}

async function createBasicSectionItems(termId: string, _term: any) {
  try {
    // Get the term's full data
    const termData = await db.execute(sql`
      SELECT * FROM enhanced_terms WHERE id = ${termId}
    `);

    if (termData.rows.length === 0) {return;}

    const fullTerm = termData.rows[0];

    // Get section IDs for this term
    const sectionsResult = await db.execute(sql`
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
            order: 1,
          },
          {
            label: 'Key Concepts',
            content: fullTerm.key_concepts || '',
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
            content: fullTerm.applications || '',
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
            content: fullTerm.code_examples || '',
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
            content: fullTerm.related_terms ? JSON.stringify(fullTerm.related_terms) : '',
            contentType: 'json',
            order: 1,
          },
        ],
      },
    ];

    // Insert section items
    for (const sectionData of sectionItems) {
      const sectionId = sectionMap.get(sectionData.sectionName);
      if (!sectionId) {continue;}

      for (const item of sectionData.items) {
        if (!item.content) {continue;} // Skip empty content

        await db.execute(sql`
          INSERT INTO section_items (
            section_id, label, content, content_type, display_order,
            is_ai_generated, verification_status, created_at, updated_at
          )
          VALUES (
            ${sectionId}, ${item.label}, ${item.content}, ${item.contentType}, ${item.order},
            ${fullTerm.is_ai_generated || false}, ${fullTerm.verification_status || 'unverified'},
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          ON CONFLICT DO NOTHING
        `);
      }
    }
  } catch (error) {
    console.error(`Error creating section items for term ${termId}:`, error);
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSectionData()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
