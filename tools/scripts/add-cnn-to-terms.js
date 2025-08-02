import 'dotenv/config';
import { db } from '../server/db';
import { terms, categories } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
async function addCNNToTermsTable() {
    console.log('🔧 Adding CNN to regular terms table...\n');
    try {
        // First check if it already exists
        const existing = await db
            .select()
            .from(terms)
            .where(eq(terms.slug, 'convolutional-neural-network'))
            .limit(1);
        if (existing.length > 0) {
            console.log('   ℹ️  Term already exists in regular terms table');
            console.log('   - ID:', existing[0].id);
            console.log('   - Name:', existing[0].name);
            return;
        }
        // Get a category for the term
        const [category] = await db
            .select()
            .from(categories)
            .where(eq(categories.slug, 'deep-learning'))
            .limit(1);
        let categoryId = category?.id;
        if (!categoryId) {
            // Create deep-learning category if it doesn't exist
            console.log('   Creating deep-learning category...');
            const [newCategory] = await db
                .insert(categories)
                .values({
                id: randomUUID(),
                name: 'Deep Learning',
                slug: 'deep-learning',
                description: 'Advanced machine learning techniques using neural networks with multiple layers',
            })
                .returning();
            categoryId = newCategory.id;
            console.log('   ✅ Created category');
        }
        // Create the term in regular terms table
        const termData = {
            id: randomUUID(),
            name: 'Convolutional Neural Network',
            slug: 'convolutional-neural-network',
            shortDefinition: 'A deep learning algorithm commonly used for analyzing visual imagery',
            definition: 'A Convolutional Neural Network (CNN) is a class of deep neural networks, most commonly applied to analyzing visual imagery. CNNs use a variation of multilayer perceptrons designed to require minimal preprocessing. They are also known as shift invariant or space invariant artificial neural networks (SIANN), based on the shared-weight architecture of the convolution kernels that scan the hidden layers and translation invariance characteristics.',
            categoryId,
            viewCount: 0,
            isPopular: true,
            isFeatured: true,
        };
        console.log('   Creating term in regular terms table...');
        const [newTerm] = await db.insert(terms).values(termData).returning();
        console.log('\n✅ Term created successfully!');
        console.log('   - ID:', newTerm.id);
        console.log('   - Name:', newTerm.name);
        console.log('   - Slug:', newTerm.slug);
        console.log('   - Category ID:', newTerm.categoryId);
        console.log('\n🔗 The term should now be accessible at:');
        console.log('   http://localhost:5173/term/convolutional-neural-network');
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        process.exit(0);
    }
}
// Run the script
addCNNToTermsTable().catch(console.error);
