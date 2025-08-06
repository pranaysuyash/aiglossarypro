#!/usr/bin/env node
/**
 * Database Integration Test Script
 * 
 * Tests all database query functions to ensure they work correctly
 * with the PostgreSQL database schema.
 */

import { config } from 'dotenv';
config();

console.log('🧪 AIGlossaryPro Database Integration Test');
console.log('==========================================');

// Test database connection first
async function testConnection() {
  console.log('\n1. Testing Database Connection...');
  
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
    console.log('❌ Database connection test failed:', error.message);
    console.log('📋 Make sure DATABASE_URL is set and database is accessible');
    return false;
  }
}

// Test database statistics
async function testStats() {
  console.log('\n2. Testing Database Statistics...');
  
  try {
    const { getDatabaseStats } = await import('./database-queries.js');
    const stats = await getDatabaseStats();
    
    console.log('📊 Database Statistics:');
    console.log(`   Terms: ${stats.terms}`);
    console.log(`   Categories: ${stats.categories}`);
    console.log(`   Last Updated: ${stats.lastUpdated}`);
    
    if (stats.error) {
      console.log('⚠️  Error:', stats.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Statistics test failed:', error.message);
    return false;
  }
}

// Test terms queries
async function testTermsQueries() {
  console.log('\n3. Testing Terms Queries...');
  
  try {
    const { getTermsFromDatabase, getTrendingTerms, getRecentTerms } = await import('./database-queries.js');
    
    // Test basic terms query
    console.log('   Testing basic terms query...');
    const termsResult = await getTermsFromDatabase({ limit: 5 });
    console.log(`   ✅ Found ${termsResult.terms.length} terms (total: ${termsResult.total})`);
    
    if (termsResult.terms.length > 0) {
      const firstTerm = termsResult.terms[0];
      console.log(`   Sample term: "${firstTerm.name}" (${firstTerm.category || 'No category'})`);
    }
    
    // Test trending terms
    console.log('   Testing trending terms...');
    const trendingResult = await getTrendingTerms(3);
    console.log(`   ✅ Found ${trendingResult.length} trending terms`);
    
    // Test recent terms
    console.log('   Testing recent terms...');
    const recentResult = await getRecentTerms(3);
    console.log(`   ✅ Found ${recentResult.length} recent terms`);
    
    return true;
  } catch (error) {
    console.log('❌ Terms queries test failed:', error.message);
    return false;
  }
}

// Test categories queries
async function testCategoriesQueries() {
  console.log('\n4. Testing Categories Queries...');
  
  try {
    const { getCategoriesFromDatabase } = await import('./database-queries.js');
    
    // Test basic categories query
    console.log('   Testing basic categories query...');
    const categoriesResult = await getCategoriesFromDatabase({ limit: 5 });
    console.log(`   ✅ Found ${categoriesResult.categories.length} categories (total: ${categoriesResult.total})`);
    
    if (categoriesResult.categories.length > 0) {
      const firstCategory = categoriesResult.categories[0];
      console.log(`   Sample category: "${firstCategory.name}" (${firstCategory.termCount || 0} terms)`);
    }
    
    // Test with term count
    console.log('   Testing categories with term count...');
    const categoriesWithCount = await getCategoriesFromDatabase({ 
      limit: 3, 
      includeTermCount: true 
    });
    console.log(`   ✅ Found ${categoriesWithCount.categories.length} categories with term counts`);
    
    return true;
  } catch (error) {
    console.log('❌ Categories queries test failed:', error.message);
    return false;
  }
}

// Test search functionality
async function testSearch() {
  console.log('\n5. Testing Search Functionality...');
  
  try {
    const { searchTerms, getTermsFromDatabase } = await import('./database-queries.js');
    
    // First, get some terms to search for
    const allTerms = await getTermsFromDatabase({ limit: 1 });
    
    if (allTerms.terms.length === 0) {
      console.log('   ⚠️  No terms available for search testing');
      return true;
    }
    
    // Test search with the first term name
    const searchQuery = allTerms.terms[0].name.split(' ')[0]; // First word
    console.log(`   Testing search with query: "${searchQuery}"`);
    
    const searchResult = await searchTerms(searchQuery, { limit: 5 });
    console.log(`   ✅ Found ${searchResult.data.length} search results (total: ${searchResult.total})`);
    
    return true;
  } catch (error) {
    console.log('❌ Search test failed:', error.message);
    return false;
  }
}

// Test individual item queries
async function testIndividualQueries() {
  console.log('\n6. Testing Individual Item Queries...');
  
  try {
    const { getTermById, getCategoryById, getTermsFromDatabase, getCategoriesFromDatabase } = await import('./database-queries.js');
    
    // Get a term ID to test with
    const termsResult = await getTermsFromDatabase({ limit: 1 });
    if (termsResult.terms.length > 0) {
      const termId = termsResult.terms[0].id;
      console.log(`   Testing getTermById with ID: ${termId}`);
      
      const term = await getTermById(termId);
      if (term) {
        console.log(`   ✅ Found term: "${term.name}"`);
      } else {
        console.log('   ❌ Term not found');
        return false;
      }
    }
    
    // Get a category ID to test with
    const categoriesResult = await getCategoriesFromDatabase({ limit: 1 });
    if (categoriesResult.categories.length > 0) {
      const categoryId = categoriesResult.categories[0].id;
      console.log(`   Testing getCategoryById with ID: ${categoryId}`);
      
      const category = await getCategoryById(categoryId);
      if (category) {
        console.log(`   ✅ Found category: "${category.name}"`);
      } else {
        console.log('   ❌ Category not found');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Individual queries test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not Set'}`);
  
  const tests = [
    { name: 'Connection', fn: testConnection },
    { name: 'Statistics', fn: testStats },
    { name: 'Terms Queries', fn: testTermsQueries },
    { name: 'Categories Queries', fn: testCategoriesQueries },
    { name: 'Search', fn: testSearch },
    { name: 'Individual Queries', fn: testIndividualQueries }
  ];
  
  const results = [];
  let allPassed = true;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      if (!result) allPassed = false;
    } catch (error) {
      console.log(`❌ ${test.name} test crashed:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
      allPassed = false;
    }
  }
  
  // Summary
  console.log('\n📋 Test Summary');
  console.log('================');
  
  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  }
  
  console.log('\n🎯 Overall Result:');
  if (allPassed) {
    console.log('✅ All tests passed! Database integration is working correctly.');
    console.log('\n💡 Next Steps:');
    console.log('1. Set DB_ENABLED=true to use database in simple-api-with-db.js');
    console.log('2. Test the API endpoints with real data');
    console.log('3. Deploy to production when ready');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure DATABASE_URL environment variable is set');
    console.log('2. Ensure the database is running and accessible');
    console.log('3. Check that database migrations are applied');
    console.log('4. Verify that sample data exists in the database');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});