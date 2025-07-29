import { sql } from 'drizzle-orm';
import { db } from './server/db';

async function checkSectionTables() {
  try {
    console.log('Checking section-based architecture tables...');

    // Check if sections table exists
    const sectionsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sections'
      );
    `);

    console.log('✓ Sections table exists:', sectionsCheck.rows[0].exists);

    // Check if section_items table exists
    const itemsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'section_items'
      );
    `);

    console.log('✓ Section_items table exists:', itemsCheck.rows[0].exists);

    // Check if user_progress table exists
    const progressCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_progress'
      );
    `);

    console.log('✓ User_progress table exists:', progressCheck.rows[0].exists);

    // Check if media table exists
    const mediaCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'media'
      );
    `);

    console.log('✓ Media table exists:', mediaCheck.rows[0].exists);

    // Check count of terms
    const termsCount = await db.execute(sql`SELECT COUNT(*) FROM enhanced_terms`);
    console.log('✓ Enhanced terms count:', termsCount.rows[0].count);

    // If sections table exists, check if it has data
    if (sectionsCheck.rows[0].exists) {
      const sectionsCount = await db.execute(sql`SELECT COUNT(*) FROM sections`);
      console.log('✓ Sections count:', sectionsCount.rows[0].count);

      if (parseInt(sectionsCount.rows[0].count as string) > 0) {
        // Check section names
        const sampleSections = await db.execute(sql`
          SELECT DISTINCT name FROM sections ORDER BY name LIMIT 10
        `);
        console.log(
          '✓ Sample section names:',
          sampleSections.rows.map(r => r.name)
        );
      }
    }

    // If section_items exists, check if it has data
    if (itemsCheck.rows[0].exists) {
      const itemsCount = await db.execute(sql`SELECT COUNT(*) FROM section_items`);
      console.log('✓ Section items count:', itemsCount.rows[0].count);
    }

    console.log('\n--- Summary ---');
    console.log('42-Section Architecture Status:');
    console.log('- Tables created:', sectionsCheck.rows[0].exists && itemsCheck.rows[0].exists);
    console.log(
      '- Data migrated:',
      sectionsCheck.rows[0].exists ? 'Check sections count above' : 'No'
    );
    console.log('- Ready for use:', sectionsCheck.rows[0].exists && itemsCheck.rows[0].exists);
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

checkSectionTables();
