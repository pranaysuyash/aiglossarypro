// Note: Excel processing functionality has been removed
// import { AdvancedExcelParser, type ParsedTerm } from './advancedExcelParser';

import { ContentOrganizer } from './displayCategorization';

// Define ParsedTerm type locally since it's no longer imported
interface ParsedTerm {
  name: string;
  sections: Map<string, any>;
  categories: {
    main: string[];
    sub: string[];
    related: string[];
    domains: string[];
    techniques: string[];
  };
  parseHash: string;
}
import { 
  enhancedTerms, 
  termSections, 
  interactiveElements, 
  termRelationships,
  displayConfigs 
} from '../shared/enhancedSchema';
import { db } from './db';
import { eq } from 'drizzle-orm';

interface TransformedTermData {
  enhancedTerm: any;
  sections: any[];
  interactiveElements: any[];
  relationships: any[];
  displayConfig: any;
}

export class DataTransformationPipeline {
  // private parser: AdvancedExcelParser;

  constructor() {
    // Excel processing functionality has been removed
    // this.parser = new AdvancedExcelParser();
  }

  /**
   * Complete pipeline: Parse Excel → Transform → Save to Database
   * Note: Excel processing functionality has been removed
   */
  async processExcelFile(buffer: Buffer): Promise<{
    processed: number;
    cached: number;
    errors: string[];
  }> {
    console.log('⚠️  Excel processing functionality has been removed');
    
    // Step 1: Parse the complex Excel structure
    // const parsedTerms = await this.parser.parseComplexExcel(buffer);
    // console.log(`Parsed ${parsedTerms.length} terms from Excel`);

    // Mock empty array for now
    const parsedTerms: ParsedTerm[] = [];

    // Step 2: Transform parsed data for database storage
    const transformedData = await this.transformParsedData(parsedTerms);
    console.log(`Transformed ${transformedData.length} terms for database`);

    // Step 3: Save to database
    const results = await this.saveToDatabase(transformedData);
    
    return {
      processed: results.success,
      cached: results.cached,
      errors: ['Excel processing functionality has been removed']
    };
  }

  /**
   * Transform parsed terms into database-ready format
   */
  private async transformParsedData(parsedTerms: ParsedTerm[]): Promise<TransformedTermData[]> {
    const transformedData: TransformedTermData[] = [];

    for (const parsedTerm of parsedTerms) {
      try {
        const transformed = await this.transformSingleTerm(parsedTerm);
        transformedData.push(transformed);
      } catch (error) {
        console.error(`Error transforming term ${parsedTerm.name}:`, error);
      }
    }

    return transformedData;
  }

  /**
   * Transform a single parsed term
   */
  private async transformSingleTerm(parsedTerm: ParsedTerm): Promise<TransformedTermData> {
    // Generate URL-friendly slug
    const slug = this.generateSlug(parsedTerm.name);

    // Extract search text from all sections
    const searchText = ContentOrganizer.extractSearchData(parsedTerm.sections);

    // Determine difficulty level and features
    const difficultyLevel = this.determineDifficultyLevel(parsedTerm.sections);
    const hasImplementation = parsedTerm.sections.has('Implementation');
    const hasInteractiveElements = this.hasInteractiveElements(parsedTerm.sections);
    const hasCaseStudies = parsedTerm.sections.has('Case Studies');
    const hasCodeExamples = this.hasCodeExamples(parsedTerm.sections);

    // Create enhanced term record
    const enhancedTerm = {
      name: parsedTerm.name,
      slug,
      shortDefinition: this.extractShortDefinition(parsedTerm.sections),
      fullDefinition: this.extractFullDefinition(parsedTerm.sections),
      mainCategories: parsedTerm.categories.main,
      subCategories: parsedTerm.categories.sub,
      relatedConcepts: parsedTerm.categories.related,
      applicationDomains: parsedTerm.categories.domains,
      techniques: parsedTerm.categories.techniques,
      difficultyLevel,
      hasImplementation,
      hasInteractiveElements,
      hasCaseStudies,
      hasCodeExamples,
      searchText,
      keywords: this.extractKeywords(searchText),
      parseHash: parsedTerm.parseHash,
      parseVersion: '1.0'
    };

    // Create section records
    const sections = this.createSectionRecords(parsedTerm);

    // Create interactive element records
    const interactiveElements = this.extractInteractiveElements(parsedTerm);

    // Create relationship records (for related concepts)
    const relationships = this.createRelationshipRecords(parsedTerm);

    // Create display configuration
    const displayConfig = this.createDisplayConfig(parsedTerm);

    return {
      enhancedTerm,
      sections,
      interactiveElements,
      relationships,
      displayConfig
    };
  }

  /**
   * Create section records for database storage
   */
  private createSectionRecords(parsedTerm: ParsedTerm): any[] {
    const sections: any[] = [];

    for (const [sectionName, sectionData] of parsedTerm.sections) {
      // Determine display type and priority from configuration
      const displayType = this.getDisplayType(sectionName);
      const priority = this.getSectionPriority(sectionName);
      const isInteractive = this.sectionHasInteractiveElements(sectionData);

      sections.push({
        sectionName,
        sectionData,
        displayType,
        priority,
        isInteractive
      });
    }

    return sections;
  }

  /**
   * Extract interactive elements from sections
   */
  private extractInteractiveElements(parsedTerm: ParsedTerm): any[] {
    const elements: any[] = [];
    let displayOrder = 0;

    for (const [sectionName, sectionData] of parsedTerm.sections) {
      // Look for interactive elements in the section data
      if (typeof sectionData === 'object') {
        const dataStr = JSON.stringify(sectionData);
        
        // Mermaid diagrams
        if (dataStr.includes('graph TD') || dataStr.includes('flowchart')) {
          elements.push({
            sectionName,
            elementType: 'mermaid',
            elementData: this.extractMermaidData(sectionData),
            displayOrder: displayOrder++,
            isActive: true
          });
        }

        // Quiz elements
        if (dataStr.toLowerCase().includes('quiz') || dataStr.toLowerCase().includes('question')) {
          elements.push({
            sectionName,
            elementType: 'quiz',
            elementData: this.extractQuizData(sectionData),
            displayOrder: displayOrder++,
            isActive: true
          });
        }

        // Code examples
        if (dataStr.includes('```') || dataStr.toLowerCase().includes('code')) {
          elements.push({
            sectionName,
            elementType: 'code',
            elementData: this.extractCodeData(sectionData),
            displayOrder: displayOrder++,
            isActive: true
          });
        }

        // Interactive demos
        if (dataStr.toLowerCase().includes('demo') || dataStr.toLowerCase().includes('interactive')) {
          elements.push({
            sectionName,
            elementType: 'demo',
            elementData: this.extractDemoData(sectionData),
            displayOrder: displayOrder++,
            isActive: true
          });
        }
      }
    }

    return elements;
  }

  /**
   * Create relationship records for related concepts
   */
  private createRelationshipRecords(parsedTerm: ParsedTerm): any[] {
    const relationships: any[] = [];

    // For now, just create placeholder relationships for related concepts
    // In a full implementation, you'd match these against existing terms
    parsedTerm.categories.related.forEach(relatedConcept => {
      relationships.push({
        // fromTermId will be set after term creation
        // toTermId will need to be resolved from related concept name
        relationshipType: 'related',
        strength: 5,
        relatedConceptName: relatedConcept // Store name for later resolution
      });
    });

    return relationships;
  }

  /**
   * Create display configuration for the term
   */
  private createDisplayConfig(parsedTerm: ParsedTerm): any {
    return {
      configType: 'default',
      layout: {
        cardContent: ContentOrganizer.organizeForCard(parsedTerm.sections),
        sidebarContent: ContentOrganizer.organizeForSidebar(parsedTerm.sections),
        mainContent: ContentOrganizer.organizeForMain(parsedTerm.sections),
        modalContent: ContentOrganizer.organizeForModal(parsedTerm.sections),
        filterData: ContentOrganizer.extractFilterData(parsedTerm.sections, parsedTerm.categories)
      },
      isDefault: true
    };
  }

  /**
   * Save transformed data to database
   */
  private async saveToDatabase(transformedData: TransformedTermData[]): Promise<{
    success: number;
    cached: number;
    errors: string[];
  }> {
    let success = 0;
    let cached = 0;
    const errors: string[] = [];

    for (const data of transformedData) {
      try {
        // Check if term already exists with same parse hash
        const existingTerm = await db.select()
          .from(enhancedTerms)
          .where(eq(enhancedTerms.name, data.enhancedTerm.name));

        if (existingTerm.length > 0 && existingTerm[0].parseHash === data.enhancedTerm.parseHash) {
          console.log(`Term ${data.enhancedTerm.name} unchanged, using cached version`);
          cached++;
          continue;
        }

        // Insert or update term
        let termId: string;
        
        if (existingTerm.length > 0) {
          // Update existing term
          const [updatedTerm] = await db.update(enhancedTerms)
            .set(data.enhancedTerm)
            .where(eq(enhancedTerms.id, existingTerm[0].id))
            .returning();
          
          termId = updatedTerm.id;
          
          // Delete existing sections and related data
          await this.cleanupExistingData(termId);
        } else {
          // Insert new term
          const [newTerm] = await db.insert(enhancedTerms)
            .values(data.enhancedTerm)
            .returning();
          
          termId = newTerm.id;
        }

        // Insert sections
        for (const section of data.sections) {
          await db.insert(termSections)
            .values({
              termId,
              ...section
            });
        }

        // Insert interactive elements
        for (const element of data.interactiveElements) {
          await db.insert(interactiveElements)
            .values({
              termId,
              ...element
            });
        }

        // Insert display config
        await db.insert(displayConfigs)
          .values({
            termId,
            ...data.displayConfig
          });

        // Note: Relationships will need to be created in a second pass
        // after all terms are inserted (to resolve related concept names to IDs)

        success++;
        console.log(`Successfully saved term: ${data.enhancedTerm.name}`);

      } catch (error) {
        const errorMsg = `Error saving term ${data.enhancedTerm.name}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return { success, cached, errors };
  }

  /**
   * Clean up existing data when updating a term
   */
  private async cleanupExistingData(termId: string): Promise<void> {
    // Delete existing sections, interactive elements, and display configs
    // The foreign key constraints will handle cascading deletes
    await db.delete(termSections).where(eq(termSections.termId, termId));
    await db.delete(interactiveElements).where(eq(interactiveElements.termId, termId));
    await db.delete(displayConfigs).where(eq(displayConfigs.termId, termId));
  }

  // Helper methods for data extraction and transformation

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private extractShortDefinition(sections: Map<string, any>): string {
    const intro = sections.get('Introduction');
    if (intro && intro.definition_and_overview) {
      const content = intro.definition_and_overview.content || intro.definition_and_overview;
      return typeof content === 'string' ? content.substring(0, 200) + '...' : '';
    }
    return '';
  }

  private extractFullDefinition(sections: Map<string, any>): string {
    const intro = sections.get('Introduction');
    if (intro && intro.definition_and_overview) {
      return intro.definition_and_overview.content || intro.definition_and_overview || '';
    }
    return '';
  }

  private extractKeywords(searchText: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = searchText.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|has|did)$/.test(word));
    
    return [...new Set(words)].slice(0, 20); // Top 20 unique keywords
  }

  private determineDifficultyLevel(sections: Map<string, any>): string {
    let score = 0;
    
    if (sections.has('Prerequisites')) score += 1;
    if (sections.has('Theoretical Concepts')) score += 2;
    if (sections.has('Implementation')) score += 1;
    if (sections.has('Mathematical Derivations')) score += 2;
    
    if (score >= 5) return 'Expert';
    if (score >= 3) return 'Advanced';
    if (score >= 1) return 'Intermediate';
    return 'Beginner';
  }

  private hasInteractiveElements(sections: Map<string, any>): boolean {
    for (const [_, sectionData] of sections) {
      if (this.sectionHasInteractiveElements(sectionData)) {
        return true;
      }
    }
    return false;
  }

  private hasCodeExamples(sections: Map<string, any>): boolean {
    const impl = sections.get('Implementation');
    if (impl) {
      const dataStr = JSON.stringify(impl);
      return dataStr.includes('```') || dataStr.toLowerCase().includes('code');
    }
    return false;
  }

  private sectionHasInteractiveElements(sectionData: any): boolean {
    if (typeof sectionData === 'object') {
      const dataStr = JSON.stringify(sectionData).toLowerCase();
      return dataStr.includes('interactive') || 
             dataStr.includes('mermaid') || 
             dataStr.includes('quiz') || 
             dataStr.includes('demo');
    }
    return false;
  }

  private getDisplayType(sectionName: string): string {
    const displayMapping: Record<string, string> = {
      'Introduction': 'main',
      'Categories': 'filter',
      'Prerequisites': 'sidebar',
      'Quick Quiz': 'sidebar',
      'Did You Know?': 'sidebar',
      'Theoretical Concepts': 'main',
      'Implementation': 'main',
      'Applications': 'main',
      'Historical Context': 'modal',
      'Case Studies': 'modal',
      'Metadata': 'metadata'
    };
    
    return displayMapping[sectionName] || 'main';
  }

  private getSectionPriority(sectionName: string): number {
    const priorityMapping: Record<string, number> = {
      'Introduction': 10,
      'How It Works': 9,
      'Theoretical Concepts': 8,
      'Implementation': 7,
      'Applications': 7,
      'Prerequisites': 6,
      'Historical Context': 4,
      'Case Studies': 6
    };
    
    return priorityMapping[sectionName] || 5;
  }

  private extractMermaidData(sectionData: any): any {
    // Extract Mermaid diagram data
    const dataStr = JSON.stringify(sectionData);
    const mermaidMatch = dataStr.match(/graph TD[\s\S]*?(?="|$)/);
    
    return {
      type: 'mermaid',
      diagram: mermaidMatch ? mermaidMatch[0] : '',
      title: 'Interactive Diagram'
    };
  }

  private extractQuizData(sectionData: any): any {
    // Extract quiz/question data
    return {
      type: 'quiz',
      questions: [], // Would parse actual questions from the data
      title: 'Quick Quiz'
    };
  }

  private extractCodeData(sectionData: any): any {
    // Extract code examples
    const dataStr = JSON.stringify(sectionData);
    const codeMatches = dataStr.match(/```[\s\S]*?```/g) || [];
    
    return {
      type: 'code',
      examples: codeMatches.map(code => ({
        language: 'python', // Default, could be detected
        code: code.replace(/```/g, ''),
        title: 'Code Example'
      }))
    };
  }

  private extractDemoData(sectionData: any): any {
    // Extract demo/interactive content
    return {
      type: 'demo',
      url: '', // Would extract actual URL if present
      title: 'Interactive Demo',
      description: 'Interactive demonstration of the concept'
    };
  }
}

// Export function for use in API routes
// Note: Excel processing functionality has been removed
export async function processExcelUpload(buffer: Buffer) {
  console.log('⚠️  Excel processing functionality has been removed');
  const pipeline = new DataTransformationPipeline();
  return await pipeline.processExcelFile(buffer);
}