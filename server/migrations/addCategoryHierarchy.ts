#!/usr/bin/env tsx

/**
 * Category Hierarchy Migration
 *
 * Adds hierarchical structure to categories for better content organization.
 * This is a strategic enhancement to improve user experience and content discoverability.
 *
 * Benefits:
 * - Better UX: Navigate AI > Machine Learning > Deep Learning > CNNs
 * - SEO: Hierarchical URLs and breadcrumbs
 * - Scalability: Supports unlimited category depth
 * - Performance: Better filtering and faceted search
 */

import { sql } from 'drizzle-orm';
import { db } from '../db';

interface CategoryHierarchy {
  name: string;
  parent?: string;
  description?: string;
  displayOrder: number;
  iconName?: string;
  colorScheme?: string;
  isFeatured?: boolean;
}

// Strategic category hierarchy for AI/ML content
const CATEGORY_HIERARCHY: CategoryHierarchy[] = [
  // Top Level Categories
  {
    name: 'Artificial Intelligence',
    displayOrder: 1,
    iconName: 'brain',
    colorScheme: 'blue',
    isFeatured: true,
  },
  {
    name: 'Machine Learning',
    displayOrder: 2,
    iconName: 'cpu',
    colorScheme: 'green',
    isFeatured: true,
  },
  {
    name: 'Data Science',
    displayOrder: 3,
    iconName: 'bar-chart',
    colorScheme: 'purple',
    isFeatured: true,
  },
  {
    name: 'Computer Vision',
    displayOrder: 4,
    iconName: 'eye',
    colorScheme: 'orange',
    isFeatured: true,
  },
  {
    name: 'Natural Language Processing',
    displayOrder: 5,
    iconName: 'message-square',
    colorScheme: 'teal',
    isFeatured: true,
  },

  // AI Subcategories
  { name: 'Expert Systems', parent: 'Artificial Intelligence', displayOrder: 1 },
  { name: 'Knowledge Representation', parent: 'Artificial Intelligence', displayOrder: 2 },
  { name: 'AI Ethics', parent: 'Artificial Intelligence', displayOrder: 3 },
  { name: 'General AI', parent: 'Artificial Intelligence', displayOrder: 4 },

  // Machine Learning Subcategories
  {
    name: 'Deep Learning',
    parent: 'Machine Learning',
    displayOrder: 1,
    iconName: 'layers',
    isFeatured: true,
  },
  { name: 'Supervised Learning', parent: 'Machine Learning', displayOrder: 2 },
  { name: 'Unsupervised Learning', parent: 'Machine Learning', displayOrder: 3 },
  { name: 'Reinforcement Learning', parent: 'Machine Learning', displayOrder: 4 },
  { name: 'Ensemble Methods', parent: 'Machine Learning', displayOrder: 5 },
  { name: 'Feature Engineering', parent: 'Machine Learning', displayOrder: 6 },
  { name: 'Model Evaluation', parent: 'Machine Learning', displayOrder: 7 },

  // Deep Learning Subcategories
  { name: 'Neural Networks', parent: 'Deep Learning', displayOrder: 1 },
  { name: 'Convolutional Neural Networks', parent: 'Deep Learning', displayOrder: 2 },
  { name: 'Recurrent Neural Networks', parent: 'Deep Learning', displayOrder: 3 },
  { name: 'Transformer Architecture', parent: 'Deep Learning', displayOrder: 4 },
  { name: 'Generative Models', parent: 'Deep Learning', displayOrder: 5 },

  // Data Science Subcategories
  { name: 'Statistics', parent: 'Data Science', displayOrder: 1 },
  { name: 'Data Visualization', parent: 'Data Science', displayOrder: 2 },
  { name: 'Data Mining', parent: 'Data Science', displayOrder: 3 },
  { name: 'Big Data', parent: 'Data Science', displayOrder: 4 },
  { name: 'Analytics', parent: 'Data Science', displayOrder: 5 },

  // Computer Vision Subcategories
  { name: 'Image Processing', parent: 'Computer Vision', displayOrder: 1 },
  { name: 'Object Detection', parent: 'Computer Vision', displayOrder: 2 },
  { name: 'Image Classification', parent: 'Computer Vision', displayOrder: 3 },
  { name: 'Face Recognition', parent: 'Computer Vision', displayOrder: 4 },
  { name: 'Medical Imaging', parent: 'Computer Vision', displayOrder: 5 },

  // NLP Subcategories
  { name: 'Text Processing', parent: 'Natural Language Processing', displayOrder: 1 },
  { name: 'Language Models', parent: 'Natural Language Processing', displayOrder: 2 },
  { name: 'Sentiment Analysis', parent: 'Natural Language Processing', displayOrder: 3 },
  { name: 'Machine Translation', parent: 'Natural Language Processing', displayOrder: 4 },
  { name: 'Speech Recognition', parent: 'Natural Language Processing', displayOrder: 5 },
];

export async function addCategoryHierarchy(): Promise<void> {
  console.log('🔄 Adding category hierarchy structure...');

  try {
    // Step 1: Add new columns to categories table
    console.log('📊 Adding hierarchy columns to categories table...');

    await db.execute(sql`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id),
      ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS path TEXT,
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS icon_name VARCHAR(50),
      ADD COLUMN IF NOT EXISTS color_scheme VARCHAR(20),
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS term_count INTEGER DEFAULT 0
    `);

    // Step 2: Create indexes for performance
    console.log('⚡ Creating performance indexes...');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);
      CREATE INDEX IF NOT EXISTS categories_level_idx ON categories(level);
      CREATE INDEX IF NOT EXISTS categories_path_idx ON categories(path);
      CREATE INDEX IF NOT EXISTS categories_display_order_idx ON categories(display_order);
      CREATE INDEX IF NOT EXISTS categories_featured_idx ON categories(is_featured) WHERE is_featured = true;
    `);

    // Step 3: Insert/update categories with hierarchy
    console.log('🏗️  Building category hierarchy...');

    // First pass: Insert top-level categories
    const categoryMap = new Map<string, string>();

    for (const category of CATEGORY_HIERARCHY.filter((c) => !c.parent)) {
      try {
        const result = await db.execute(sql`
          INSERT INTO categories (name, description, level, display_order, icon_name, color_scheme, is_featured, path)
          VALUES (${category.name}, ${category.description || null}, 0, ${category.displayOrder}, 
                  ${category.iconName || null}, ${category.colorScheme || null}, 
                  ${category.isFeatured || false}, ${`/${category.name.toLowerCase().replace(/\s+/g, '-')}`})
          ON CONFLICT (name) DO UPDATE SET
            level = 0,
            display_order = EXCLUDED.display_order,
            icon_name = EXCLUDED.icon_name,
            color_scheme = EXCLUDED.color_scheme,
            is_featured = EXCLUDED.is_featured,
            path = EXCLUDED.path
          RETURNING id
        `);

        const categoryId = (result.rows[0] as any)?.id;
        if (categoryId) {
          categoryMap.set(category.name, categoryId);
          console.log(`✅ Top-level category: ${category.name}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process top-level category ${category.name}:`, error);
      }
    }

    // Second pass: Insert subcategories
    for (const category of CATEGORY_HIERARCHY.filter((c) => c.parent)) {
      try {
        const parentId = categoryMap.get(category.parent!);
        if (!parentId) {
          console.warn(`⚠️  Parent category not found: ${category.parent}`);
          continue;
        }

        const path = `/${category.parent?.toLowerCase().replace(/\s+/g, '-')}/${category.name.toLowerCase().replace(/\s+/g, '-')}`;

        const result = await db.execute(sql`
          INSERT INTO categories (name, description, parent_id, level, display_order, path, icon_name, is_featured)
          VALUES (${category.name}, ${category.description || null}, ${parentId}, 1, ${category.displayOrder}, 
                  ${path}, ${category.iconName || null}, ${category.isFeatured || false})
          ON CONFLICT (name) DO UPDATE SET
            parent_id = EXCLUDED.parent_id,
            level = 1,
            display_order = EXCLUDED.display_order,
            path = EXCLUDED.path,
            icon_name = EXCLUDED.icon_name,
            is_featured = EXCLUDED.is_featured
          RETURNING id
        `);

        const categoryId = (result.rows[0] as any)?.id;
        if (categoryId) {
          categoryMap.set(category.name, categoryId);
          console.log(`✅ Subcategory: ${category.parent} > ${category.name}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to process subcategory ${category.name}:`, error);
      }
    }

    // Step 4: Update term counts for all categories
    console.log('📊 Updating term counts...');

    await db.execute(sql`
      UPDATE categories 
      SET term_count = (
        SELECT COUNT(*) 
        FROM terms 
        WHERE terms.category_id = categories.id
      )
    `);

    // Step 5: Create recursive function for getting category trees
    console.log('🌳 Creating category tree functions...');

    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_category_tree(category_id UUID DEFAULT NULL)
      RETURNS TABLE(
        id UUID,
        name VARCHAR(100),
        description TEXT,
        parent_id UUID,
        level INTEGER,
        path TEXT,
        display_order INTEGER,
        icon_name VARCHAR(50),
        color_scheme VARCHAR(20),
        is_featured BOOLEAN,
        term_count INTEGER,
        children_count INTEGER
      ) AS $$
      BEGIN
        RETURN QUERY
        WITH RECURSIVE category_tree AS (
          -- Base case: start with specified category or all root categories
          SELECT c.id, c.name, c.description, c.parent_id, c.level, c.path,
                 c.display_order, c.icon_name, c.color_scheme, c.is_featured, 
                 c.term_count, 0 as depth
          FROM categories c
          WHERE (category_id IS NULL AND c.parent_id IS NULL) 
             OR (category_id IS NOT NULL AND c.id = category_id)
          
          UNION ALL
          
          -- Recursive case: get children
          SELECT c.id, c.name, c.description, c.parent_id, c.level, c.path,
                 c.display_order, c.icon_name, c.color_scheme, c.is_featured,
                 c.term_count, ct.depth + 1
          FROM categories c
          INNER JOIN category_tree ct ON c.parent_id = ct.id
        )
        SELECT ct.id, ct.name, ct.description, ct.parent_id, ct.level, ct.path,
               ct.display_order, ct.icon_name, ct.color_scheme, ct.is_featured,
               ct.term_count,
               (SELECT COUNT(*)::INTEGER FROM categories WHERE parent_id = ct.id) as children_count
        FROM category_tree ct
        ORDER BY ct.level, ct.display_order, ct.name;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Generate summary
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_categories,
        COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as root_categories,
        COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories,
        COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_categories
      FROM categories
    `);

    const summary = stats.rows[0] as any;

    console.log('\n🎉 Category hierarchy migration completed!');
    console.log('=====================================');
    console.log(`📊 Total categories: ${summary.total_categories}`);
    console.log(`🏠 Root categories: ${summary.root_categories}`);
    console.log(`📁 Subcategories: ${summary.subcategories}`);
    console.log(`⭐ Featured categories: ${summary.featured_categories}`);

    console.log('\n🔧 New Features Available:');
    console.log('• Hierarchical navigation (Parent > Child)');
    console.log('• Breadcrumb navigation with paths');
    console.log('• Featured category highlighting');
    console.log('• Icon and color theming support');
    console.log('• Automatic term counting');
    console.log('• Performance-optimized queries');

    console.log('\n📊 Example queries:');
    console.log('• Get full category tree: SELECT * FROM get_category_tree()');
    console.log(
      "• Get AI subcategories: SELECT * FROM get_category_tree((SELECT id FROM categories WHERE name = 'Artificial Intelligence'))"
    );
    console.log(
      '• Get featured categories: SELECT * FROM categories WHERE is_featured = true ORDER BY display_order'
    );
  } catch (error) {
    console.error('💥 Category hierarchy migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addCategoryHierarchy()
    .then(() => {
      console.log('\n✅ Category hierarchy migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}
