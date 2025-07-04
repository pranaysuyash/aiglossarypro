#!/usr/bin/env tsx

/**
 * Landing Page Spacing Fix Script
 * 
 * Standardizes spacing across all landing page sections for consistent layout
 */

import fs from 'fs/promises';
import path from 'path';

const LANDING_COMPONENTS_DIR = 'client/src/components/landing';

// Standard spacing patterns for different section types
const SPACING_PATTERNS = {
  // Main sections (Hero, ValueProp, WhatYouGet, etc.)
  mainSection: 'py-16 sm:py-20 lg:py-24',
  
  // Alternate background sections  
  alternateSection: 'py-16 sm:py-20 lg:py-24 bg-gray-50',
  
  // Special sections (pricing, final CTA)
  specialSection: 'py-20 sm:py-24 lg:py-28',
  
  // Container padding
  containerPadding: 'px-4 sm:px-6 lg:px-8',
  
  // Max width container
  maxWidthContainer: 'max-w-7xl mx-auto',
  
  // Section content spacing
  sectionContent: 'space-y-12 sm:space-y-16 lg:space-y-20',
  
  // Header margins
  sectionHeader: 'text-center mb-12 sm:mb-16 lg:mb-20',
  
  // Grid gaps
  gridGap: 'gap-8 sm:gap-12 lg:gap-16'
};

interface SpacingFix {
  file: string;
  pattern: RegExp;
  replacement: string;
  description: string;
}

const SPACING_FIXES: SpacingFix[] = [
  // Hero Section
  {
    file: 'HeroSection.tsx',
    pattern: /className="[^"]*py-\d+[^"]*"/g,
    replacement: `className="relative ${SPACING_PATTERNS.mainSection} ${SPACING_PATTERNS.containerPadding} overflow-hidden"`,
    description: 'Standardize hero section spacing'
  },
  
  // Value Proposition
  {
    file: 'ValueProposition.tsx', 
    pattern: /className="[^"]*py-\d+[^"]*"/g,
    replacement: `className="${SPACING_PATTERNS.alternateSection} ${SPACING_PATTERNS.containerPadding}"`,
    description: 'Standardize value proposition spacing'
  },
  
  // What You Get
  {
    file: 'WhatYouGet.tsx',
    pattern: /className="[^"]*py-\d+[^"]*"/g, 
    replacement: `className="${SPACING_PATTERNS.mainSection} ${SPACING_PATTERNS.containerPadding}"`,
    description: 'Standardize what you get section spacing'
  },
  
  // Content Preview
  {
    file: 'ContentPreview.tsx',
    pattern: /className="[^"]*py-\d+[^"]*"/g,
    replacement: `className="${SPACING_PATTERNS.alternateSection} ${SPACING_PATTERNS.containerPadding}"`,
    description: 'Standardize content preview spacing'
  },
  
  // Social Proof
  {
    file: 'SocialProof.tsx',
    pattern: /className="[^"]*py-\d+[^"]*"/g,
    replacement: `className="${SPACING_PATTERNS.mainSection} ${SPACING_PATTERNS.containerPadding}"`,
    description: 'Standardize social proof spacing'
  },
  
  // FAQ
  {
    file: 'FAQ.tsx',
    pattern: /className="[^"]*py-\d+[^"]*"/g,
    replacement: `className="${SPACING_PATTERNS.alternateSection} ${SPACING_PATTERNS.containerPadding}"`,
    description: 'Standardize FAQ section spacing'
  },
  
  // Final CTA
  {
    file: 'FinalCTA.tsx',
    pattern: /className="[^"]*py-\d+[^"]*"/g,
    replacement: `className="${SPACING_PATTERNS.specialSection} ${SPACING_PATTERNS.containerPadding} bg-gradient-to-br from-purple-700 to-purple-900"`,
    description: 'Standardize final CTA spacing'
  }
];

async function applySpacingFixes() {
  console.log('🎨 Applying landing page spacing fixes...\n');
  
  for (const fix of SPACING_FIXES) {
    const filePath = path.join(LANDING_COMPONENTS_DIR, fix.file);
    
    try {
      // Check if file exists
      const content = await fs.readFile(filePath, 'utf8');
      
      // Apply the fix
      const updatedContent = content.replace(fix.pattern, fix.replacement);
      
      if (content !== updatedContent) {
        await fs.writeFile(filePath, updatedContent);
        console.log(`✅ ${fix.description} - ${fix.file}`);
      } else {
        console.log(`⏭️  No changes needed - ${fix.file}`);
      }
      
    } catch (error) {
      console.log(`⚠️  File not found or error - ${fix.file}`);
    }
  }
  
  console.log('\n🎉 Spacing fixes completed!');
}

// Run the fixes
applySpacingFixes().catch(console.error);