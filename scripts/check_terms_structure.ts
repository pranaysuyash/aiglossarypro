import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function checkTermsStructure() {
  try {
    console.log('Checking terms table structure...\n');

    // Get table structure
    const structure = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'terms'
      ORDER BY ordinal_position
    `);

    console.log('Terms table columns:');
    structure.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Sample a few rows to see actual data
    console.log('\nSample term data:');
    const sample = await db.execute(sql`SELECT * FROM terms LIMIT 2`);
    
    if (sample.rows.length > 0) {
      const firstTerm = sample.rows[0];
      console.log('\nFirst term structure:');
      Object.keys(firstTerm).forEach(key => {
        const value = firstTerm[key];
        const valueStr = value ? (typeof value === 'string' ? value.substring(0, 100) + '...' : String(value)) : 'null';
        console.log(`- ${key}: ${valueStr}`);
      });
    }

  } catch (error) {
    console.error('Error checking terms structure:', error);
  }
}

checkTermsStructure().then(() => process.exit(0)).catch(console.error); 