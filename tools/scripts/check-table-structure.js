import { Client } from 'pg';
async function checkTableStructure() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        await client.connect();
        console.log('🔗 Connected to database');
        // Get the table structure
        const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'model_content_versions'
      ORDER BY ordinal_position
    `);
        console.log('📋 Current table structure:');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
        });
        // Check if there are any rows
        const countResult = await client.query('SELECT COUNT(*) FROM model_content_versions');
        console.log(`\n📊 Current row count: ${countResult.rows[0].count}`);
        // Test a simple insert
        console.log('\n🧪 Testing simple insert...');
        try {
            await client.query(`
        INSERT INTO model_content_versions (term_id, section_name, model, content)
        VALUES ('35aee6a5-6305-420c-9257-2213aef10c8b', 'test_section', 'gpt-4o-mini', 'Test content')
      `);
            console.log('✅ Simple insert successful');
            // Clean up the test row
            await client.query(`DELETE FROM model_content_versions WHERE section_name = 'test_section'`);
            console.log('✅ Test row cleaned up');
        }
        catch (error) {
            console.error('❌ Simple insert failed:', error);
        }
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await client.end();
    }
}
checkTableStructure().catch(console.error);
