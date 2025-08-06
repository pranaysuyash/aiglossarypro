#!/usr/bin/env node
/**
 * Database Preparation Script
 * 
 * Checks database schema and optionally seeds with sample data
 * for testing the database integration.
 */

import { config } from 'dotenv';
config();

console.log('🔧 AIGlossaryPro Database Preparation');
console.log('=====================================');

// Sample data to seed the database
const sampleCategories = [
  {
    name: 'AI Fundamentals',
    description: 'Basic concepts and principles of artificial intelligence'
  },
  {
    name: 'Machine Learning',
    description: 'Algorithms and techniques for machine learning'
  },
  {
    name: 'Deep Learning',
    description: 'Deep neural networks and advanced architectures'
  },
  {
    name: 'Natural Language Processing',
    description: 'Natural language processing and understanding'
  },
  {
    name: 'Computer Vision',
    description: 'Image and video analysis using AI'
  }
];

const sampleTerms = [
  {
    name: 'Artificial Intelligence',
    shortDefinition: 'The simulation of human intelligence in machines',
    definition: 'Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. It encompasses various subfields including machine learning, natural language processing, computer vision, and robotics.',
    categoryName: 'AI Fundamentals'
  },
  {
    name: 'Machine Learning',
    shortDefinition: 'A subset of AI that enables computers to learn without explicit programming',
    definition: 'Machine Learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention.',
    categoryName: 'Machine Learning'
  },
  {
    name: 'Neural Network',
    shortDefinition: 'Computing systems inspired by biological neural networks',
    definition: 'A neural network is a computing system inspired by the biological neural networks that constitute animal brains. It consists of interconnected nodes (neurons) that work together to solve specific problems.',
    categoryName: 'Deep Learning'
  },
  {
    name: 'Deep Learning',
    shortDefinition: 'Machine learning using deep neural networks',
    definition: 'Deep Learning is a subset of machine learning that uses neural networks with three or more layers. These neural networks attempt to simulate the behavior of the human brain to learn from large amounts of data.',
    categoryName: 'Deep Learning'
  },
  {
    name: 'Natural Language Processing',
    shortDefinition: 'AI field focused on interaction between computers and human language',
    definition: 'Natural Language Processing (NLP) is a branch of artificial intelligence that helps computers understand, interpret and manipulate human language. NLP draws from many disciplines including computer science and computational linguistics.',
    categoryName: 'Natural Language Processing'
  },
  {
    name: 'Convolutional Neural Network',
    shortDefinition: 'Deep learning architecture designed for processing grid-like data',
    definition: 'A Convolutional Neural Network (CNN) is a type of deep neural network that is particularly effective for image recognition and processing. CNNs use convolutional layers to detect local features in data.',
    categoryName: 'Computer Vision'
  },
  {
    name: 'Transformer',
    shortDefinition: 'Neural network architecture based on self-attention mechanisms',
    definition: 'The Transformer is a neural network architecture that relies entirely on self-attention mechanisms to draw global dependencies between input and output. It has become the foundation for models like GPT and BERT.',
    categoryName: 'Natural Language Processing'
  },
  {
    name: 'Supervised Learning',
    shortDefinition: 'Machine learning with labeled training data',
    definition: 'Supervised learning is a machine learning paradigm where algorithms learn from labeled training data to make predictions or classifications on new, unseen data.',
    categoryName: 'Machine Learning'
  }
];

async function checkDatabaseConnection() {
  console.log('\n1. Checking Database Connection...');
  
  try {
    const { testDatabaseConnection } = await import('./database-queries.js');
    const result = await testDatabaseConnection();
    
    if (result.success) {
      console.log('✅ Database connection successful');
      return true;
    } else {
      console.log('❌ Database connection failed:', result.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('   - DATABASE_URL environment variable is set');
    console.log('   - Database server is running');
    console.log('   - Database credentials are correct');
    return false;
  }
}

async function checkTables() {
  console.log('\n2. Checking Database Tables...');
  
  try {
    const { Pool } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { sql } = await import('drizzle-orm');
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool });
    
    // Check if tables exist
    const tablesQuery = sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('categories', 'terms')
      ORDER BY table_name
    `;
    
    const result = await db.execute(tablesQuery);
    const existingTables = result.rows.map(row => row.table_name);
    
    console.log('   Existing tables:', existingTables.length > 0 ? existingTables.join(', ') : 'None');
    
    const requiredTables = ['categories', 'terms'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ All required tables exist');
      return true;
    } else {
      console.log('❌ Missing tables:', missingTables.join(', '));
      console.log('\n🔧 To create tables, run:');
      console.log('   cd apps/api && npm run db:migrate');
      return false;
    }
  } catch (error) {
    console.log('❌ Table check failed:', error.message);
    return false;
  }
}

async function checkExistingData() {
  console.log('\n3. Checking Existing Data...');
  
  try {
    const { getDatabaseStats } = await import('./database-queries.js');
    const stats = await getDatabaseStats();
    
    console.log(`   Categories: ${stats.categories}`);
    console.log(`   Terms: ${stats.terms}`);
    
    return {
      hasCategories: stats.categories > 0,
      hasTerms: stats.terms > 0,
      stats
    };
  } catch (error) {
    console.log('❌ Data check failed:', error.message);
    return { hasCategories: false, hasTerms: false };
  }
}

async function seedCategories() {
  console.log('\n4. Seeding Categories...');
  
  try {
    const { Pool } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const schema = await import('@aiglossarypro/shared');
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    let insertedCount = 0;
    
    for (const category of sampleCategories) {
      try {
        await db.insert(schema.categories).values({
          name: category.name,
          description: category.description
        });
        insertedCount++;
        console.log(`   ✅ Added category: ${category.name}`);
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`   ⚠️  Category already exists: ${category.name}`);
        } else {
          console.log(`   ❌ Failed to add category ${category.name}:`, error.message);
        }
      }
    }
    
    console.log(`   📊 Inserted ${insertedCount} new categories`);
    return true;
  } catch (error) {
    console.log('❌ Category seeding failed:', error.message);
    return false;
  }
}

async function seedTerms() {
  console.log('\n5. Seeding Terms...');
  
  try {
    const { Pool } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { eq } = await import('drizzle-orm');
    const schema = await import('@aiglossarypro/shared');
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    // First, get all categories to map names to IDs
    const categories = await db.select().from(schema.categories);
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.name, cat.id);
    });
    
    let insertedCount = 0;
    
    for (const term of sampleTerms) {
      try {
        const categoryId = categoryMap.get(term.categoryName);
        
        if (!categoryId) {
          console.log(`   ⚠️  Category not found for term ${term.name}: ${term.categoryName}`);
          continue;
        }
        
        await db.insert(schema.terms).values({
          name: term.name,
          shortDefinition: term.shortDefinition,
          definition: term.definition,
          categoryId: categoryId,
          viewCount: Math.floor(Math.random() * 1000) // Random view count for testing
        });
        insertedCount++;
        console.log(`   ✅ Added term: ${term.name}`);
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`   ⚠️  Term already exists: ${term.name}`);
        } else {
          console.log(`   ❌ Failed to add term ${term.name}:`, error.message);
        }
      }
    }
    
    console.log(`   📊 Inserted ${insertedCount} new terms`);
    return true;
  } catch (error) {
    console.log('❌ Term seeding failed:', error.message);
    return false;
  }
}

async function runPreparation() {
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? '***CONFIGURED***' : 'Not Set'}`);
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL environment variable is not set');
    console.log('\n🔧 Set your DATABASE_URL environment variable');
    console.log('   export DATABASE_URL="your_database_connection_string"');
    process.exit(1);
  }
  
  // Step 1: Check connection
  const connectionOk = await checkDatabaseConnection();
  if (!connectionOk) {
    process.exit(1);
  }
  
  // Step 2: Check tables
  const tablesOk = await checkTables();
  if (!tablesOk) {
    console.log('\n❌ Database schema is not ready');
    console.log('Please run migrations first');
    process.exit(1);
  }
  
  // Step 3: Check existing data
  const dataStatus = await checkExistingData();
  
  // Step 4: Ask user if they want to seed data
  const shouldSeed = process.argv.includes('--seed') || process.argv.includes('-s');
  
  if (shouldSeed) {
    console.log('\n🌱 Seeding database with sample data...');
    
    if (!dataStatus.hasCategories || process.argv.includes('--force')) {
      await seedCategories();
    } else {
      console.log('   ⏭️  Skipping categories (already exist, use --force to override)');
    }
    
    if (!dataStatus.hasTerms || process.argv.includes('--force')) {
      await seedTerms();
    } else {
      console.log('   ⏭️  Skipping terms (already exist, use --force to override)');
    }
  } else {
    if (!dataStatus.hasCategories && !dataStatus.hasTerms) {
      console.log('\n💡 Database is empty. To seed with sample data, run:');
      console.log('   node prepare-database.js --seed');
    }
  }
  
  // Final status
  const finalStats = await checkExistingData();
  
  console.log('\n🎯 Database Preparation Complete');
  console.log('=================================');
  console.log(`✅ Connection: Working`);
  console.log(`✅ Schema: Ready`);
  console.log(`📊 Categories: ${finalStats.stats.categories}`);
  console.log(`📊 Terms: ${finalStats.stats.terms}`);
  
  if (finalStats.stats.categories > 0 && finalStats.stats.terms > 0) {
    console.log('\n🚀 Database is ready for testing!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: node test-database-integration.js');
    console.log('2. Start API with: DB_ENABLED=true node simple-api-with-db.js');
    console.log('3. Test endpoints: curl http://localhost:8080/api/terms');
  } else {
    console.log('\n⚠️  Database has no data');
    console.log('Run with --seed to add sample data');
  }
}

runPreparation().catch(error => {
  console.error('💥 Preparation script crashed:', error);
  process.exit(1);
});