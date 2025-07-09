import { pool } from '../db';

async function checkNewsletterTables() {
  const client = await pool.connect();

  try {
    console.log('Checking newsletter and contact tables...');

    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('newsletter_subscriptions', 'contact_submissions')
      ORDER BY table_name;
    `);

    console.log('Found tables:', tables.rows);

    // Check newsletter_subscriptions data
    const newsletterCount = await client.query('SELECT COUNT(*) FROM newsletter_subscriptions');
    console.log(`Newsletter subscriptions: ${newsletterCount.rows[0].count} rows`);

    const sampleNewsletter = await client.query('SELECT * FROM newsletter_subscriptions LIMIT 3');
    console.log('Sample newsletter data:', sampleNewsletter.rows);

    // Check contact_submissions data
    const contactCount = await client.query('SELECT COUNT(*) FROM contact_submissions');
    console.log(`Contact submissions: ${contactCount.rows[0].count} rows`);

    const sampleContact = await client.query('SELECT * FROM contact_submissions LIMIT 3');
    console.log('Sample contact data:', sampleContact.rows);
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkNewsletterTables().catch(console.error);
