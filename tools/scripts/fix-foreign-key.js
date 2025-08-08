import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
async function fixForeignKey() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        await client.connect();
        console.log('🔗 Connected to database');
        // Read and execute the SQL file
        const sqlContent = readFileSync(join(__dirname, 'remove-foreign-key-constraint.sql'), 'utf8');
        console.log('🔧 Removing foreign key constraints...');
        await client.query(sqlContent);
        console.log('✅ Foreign key constraints removed successfully');
        // Verify the constraints are gone
        const result = await client.query(`
      SELECT constraint_name, table_name, column_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'model_content_versions'
        AND column_name = 'generated_by'
    `);
        if (result.rows.length === 0) {
            console.log('✅ No foreign key constraints found on generated_by column');
        }
        else {
            console.log('⚠️  Remaining constraints:');
            result.rows.forEach(row => {
                console.log(`  ${row.constraint_name} on ${row.table_name}.${row.column_name}`);
            });
        }
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await client.end();
    }
}
fixForeignKey().catch(console.error);
