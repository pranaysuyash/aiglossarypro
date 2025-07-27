import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkDatabaseTables() {
  console.log('🔍 Checking Database Tables and Schema...\n');

  try {
    // Get all tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Available tables:');
    tables.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });

    // Check for AI-related tables
    console.log('\n🤖 AI-related tables:');
    const aiTables = tables.rows.filter((row: any) => 
      row.table_name.includes('ai') || 
      row.table_name.includes('section') ||
      row.table_name.includes('template') ||
      row.table_name.includes('content')
    );
    
    aiTables.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });

    // Check section_items table structure
    console.log('\n📊 Checking section_items table structure:');
    try {
      const sectionItemsSchema = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'section_items' 
        ORDER BY ordinal_position
      `);
      
      if (sectionItemsSchema.rows.length > 0) {
        console.log('   section_items columns:');
        sectionItemsSchema.rows.forEach((col: any) => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : ''}`);
        });
      } else {
        console.log('   ❌ section_items table not found!');
      }
    } catch (error) {
      console.log('   ❌ Error checking section_items:', error);
    }

    // Check sections table
    console.log('\n📊 Checking sections table structure:');
    try {
      const sectionsSchema = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'sections' 
        ORDER BY ordinal_position
      `);
      
      if (sectionsSchema.rows.length > 0) {
        console.log('   sections columns:');
        sectionsSchema.rows.forEach((col: any) => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : ''}`);
        });
      } else {
        console.log('   ❌ sections table not found!');
      }
    } catch (error) {
      console.log('   ❌ Error checking sections:', error);
    }

    // Check ai_usage_analytics table
    console.log('\n📊 Checking ai_usage_analytics table:');
    try {
      const analyticsSchema = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'ai_usage_analytics' 
        ORDER BY ordinal_position
        LIMIT 5
      `);
      
      if (analyticsSchema.rows.length > 0) {
        console.log('   ✅ ai_usage_analytics table exists');
      } else {
        console.log('   ❌ ai_usage_analytics table not found!');
      }
    } catch (error) {
      console.log('   ❌ Error checking ai_usage_analytics:', error);
    }

  } catch (error) {
    console.error('❌ Error checking database tables:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkDatabaseTables().catch(console.error);