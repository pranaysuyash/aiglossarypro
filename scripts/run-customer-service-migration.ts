#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { db } from '../server/db';
import { log as logger } from '../server/utils/logger';

async function runCustomerServiceMigration() {
  try {
    logger.info('🚀 Starting customer service migration...');

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      '../migrations/0017_add_customer_service_tables.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    logger.info(`📋 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          logger.info(`⚡ Executing statement ${i + 1}/${statements.length}`);
          await db.execute(statement);
        } catch (error) {
          // Some statements might fail if they already exist - that's OK
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            logger.warn(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            logger.error(`❌ Error executing statement ${i + 1}:`, error);
            throw error;
          }
        }
      }
    }

    logger.info('✅ Customer service migration completed successfully!');

    // Test the migration by creating some sample data
    logger.info('🧪 Testing migration with sample data...');

    // Check if tables exist and can be queried
    const testQueries = [
      'SELECT COUNT(*) FROM support_tickets',
      'SELECT COUNT(*) FROM ticket_messages',
      'SELECT COUNT(*) FROM ticket_attachments',
      'SELECT COUNT(*) FROM knowledge_base_articles',
      'SELECT COUNT(*) FROM response_templates',
      'SELECT COUNT(*) FROM refund_requests',
      'SELECT COUNT(*) FROM customer_service_metrics',
      'SELECT COUNT(*) FROM customer_feedback',
    ];

    for (const query of testQueries) {
      try {
        const result = await db.execute(query);
        logger.info(`✅ ${query} - OK`);
      } catch (error) {
        logger.error(`❌ ${query} - Failed:`, error);
        throw error;
      }
    }

    logger.info('🎉 All customer service tables are ready!');

    // Verify the default templates were inserted
    const templatesResult = await db.execute('SELECT COUNT(*) as count FROM response_templates');
    const templateCount = templatesResult.rows[0]?.count || 0;
    logger.info(`📧 Found ${templateCount} response templates`);

    // Verify the knowledge base categories and articles
    const articlesResult = await db.execute(
      'SELECT COUNT(*) as count FROM knowledge_base_articles WHERE is_published = true'
    );
    const articleCount = articlesResult.rows[0]?.count || 0;
    logger.info(`📚 Found ${articleCount} published knowledge base articles`);

    logger.info('✨ Customer service system is ready for use!');
  } catch (error) {
    logger.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runCustomerServiceMigration()
    .then(() => {
      logger.info('🏁 Migration script completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { runCustomerServiceMigration };
