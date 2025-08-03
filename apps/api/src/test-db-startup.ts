import { Client } from 'pg';

console.log('[STARTUP] Testing database connection...');
console.log('[STARTUP] DATABASE_URL exists:', !!process.env.DATABASE_URL);

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_9dlJKInqoT1w@ep-wandering-morning-a5u0szvw.us-east-2.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  try {
    console.log('[STARTUP] Attempting to connect to database...');
    await client.connect();
    console.log('[STARTUP] ✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW()');
    console.log('[STARTUP] Database time:', result.rows[0].now);
    
    await client.end();
    console.log('[STARTUP] Database test completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('[STARTUP] ❌ Database connection failed:', error);
    console.error('[STARTUP] Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname,
    });
    process.exit(1);
  }
}

testConnection();