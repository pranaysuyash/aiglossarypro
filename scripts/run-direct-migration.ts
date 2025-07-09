import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runDirectMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Read the SQL file
    const sqlContent = readFileSync(join(__dirname, 'direct-table-creation.sql'), 'utf8');

    // Execute the SQL
    console.log('🚀 Creating model_content_versions table...');
    await client.query(sqlContent);
    console.log('✅ Table created successfully');

    // Verify the table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'model_content_versions'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table verification successful');

      // Check the table structure
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'model_content_versions'
        ORDER BY ordinal_position
      `);

      console.log('📋 Table structure:');
      columnsResult.rows.forEach((row) => {
        console.log(
          `  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`
        );
      });
    } else {
      console.log('❌ Table verification failed');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔚 Database connection closed');
  }
}

// Run the migration
runDirectMigration().catch(console.error);
