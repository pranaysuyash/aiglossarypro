import { pool } from '../db';

async function createNewsletterTables() {
  const client = await pool.connect();
  
  try {
    console.log('Creating newsletter and contact tables...');
    
    // Create newsletter_subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        language VARCHAR(10) DEFAULT 'en',
        user_agent TEXT,
        ip_address VARCHAR(64), -- Hashed IP for privacy
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at TIMESTAMP,
        
        -- Check constraints
        CONSTRAINT check_newsletter_status CHECK (status IN ('active', 'unsubscribed'))
      );
    `);
    
    console.log('✓ Created newsletter_subscriptions table');
    
    // Create indexes for newsletter_subscriptions
    await client.query(`CREATE INDEX IF NOT EXISTS newsletter_email_idx ON newsletter_subscriptions(email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS newsletter_status_idx ON newsletter_subscriptions(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS newsletter_created_at_idx ON newsletter_subscriptions(created_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS newsletter_utm_source_idx ON newsletter_subscriptions(utm_source);`);
    
    console.log('✓ Created newsletter_subscriptions indexes');
    
    // Create contact_submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'new',
        language VARCHAR(10) DEFAULT 'en',
        user_agent TEXT,
        ip_address VARCHAR(64), -- Hashed IP for privacy
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        notes TEXT, -- Admin notes
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Check constraints
        CONSTRAINT check_contact_status CHECK (status IN ('new', 'in_progress', 'resolved'))
      );
    `);
    
    console.log('✓ Created contact_submissions table');
    
    // Create indexes for contact_submissions
    await client.query(`CREATE INDEX IF NOT EXISTS contact_email_idx ON contact_submissions(email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS contact_status_idx ON contact_submissions(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS contact_created_at_idx ON contact_submissions(created_at);`);
    await client.query(`CREATE INDEX IF NOT EXISTS contact_utm_source_idx ON contact_submissions(utm_source);`);
    
    console.log('✓ Created contact_submissions indexes');
    
    // Create trigger to automatically update updated_at column
    await client.query(`
      CREATE OR REPLACE FUNCTION update_contact_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS contact_updated_at_trigger ON contact_submissions;
      CREATE TRIGGER contact_updated_at_trigger
          BEFORE UPDATE ON contact_submissions
          FOR EACH ROW
          EXECUTE FUNCTION update_contact_updated_at();
    `);
    
    console.log('✓ Created update trigger for contact_submissions');
    
    // Insert some sample data for testing
    try {
      await client.query(`
        INSERT INTO newsletter_subscriptions (email, language, utm_source) VALUES 
        ('test@example.com', 'en', 'website'),
        ('demo@example.com', 'en', 'social')
        ON CONFLICT (email) DO NOTHING;
      `);
      
      await client.query(`
        INSERT INTO contact_submissions (name, email, subject, message, utm_source) VALUES 
        ('John Doe', 'john@example.com', 'Test Subject', 'This is a test message', 'website'),
        ('Jane Smith', 'jane@example.com', 'Another Subject', 'Another test message', 'social')
        ON CONFLICT DO NOTHING;
      `);
      
      console.log('✓ Inserted sample data');
    } catch (error) {
      console.log('Note: Sample data insertion skipped (may already exist)');
    }
    
    console.log('✅ Newsletter and contact tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createNewsletterTables().catch(console.error);