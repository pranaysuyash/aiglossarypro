import dotenv from "dotenv";
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  console.log('📍 Database URL configured');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('⏳ Attempting connection...');
    const client = await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Test a simple query
    console.log('⏳ Testing simple query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0]);
    
    // Test table existence
    console.log('⏳ Checking table existence...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Found tables:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check terms count
    try {
      const termsCount = await client.query('SELECT COUNT(*) as count FROM terms');
      console.log('📈 Terms count:', termsCount.rows[0].count);
    } catch (error) {
      console.log('⚠️  Could not count terms:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Check categories count
    try {
      const categoriesCount = await client.query('SELECT COUNT(*) as count FROM categories');
      console.log('📈 Categories count:', categoriesCount.rows[0].count);
    } catch (error) {
      console.log('⚠️  Could not count categories:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    client.release();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:');
      console.error('  Message:', error.message);
      console.error('  Stack:', error.stack);
    }
  }
}

testDatabaseConnection().catch(console.error); 