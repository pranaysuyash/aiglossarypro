import { HIERARCHICAL_295_STRUCTURE } from '../shared/295ColumnStructure';
import { db } from '../server/db';
import { sections, sectionItems } from '../shared/enhancedSchema';
import { eq } from 'drizzle-orm';
async function test295Mapping() {
    try {
        console.log('=== 295-Column Architecture Analysis ===\n');
        // 1. Show the 295-column structure breakdown
        const sectionBreakdown = new Map();
        HIERARCHICAL_295_STRUCTURE.forEach(col => {
            if (!sectionBreakdown.has(col.section)) {
                sectionBreakdown.set(col.section, { count: 0, columns: [] });
            }
            const section = sectionBreakdown.get(col.section);
            section.count++;
            section.columns.push(col.id);
        });
        console.log('295 Columns by Section:');
        let totalColumns = 0;
        sectionBreakdown.forEach((data, section) => {
            console.log(`\n${section.toUpperCase()} (${data.count} columns):`);
            data.columns.slice(0, 5).forEach(col => {
                const colDef = HIERARCHICAL_295_STRUCTURE.find(c => c.id === col);
                console.log(`  - ${colDef?.displayName} (${col})`);
            });
            if (data.count > 5) {
                console.log(`  ... and ${data.count - 5} more`);
            }
            totalColumns += data.count;
        });
        console.log(`\nTotal: ${totalColumns} columns (The 296th column is the term itself)\n`);
        // 2. Show how this maps to our 42-section structure
        const termId = '6a4b16b3-a686-4d7c-91d2-284e805f6f9d';
        const dbSections = await db.select().from(sections)
            .where(eq(sections.termId, termId))
            .orderBy(sections.displayOrder);
        console.log(`\n=== 42-Section Structure for CNN Term ===`);
        console.log(`Found ${dbSections.length} sections in database\n`);
        // 3. Check if any section_items exist with column_id
        const sectionItemsWithColumns = await db.select()
            .from(sectionItems)
            .where(eq(sectionItems.termId, termId))
            .limit(10);
        console.log(`\n=== Section Items (295-column content storage) ===`);
        console.log(`Found ${sectionItemsWithColumns.length} section items with content\n`);
        if (sectionItemsWithColumns.length > 0) {
            sectionItemsWithColumns.forEach(item => {
                console.log(`Section Item ${item.id}:`);
                console.log(`  - Column ID: ${item.columnId || 'Not set'}`);
                console.log(`  - Label: ${item.label}`);
                console.log(`  - Content: ${item.content ? item.content.substring(0, 100) + '...' : 'Empty'}`);
                console.log(`  - AI Generated: ${item.isAiGenerated}`);
                console.log(`  - Processing Phase: ${item.processingPhase}`);
                console.log(`  - Quality Score: ${item.qualityScore}`);
                console.log('');
            });
        }
        // 4. Explain the relationship
        console.log('\n=== How 295-Column System Works ===\n');
        console.log('1. Enhanced Terms Table: Stores basic term information');
        console.log('2. Sections Table: Defines the 42-section structure for organizing content');
        console.log('3. Section Items Table: Stores the actual 295-column content');
        console.log('   - Each row can store content for one of the 295 columns');
        console.log('   - Links to term via term_id and identifies column via column_id');
        console.log('   - Includes AI generation metadata (scores, feedback, costs)');
        console.log('4. Content Generation Flow:');
        console.log('   - Enhanced295ContentService generates content for each column');
        console.log('   - Uses prompt triplets (generate, evaluate, improve)');
        console.log('   - Stores results in section_items with quality tracking');
        console.log('\n5. The 295 columns provide granular content pieces that can be:');
        console.log('   - Assembled into the 42 sections for display');
        console.log('   - Generated and improved independently');
        console.log('   - Quality-tracked at a fine-grained level');
    }
    catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}
test295Mapping();
