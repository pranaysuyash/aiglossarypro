import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function checkData() {
  try {
    console.log('Checking database tables and data...\n');

    // Check enhanced_terms table
    const enhancedTerms = await db.execute(sql`SELECT COUNT(*) as count FROM enhanced_terms`);
    console.log(`Enhanced terms: ${enhancedTerms.rows[0].count}`);

    // Check regular terms table
    const regularTerms = await db.execute(sql`SELECT COUNT(*) as count FROM terms`);
    console.log(`Regular terms: ${regularTerms.rows[0].count}`);

    // Check sections table
    try {
      const sections = await db.execute(sql`SELECT COUNT(*) as count FROM sections`);
      console.log(`Sections: ${sections.rows[0].count}`);
    } catch (error) {
      console.log('Sections table does not exist');
    }

    // Check categories
    const categories = await db.execute(sql`SELECT COUNT(*) as count FROM categories`);
    console.log(`Categories: ${categories.rows[0].count}`);

    // Sample some terms if they exist
    if (parseInt(regularTerms.rows[0].count as string) > 0) {
      console.log('\nSample regular terms:');
      const sampleTerms = await db.execute(sql`SELECT id, name FROM terms LIMIT 5`);
      sampleTerms.rows.forEach(term => {
        console.log(`- ${term.name} (ID: ${term.id})`);
      });
    }

    if (parseInt(enhancedTerms.rows[0].count as string) > 0) {
      console.log('\nSample enhanced terms:');
      const sampleEnhanced = await db.execute(sql`SELECT id, name FROM enhanced_terms LIMIT 5`);
      sampleEnhanced.rows.forEach(term => {
        console.log(`- ${term.name} (ID: ${term.id})`);
      });
    }

  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkData().then(() => process.exit(0)).catch(console.error); 