/**
 * Content Gap Analysis Script
 *
 * Analyzes the current content database to identify gaps and missing definitions
 * for the 38% of terms that need completion.
 */

import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

interface TermData {
  name: string;
  shortDefinition?: string;
  fullDefinition?: string;
  categories: string[];
  hasImplementation: boolean;
  hasCodeExamples: boolean;
  hasInteractiveElements: boolean;
  completeness: number;
  sectionsPopulated: number;
  totalSections: number;
  missingCriticalSections: string[];
  qualityScore: number;
}

interface ContentGaps {
  missingDefinitions: string[];
  missingShortDefinitions: string[];
  uncategorizedTerms: string[];
  lowQualityTerms: string[];
  missingCodeExamples: string[];
  missingInteractiveElements: string[];
  totalTerms: number;
  completedTerms: number;
  gapPercentage: number;
}

export class ContentGapAnalyzer {
  private dataPath: string;
  private outputPath: string;
  private criticalSections = [
    'Introduction – Definition and Overview',
    'Introduction – Key Concepts and Principles',
    'How It Works – Step-by-Step Explanation of the Process',
    'Applications – Real-world Use Cases and Examples',
    'Implementation – Code Snippets or Pseudocode',
    'Advantages and Disadvantages – Strengths and Benefits',
    'Related Concepts – Connection to Other AI/ML Terms or Topics',
  ];

  constructor(dataPath?: string, outputPath?: string) {
    this.dataPath = dataPath || path.join(process.cwd(), 'data', 'test_sample.csv');
    this.outputPath = outputPath || path.join(process.cwd(), 'content-analysis');
  }

  async analyzeContentGaps(): Promise<ContentGaps> {
    console.log('🔍 Starting content gap analysis...');
    const startTime = performance.now();

    const terms = await this.loadTermsData();
    const gaps = this.identifyGaps(terms);

    await this.generateReports(gaps, terms);

    const endTime = performance.now();
    console.log(`✅ Analysis completed in ${((endTime - startTime) / 1000).toFixed(2)}s`);

    return gaps;
  }

  private async loadTermsData(): Promise<TermData[]> {
    return new Promise((resolve, reject) => {
      const terms: TermData[] = [];

      fs.createReadStream(this.dataPath)
        .pipe(csvParser())
        .on('data', row => {
          const termData = this.parseTermRow(row);
          terms.push(termData);
        })
        .on('end', () => {
          console.log(`📊 Loaded ${terms.length} terms from CSV`);
          resolve(terms);
        })
        .on('error', reject);
    });
  }

  private parseTermRow(row: any): TermData {
    const name = row['Term'] || '';
    const sections = Object.keys(row).filter(key => key !== 'Term');

    let sectionsPopulated = 0;
    let hasCodeExamples = false;
    let hasInteractiveElements = false;
    const missingCriticalSections: string[] = [];

    // Analyze each section
    sections.forEach(sectionName => {
      const content = row[sectionName]?.trim();
      if (content && content.length > 10) {
        sectionsPopulated++;

        // Check for code examples
        if (sectionName.includes('Code') || sectionName.includes('Implementation')) {
          hasCodeExamples = true;
        }

        // Check for interactive elements
        if (sectionName.includes('Interactive Element')) {
          hasInteractiveElements = true;
        }
      } else if (this.criticalSections.includes(sectionName)) {
        missingCriticalSections.push(sectionName);
      }
    });

    const completeness = sections.length > 0 ? (sectionsPopulated / sections.length) * 100 : 0;
    const qualityScore = this.calculateQualityScore(row, sectionsPopulated, sections.length);

    // Extract categories from the structured content
    const mainCategory =
      row['Introduction – Category and Sub-category of the Term – Main Category'] || '';
    const subCategory =
      row['Introduction – Category and Sub-category of the Term – Sub-category'] || '';
    const categories = [mainCategory, subCategory].filter(cat => cat?.trim());

    return {
      name,
      shortDefinition: row['Introduction – Definition and Overview']?.substring(0, 250),
      fullDefinition: row['Introduction – Definition and Overview'],
      categories,
      hasImplementation: this.hasImplementationContent(row),
      hasCodeExamples,
      hasInteractiveElements,
      completeness,
      sectionsPopulated,
      totalSections: sections.length,
      missingCriticalSections,
      qualityScore,
    };
  }

  private calculateQualityScore(
    row: any,
    sectionsPopulated: number,
    totalSections: number
  ): number {
    let score = 0;

    // Base score from completeness
    score += (sectionsPopulated / totalSections) * 40;

    // Quality indicators
    const definitionQuality = this.assessDefinitionQuality(
      row['Introduction – Definition and Overview']
    );
    score += definitionQuality * 20;

    // Has examples
    if (this.hasImplementationContent(row)) {score += 15;}

    // Has case studies
    if (row['Case Studies – In-depth Analysis of Real-world Applications']?.trim()) {score += 10;}

    // Has proper categorization
    const mainCat =
      row['Introduction – Category and Sub-category of the Term – Main Category']?.trim();
    if (mainCat) {score += 10;}

    // Interactive elements
    const interactiveSections = Object.keys(row).filter(
      key => key.includes('Interactive Element') && row[key]?.trim()
    );
    score += Math.min(interactiveSections.length * 2, 5);

    return Math.min(score, 100);
  }

  private assessDefinitionQuality(definition: string): number {
    if (!definition || definition.trim().length < 50) {return 0;}

    let quality = 0.5; // Base quality

    // Length check
    if (definition.length > 200) {quality += 0.2;}

    // Contains technical terms
    const technicalWords = ['algorithm', 'model', 'function', 'method', 'technique', 'process'];
    const hasTechnicalTerms = technicalWords.some(word => definition.toLowerCase().includes(word));
    if (hasTechnicalTerms) {quality += 0.2;}

    // Well structured (contains multiple sentences)
    const sentenceCount = definition.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    if (sentenceCount >= 3) {quality += 0.1;}

    return Math.min(quality, 1);
  }

  private hasImplementationContent(row: any): boolean {
    const implementationSections = [
      'Implementation – Code Snippets or Pseudocode',
      'Implementation – Popular Programming Languages and Libraries',
      'Hands-on Tutorials – Step-by-Step Guides for Implementing Techniques',
    ];

    return implementationSections.some(
      section => row[section]?.trim() && row[section].trim().length > 20
    );
  }

  private identifyGaps(terms: TermData[]): ContentGaps {
    const gaps: ContentGaps = {
      missingDefinitions: [],
      missingShortDefinitions: [],
      uncategorizedTerms: [],
      lowQualityTerms: [],
      missingCodeExamples: [],
      missingInteractiveElements: [],
      totalTerms: terms.length,
      completedTerms: 0,
      gapPercentage: 0,
    };

    terms.forEach(term => {
      // Missing definitions
      if (!term.fullDefinition || term.fullDefinition.trim().length < 100) {
        gaps.missingDefinitions.push(term.name);
      }

      // Missing short definitions
      if (!term.shortDefinition || term.shortDefinition.trim().length < 50) {
        gaps.missingShortDefinitions.push(term.name);
      }

      // Uncategorized terms
      if (term.categories.length === 0) {
        gaps.uncategorizedTerms.push(term.name);
      }

      // Low quality terms (less than 60% complete or low quality score)
      if (term.completeness < 60 || term.qualityScore < 60) {
        gaps.lowQualityTerms.push(term.name);
      }

      // Missing code examples for technical terms
      if (!term.hasCodeExamples && this.isTechnicalTerm(term.name)) {
        gaps.missingCodeExamples.push(term.name);
      }

      // Missing interactive elements
      if (!term.hasInteractiveElements) {
        gaps.missingInteractiveElements.push(term.name);
      }

      // Count completed terms (80%+ complete and quality score > 70)
      if (term.completeness >= 80 && term.qualityScore >= 70) {
        gaps.completedTerms++;
      }
    });

    gaps.gapPercentage = ((gaps.totalTerms - gaps.completedTerms) / gaps.totalTerms) * 100;

    return gaps;
  }

  private isTechnicalTerm(termName: string): boolean {
    const technicalKeywords = [
      'algorithm',
      'network',
      'model',
      'learning',
      'neural',
      'deep',
      'machine',
      'classification',
      'regression',
      'clustering',
      'optimization',
      'function',
    ];

    return technicalKeywords.some(keyword => termName.toLowerCase().includes(keyword));
  }

  private async generateReports(gaps: ContentGaps, terms: TermData[]): Promise<void> {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }

    // Generate summary report
    const summaryReport = this.generateSummaryReport(gaps);
    fs.writeFileSync(
      path.join(this.outputPath, 'content-gap-summary.json'),
      JSON.stringify(summaryReport, null, 2)
    );

    // Generate detailed term analysis
    const termAnalysis = terms.map(term => ({
      name: term.name,
      completeness: term.completeness,
      qualityScore: term.qualityScore,
      sectionsPopulated: term.sectionsPopulated,
      totalSections: term.totalSections,
      missingCriticalSections: term.missingCriticalSections,
      categories: term.categories,
      hasCodeExamples: term.hasCodeExamples,
      hasInteractiveElements: term.hasInteractiveElements,
    }));

    fs.writeFileSync(
      path.join(this.outputPath, 'detailed-term-analysis.json'),
      JSON.stringify(termAnalysis, null, 2)
    );

    // Generate priority action list
    const priorityActions = this.generatePriorityActions(gaps, terms);
    fs.writeFileSync(
      path.join(this.outputPath, 'priority-actions.json'),
      JSON.stringify(priorityActions, null, 2)
    );

    console.log(`📄 Reports generated in: ${this.outputPath}`);
  }

  private generateSummaryReport(gaps: ContentGaps) {
    return {
      overview: {
        totalTerms: gaps.totalTerms,
        completedTerms: gaps.completedTerms,
        gapPercentage: Math.round(gaps.gapPercentage * 100) / 100,
        completionRate: Math.round((gaps.completedTerms / gaps.totalTerms) * 100 * 100) / 100,
      },
      criticalGaps: {
        missingDefinitions: {
          count: gaps.missingDefinitions.length,
          percentage: Math.round((gaps.missingDefinitions.length / gaps.totalTerms) * 100),
        },
        missingShortDefinitions: {
          count: gaps.missingShortDefinitions.length,
          percentage: Math.round((gaps.missingShortDefinitions.length / gaps.totalTerms) * 100),
        },
        uncategorizedTerms: {
          count: gaps.uncategorizedTerms.length,
          percentage: Math.round((gaps.uncategorizedTerms.length / gaps.totalTerms) * 100),
        },
        lowQualityTerms: {
          count: gaps.lowQualityTerms.length,
          percentage: Math.round((gaps.lowQualityTerms.length / gaps.totalTerms) * 100),
        },
      },
      enhancementOpportunities: {
        missingCodeExamples: {
          count: gaps.missingCodeExamples.length,
          percentage: Math.round((gaps.missingCodeExamples.length / gaps.totalTerms) * 100),
        },
        missingInteractiveElements: {
          count: gaps.missingInteractiveElements.length,
          percentage: Math.round((gaps.missingInteractiveElements.length / gaps.totalTerms) * 100),
        },
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private generatePriorityActions(gaps: ContentGaps, terms: TermData[]) {
    // Sort terms by priority (lowest quality score first)
    const sortedTerms = terms
      .filter(term => term.qualityScore < 70)
      .sort((a, b) => a.qualityScore - b.qualityScore);

    return {
      highPriority: {
        description: 'Terms requiring immediate attention (quality score < 40)',
        terms: sortedTerms
          .filter(term => term.qualityScore < 40)
          .slice(0, 20)
          .map(term => ({
            name: term.name,
            qualityScore: term.qualityScore,
            issues: this.identifyTermIssues(term),
          })),
      },
      mediumPriority: {
        description: 'Terms needing improvement (quality score 40-69)',
        terms: sortedTerms
          .filter(term => term.qualityScore >= 40 && term.qualityScore < 70)
          .slice(0, 30)
          .map(term => ({
            name: term.name,
            qualityScore: term.qualityScore,
            issues: this.identifyTermIssues(term),
          })),
      },
      quickWins: {
        description: 'Terms close to completion (quality score 70-79)',
        terms: terms
          .filter(term => term.qualityScore >= 70 && term.qualityScore < 80)
          .slice(0, 20)
          .map(term => ({
            name: term.name,
            qualityScore: term.qualityScore,
            issues: this.identifyTermIssues(term),
          })),
      },
    };
  }

  private identifyTermIssues(term: TermData): string[] {
    const issues: string[] = [];

    if (!term.fullDefinition || term.fullDefinition.length < 100) {
      issues.push('Missing or inadequate definition');
    }

    if (term.categories.length === 0) {
      issues.push('Missing categorization');
    }

    if (term.missingCriticalSections.length > 0) {
      issues.push(`Missing critical sections: ${term.missingCriticalSections.length}`);
    }

    if (!term.hasCodeExamples && this.isTechnicalTerm(term.name)) {
      issues.push('Missing code examples');
    }

    if (!term.hasInteractiveElements) {
      issues.push('Missing interactive elements');
    }

    if (term.completeness < 50) {
      issues.push('Low section completion rate');
    }

    return issues;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new ContentGapAnalyzer();

  analyzer
    .analyzeContentGaps()
    .then(gaps => {
      console.log('\n📊 Content Gap Analysis Summary:');
      console.log(`Total Terms: ${gaps.totalTerms}`);
      console.log(`Completed Terms: ${gaps.completedTerms}`);
      console.log(`Gap Percentage: ${gaps.gapPercentage.toFixed(1)}%`);
      console.log(`Missing Definitions: ${gaps.missingDefinitions.length}`);
      console.log(`Uncategorized Terms: ${gaps.uncategorizedTerms.length}`);
      console.log(`Low Quality Terms: ${gaps.lowQualityTerms.length}`);
    })
    .catch(console.error);
}

export default ContentGapAnalyzer;
