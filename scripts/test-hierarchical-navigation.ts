#!/usr/bin/env npx tsx
/**
 * Test script to verify hierarchical navigation functionality
 */

async function testHierarchicalNavigation() {
  const baseUrl = 'http://localhost:5173';

  console.log('🔍 Testing Hierarchical Navigation Implementation...\n');

  // Test cases
  const testPages = [
    '/',
    '/term/8b5bff9a-afb7-4691-a58e-adc2bf94f941',
    '/enhanced/terms/8b5bff9a-afb7-4691-a58e-adc2bf94f941',
  ];

  for (const page of testPages) {
    try {
      console.log(`📄 Testing: ${page}`);
      const response = await fetch(`${baseUrl}${page}`);

      if (!response.ok) {
        console.log(`❌ Page failed to load: ${response.status}`);
        continue;
      }

      const html = await response.text();

      // Check for React components and data
      const hasReactRoot = html.includes('id="root"');
      const hasViteDevScript = html.includes('/@vite/client');
      const hasModule = html.includes('type="module"');

      console.log(`   ✅ React app structure: ${hasReactRoot ? 'Found' : 'Missing'}`);
      console.log(`   ✅ Vite dev server: ${hasViteDevScript ? 'Active' : 'Inactive'}`);
      console.log(`   ✅ Module support: ${hasModule ? 'Enabled' : 'Disabled'}`);
      console.log(`   📏 Content size: ${html.length} bytes`);

      // Since the navigation is loaded dynamically by React,
      // we can't test it directly from static HTML
      console.log(`   💡 Note: Hierarchical navigation loads dynamically via React`);
      console.log('');
    } catch (error) {
      console.log(`❌ Error testing ${page}: ${error}`);
    }
  }

  // Test API endpoints that the navigation would use
  console.log('🔌 Testing Related API Endpoints...\n');

  const apiEndpoints = ['/api/terms', '/api/categories', '/api/health'];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`);
      console.log(`${response.ok ? '✅' : '❌'} ${endpoint}: ${response.status}`);
    } catch (_error) {
      console.log(`❌ ${endpoint}: Failed to connect`);
    }
  }

  console.log('\n📋 Manual Testing Instructions:');
  console.log('=====================================');
  console.log('1. Open browser to: http://localhost:5173');
  console.log('2. Navigate to any term page (e.g., /term/8b5bff9a-afb7-4691-a58e-adc2bf94f941)');
  console.log('3. Look for "Content Navigation" section');
  console.log('4. Test the following features:');
  console.log('   • Search functionality (type "neural" or "machine learning")');
  console.log('   • Expand/collapse sections (click ▶️/▼️ buttons)');
  console.log('   • Tree/Flat view toggle');
  console.log('   • Interactive element badges (purple 🎮 icons)');
  console.log('   • Progress tracking');
  console.log('   • Breadcrumb navigation');
  console.log('\n🎯 Expected Results:');
  console.log('• 42 main sections visible');
  console.log('• 295 total subsections when expanded');
  console.log('• Real-time search across all content');
  console.log('• Smooth expand/collapse animations');
  console.log('• Visual progress indicators');
  console.log('\n✨ Performance Targets:');
  console.log('• Initial render: < 200ms');
  console.log('• Search response: < 100ms');
  console.log('• Smooth 60fps interactions');
}

testHierarchicalNavigation().catch(console.error);
