import { migrateSectionData } from './server/migrations/sectionDataMigration';
async function runMigration() {
    try {
        console.log('Starting 42-section data migration...');
        const result = await migrateSectionData();
        console.log('Migration completed successfully!');
        console.log('Result:', result);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
    process.exit(0);
}
runMigration();
