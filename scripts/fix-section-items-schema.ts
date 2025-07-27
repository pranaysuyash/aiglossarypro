import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function fixSectionItemsSchema() {
  console.log('🔧 Fixing section_items schema...\n');

  try {
    // Check current columns
    console.log('1️⃣ Checking current columns in section_items...');
    const currentColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'section_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('   Current columns:');
    const existingColumns = new Set();
    currentColumns.rows.forEach((col: any) => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
      existingColumns.add(col.column_name);
    });

    // Add missing columns
    console.log('\n2️⃣ Adding missing columns...');
    
    const columnsToAdd = [
      { name: 'term_id', sql: 'ADD COLUMN term_id UUID REFERENCES enhanced_terms(id) ON DELETE CASCADE' },
      { name: 'column_id', sql: 'ADD COLUMN column_id VARCHAR(100)' },
      { name: 'evaluation_score', sql: 'ADD COLUMN evaluation_score INTEGER DEFAULT 0' },
      { name: 'evaluation_feedback', sql: 'ADD COLUMN evaluation_feedback TEXT' },
      { name: 'improved_content', sql: 'ADD COLUMN improved_content TEXT' },
      { name: 'processing_phase', sql: "ADD COLUMN processing_phase VARCHAR(20) DEFAULT 'generated'" },
      { name: 'prompt_version', sql: "ADD COLUMN prompt_version VARCHAR(20) DEFAULT 'v1.0'" },
      { name: 'generation_cost', sql: 'ADD COLUMN generation_cost DECIMAL(10,6) DEFAULT 0' },
      { name: 'quality_score', sql: 'ADD COLUMN quality_score INTEGER DEFAULT 0' }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.has(column.name)) {
        try {
          await db.execute(sql.raw(`ALTER TABLE section_items ${column.sql}`));
          console.log(`   ✅ Added column: ${column.name}`);
        } catch (error: Error | unknown) {
          if (error.message.includes('already exists')) {
            console.log(`   ℹ️  Column ${column.name} already exists`);
          } else {
            console.log(`   ❌ Failed to add ${column.name}:`, error.message);
          }
        }
      } else {
        console.log(`   ℹ️  Column ${column.name} already exists`);
      }
    }

    // Verify final schema
    console.log('\n3️⃣ Verifying final schema...');
    const finalColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'section_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('   Final columns:');
    finalColumns.rows.forEach((col: any) => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n✅ Schema fix complete!');

  } catch (error) {
    console.error('❌ Error fixing schema:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixSectionItemsSchema().catch(console.error);