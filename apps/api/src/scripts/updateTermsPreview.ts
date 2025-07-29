import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function updateTermsPreview() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);

  try {
    console.log('🔄 Updating terms to set isPreview = false...');

    // Update all terms to set isPreview = false
    const result = await sql`
      UPDATE terms 
      SET "isPreview" = false 
      WHERE "isPreview" = true OR "isPreview" IS NULL
      RETURNING id, name
    `;

    console.log(`✅ Updated ${result.length} terms to production status (isPreview = false)`);

    // Show a few examples
    if (result.length > 0) {
      console.log('\n📋 Sample updated terms:');
      result.slice(0, 5).forEach(term => {
        console.log(`   - ${term.name} (${term.id})`);
      });
      if (result.length > 5) {
        console.log(`   ... and ${result.length - 5} more`);
      }
    }

    // Verify the update
    const verifyResult = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE "isPreview" = true) as preview_count,
        COUNT(*) FILTER (WHERE "isPreview" = false) as production_count,
        COUNT(*) as total_count
      FROM terms
    `;

    console.log('\n📊 Final status:');
    console.log(`   - Preview terms: ${verifyResult[0].preview_count}`);
    console.log(`   - Production terms: ${verifyResult[0].production_count}`);
    console.log(`   - Total terms: ${verifyResult[0].total_count}`);
  } catch (error) {
    console.error('❌ Error updating terms:', error);
    throw error;
  }
}

// Run the update
updateTermsPreview()
  .then(() => {
    console.log('\n✅ Update completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });
