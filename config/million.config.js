/**
 * Million.js Configuration
 * Optimizes React performance by up to 70%
 */

export default {
  // Auto mode automatically optimizes components
  auto: true,

  // Optimize these specific components for maximum performance
  include: [
    // List rendering components
    'client/src/pages/Terms.tsx',
    'client/src/pages/Categories.tsx',
    'client/src/pages/Favorites.tsx',
    'client/src/pages/Home.tsx',
    'client/src/pages/Trending.tsx',
    'client/src/components/SearchBar.tsx',
    'client/src/components/TermCard.tsx',
    'client/src/components/CategoryCard.tsx',
    'client/src/components/EnhancedTermCard.tsx',

    // Heavy data components
    'client/src/components/term/RecommendedTerms.tsx',
    'client/src/components/term/TermRelationships.tsx',
    'client/src/components/sections/SectionLayoutManager.tsx',
    'client/src/components/landing/ContentPreview.tsx',

    // Search and filter components
    'client/src/components/search/AdvancedSearch.tsx',
    'client/src/components/AITermSuggestions.tsx',
  ],

  // Skip optimization for these (already optimized or incompatible)
  exclude: [
    // Interactive components that need full React features
    'client/src/components/interactive/*.tsx',
    // Form components
    'client/src/components/**/*Form*.tsx',
    // Modal/Dialog components
    'client/src/components/**/*Modal*.tsx',
  ],

  // Enable telemetry to track performance improvements
  telemetry: false,

  // Mute optimization logs in production
  mute: process.env.NODE_ENV === 'production',
};
