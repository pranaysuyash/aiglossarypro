#!/usr/bin/env tsx

import { readFile } from 'fs/promises';
import path from 'path';
// Note: Excel processing functionality has been removed
// import { AdvancedExcelParser } from '../server/advancedExcelParser';
import { enhancedStorage } from '../server/enhancedStorage';
import { log } from '../server/utils/logger';

async function importAllTerms() {
  console.log('🚀 Starting full import - Excel processing functionality has been removed\n');
  
  try {
    // Excel processing functionality has been removed
    console.log('⚠️  Excel processing functionality has been removed');
    console.log('This script is no longer functional and should be replaced with alternative data processing methods');
    
    // const filePath = path.join(process.cwd(), 'data', 'row1.xlsx');
    // const buffer = await readFile(filePath);
    
    // Initialize parser
    // const parser = new AdvancedExcelParser();
    
    // Parse with AI disabled for now (to speed up the process)
    // console.log('📊 Parsing Excel file with 295 columns...');
    // const parsedTerms = await parser.parseComplexExcel(
    //   buffer, 
    //   { 
    //     enableAI: false, 
    //     mode: 'none', 
    //     costOptimization: true 
    //   },
    //   'row1.xlsx'
    // );
    
    // console.log(`\n✅ Successfully parsed ${parsedTerms.length} terms\n`);
    
    // Mock empty array for now
    const parsedTerms: any[] = [];
    
    // Import each term
    for (let i = 0; i < parsedTerms.length; i++) {
      const term = parsedTerms[i];
      console.log(`\n📝 Importing term ${i + 1}/${parsedTerms.length}: ${term.name}`);
      
      try {
        // Create enhanced term
        const enhancedTerm = {
          term_id: crypto.randomUUID(),
          term_name: term.name,
          basic_definition: term.sections.get('Introduction')?.['Definition and Overview'] || '',
          technical_definition: term.sections.get('Theoretical Concepts')?.['Key Mathematical and Statistical Foundations'] || '',
          historical_context: term.sections.get('Introduction')?.['Brief History or Background'] || '',
          importance_in_ai: term.sections.get('Introduction')?.['Importance and Relevance in AI/ML'] || '',
          main_categories: term.categories.main || [],
          sub_categories: term.categories.sub || [],
          related_categories: term.categories.related || [],
          application_domains: term.categories.domains || [],
          techniques: term.categories.techniques || [],
          implementation_status: term.sections.get('Implementation')?.['Code Snippets or Pseudocode'] ? 'implemented' : 'theoretical',
          complexity_level: 'intermediate', // Default for now
          prerequisites: term.sections.get('Prerequisites')?.['Prior Knowledge or Skills Required']?.split(',') || [],
          related_terms: term.sections.get('Related Concepts')?.['Connection to Other AI/ML Terms or Topics']?.split(',') || [],
          metadata: {
            parsed_sections: Array.from(term.sections.keys()),
            total_sections: term.sections.size,
            has_interactive_elements: !!term.sections.get('Introduction')?.['Interactive Element: Mermaid Diagram'],
            has_code_examples: !!term.sections.get('Implementation')?.['Code Snippets or Pseudocode'],
            has_mathematical_content: !!term.sections.get('Theoretical Concepts')?.['Mathematical Derivations or Proofs'],
            last_updated: new Date().toISOString()
          }
        };
        
        // Store the enhanced term
        await enhancedStorage.createEnhancedTerm(enhancedTerm);
        
        // Store all sections
        let sectionCount = 0;
        for (const [sectionName, sectionContent] of term.sections) {
          if (sectionContent && Object.keys(sectionContent).length > 0) {
            await enhancedStorage.createTermSection({
              term_id: enhancedTerm.term_id,
              section_id: `${sectionName.toLowerCase().replace(/\s+/g, '_')}`,
              section_name: sectionName,
              content: sectionContent,
              display_type: term.displayData.mainContent[sectionName] ? 'main' : 
                           term.displayData.sidebarContent[sectionName] ? 'sidebar' :
                           term.displayData.filterData[sectionName] ? 'filter' : 'metadata',
              order_index: sectionCount++,
              is_required: ['Introduction', 'Prerequisites', 'How It Works'].includes(sectionName),
              version: 1
            });
          }
        }
        
        console.log(`  ✅ Imported with ${sectionCount} sections`);
        
        // Store interactive elements if any
        const mermaidDiagram = term.sections.get('Introduction')?.['Interactive Element: Mermaid Diagram'];
        if (mermaidDiagram) {
          await enhancedStorage.createInteractiveElement({
            term_id: enhancedTerm.term_id,
            element_type: 'mermaid_diagram',
            content: { diagram: mermaidDiagram },
            section_id: 'introduction',
            order_index: 0
          });
        }
        
        const codeSnippet = term.sections.get('Implementation')?.['Code Snippets or Pseudocode'];
        if (codeSnippet) {
          await enhancedStorage.createInteractiveElement({
            term_id: enhancedTerm.term_id,
            element_type: 'code_example',
            content: { code: codeSnippet, language: 'python' },
            section_id: 'implementation',
            order_index: 0
          });
        }
        
      } catch (error) {
        console.error(`  ❌ Error importing term ${term.name}:`, error);
      }
    }
    
    console.log('\n🎉 Import complete!');
    
    // Show summary
    const stats = await enhancedStorage.getEnhancedTermsStats();
    console.log('\n📊 Database Summary:');
    console.log(`  - Total enhanced terms: ${stats.totalTerms}`);
    console.log(`  - Total sections: ${stats.totalSections}`);
    console.log(`  - Interactive elements: ${stats.totalInteractiveElements}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Add missing import
import crypto from 'crypto';

// Run the import
importAllTerms().catch(console.error);