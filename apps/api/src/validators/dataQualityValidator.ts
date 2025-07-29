/**
 * Data Quality Validator
 * Prevents AI processing corruption and ensures data consistency
 */
import { SECTION_NAMES } from '../utils/constants';

import logger from '../utils/logger';
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore?: number;
}

interface CategoryData {
  name: string;
  description?: string;
}

interface TermData {
  name: string;
  definition?: string;
  category?: string;
  mainCategories?: string[];
  subCategories?: string[];
  sections?: { name: string; content: string }[];
}

export class DataQualityValidator {
  /**
   * Validate category name quality
   */
  static validateCategoryName(name: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Basic validation rules
    if (!name || name.trim().length === 0) {
      result.isValid = false;
      result.errors.push('Category name cannot be empty');
      return result;
    }

    // Length validation
    if (name.length > 50) {
      result.isValid = false;
      result.errors.push(
        `Category name too long (${name.length} chars). Max 50 characters allowed.`
      );
    }

    // Format validation
    if (name.includes('"') || name.includes("'")) {
      result.isValid = false;
      result.errors.push('Category name should not contain quotes');
    }

    if (name.includes('...')) {
      result.isValid = false;
      result.errors.push('Category name should not contain ellipsis (...)');
    }

    // AI processing artifacts
    const aiArtifacts = [
      'Main Category Tags',
      'Include',
      'The characteristic function belongs to',
      'Refers To',
      'Techniques:',
      'Falls Under The Broader Categories',
    ];

    for (const artifact of aiArtifacts) {
      if (name.includes(artifact)) {
        result.isValid = false;
        result.errors.push(`Category name contains AI processing artifact: "${artifact}"`);
      }
    }

    // Warning for unusual patterns
    if (name.match(/^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z]/)) {
      result.warnings.push('Category name has unusual capitalization pattern');
    }

    if (name.split(' ').length > 8) {
      result.warnings.push('Category name is very long (>8 words)');
    }

    return result;
  }

  /**
   * Validate term data quality
   */
  static validateTermData(term: TermData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Name validation
    if (!term.name || term.name.trim().length === 0) {
      result.isValid = false;
      result.errors.push('Term name cannot be empty');
      return result;
    }

    if (term.name.length > 200) {
      result.isValid = false;
      result.errors.push(`Term name too long (${term.name.length} chars). Max 200 characters.`);
    }

    // Definition validation
    if (term.definition && term.definition.length > 5000) {
      result.warnings.push(`Term definition is very long (${term.definition.length} chars)`);
    }

    // Category validation
    if (term.category) {
      const categoryValidation = DataQualityValidator.validateCategoryName(term.category);
      if (!categoryValidation.isValid) {
        result.isValid = false;
        result.errors.push(...categoryValidation.errors.map(e => `Category: ${e}`));
      }
      result.warnings.push(...categoryValidation.warnings.map(w => `Category: ${w}`));
    }

    // Array categories validation
    if (term.mainCategories) {
      for (const category of term.mainCategories) {
        const categoryValidation = DataQualityValidator.validateCategoryName(category);
        if (!categoryValidation.isValid) {
          result.warnings.push(`Main category "${category}" has quality issues`);
        }
      }
    }

    if (term.subCategories) {
      for (const category of term.subCategories) {
        const categoryValidation = DataQualityValidator.validateCategoryName(category);
        if (!categoryValidation.isValid) {
          result.warnings.push(`Sub category "${category}" has quality issues`);
        }
      }
    }
    
    const completeness = this.validateSectionCompleteness(term);
    result.errors.push(...completeness.errors);
    result.warnings.push(...completeness.warnings);
    result.qualityScore = this.calculateQualityScore(term);


    return result;
  }

  /**
   * Validate batch import data
   */
  static validateBatchData(categories: CategoryData[], terms: TermData[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    let validCategories = 0;
    let validTerms = 0;

    // Validate categories
    for (const category of categories) {
      const validation = DataQualityValidator.validateCategoryName(category.name);
      if (validation.isValid) {
        validCategories++;
      } else {
        result.errors.push(`Category "${category.name}": ${validation.errors.join(', ')}`);
      }
      result.warnings.push(...validation.warnings.map(w => `Category "${category.name}": ${w}`));
    }

    // Validate terms
    for (const term of terms) {
      const validation = DataQualityValidator.validateTermData(term);
      if (validation.isValid) {
        validTerms++;
      } else {
        result.errors.push(`Term "${term.name}": ${validation.errors.join(', ')}`);
      }
      result.warnings.push(...validation.warnings.map(w => `Term "${term.name}": ${w}`));
    }

    // Overall validation
    const categorySuccessRate = validCategories / categories.length;
    const termSuccessRate = validTerms / terms.length;

    if (categorySuccessRate < 0.8) {
      result.isValid = false;
      result.errors.push(
        `Category validation failure rate too high: ${((1 - categorySuccessRate) * 100).toFixed(1)}%`
      );
    }

    if (termSuccessRate < 0.9) {
      result.isValid = false;
      result.errors.push(
        `Term validation failure rate too high: ${((1 - termSuccessRate) * 100).toFixed(1)}%`
      );
    }

    result.warnings.push(
      `Validated ${validCategories}/${categories.length} categories (${(categorySuccessRate * 100).toFixed(1)}%)`
    );
    result.warnings.push(
      `Validated ${validTerms}/${terms.length} terms (${(termSuccessRate * 100).toFixed(1)}%)`
    );

    return result;
  }

  /**
   * Suggest category name fixes
   */
  static suggestCategoryFix(invalidName: string): string {
    let fixed = invalidName;

    // Remove quotes
    fixed = fixed.replace(/['"]/g, '');

    // Remove ellipsis
    fixed = fixed.replace(/\.\.\./g, '');

    // Remove AI artifacts
    fixed = fixed.replace(/^Main Category Tags (For|Include) /i, '');
    fixed = fixed.replace(/^Vector Db .+ Techniques: Main Category Tags Include /i, '');
    fixed = fixed.replace(/^.+ Falls Under The Broader Categories Of /i, '');
    fixed = fixed.replace(/^.+ Refers To .+/i, 'General Category');

    // Trim and capitalize properly
    fixed = fixed.trim();
    fixed = fixed
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Truncate if too long
    if (fixed.length > 50) {
      const words = fixed.split(' ');
      while (words.join(' ').length > 50 && words.length > 1) {
        words.pop();
      }
      fixed = words.join(' ');
    }

    return fixed || 'General Category';
  }

  /**
   * Pre-import validation hook
   */
  static async validateImportData(data: any): Promise<ValidationResult> {
    logger.info('🔍 Running data quality validation...');

    const result = DataQualityValidator.validateBatchData(data.categories || [], data.terms || []);

    if (!result.isValid) {
      logger.error('❌ Data validation failed:');
      result.errors.forEach(error => logger.error(`  - ${error}`));
    }

    if (result.warnings.length > 0) {
      logger.warn('⚠️  Data validation warnings:');
      result.warnings.slice(0, 10).forEach(warning => logger.warn(`  - ${warning}`));
      if (result.warnings.length > 10) {
        logger.warn(`  ... and ${result.warnings.length - 10} more warnings`);
      }
    }

    return result;
  }

  /**
   * Validates the completeness of the 42-section architecture for a term.
   * @param term The term data to validate.
   * @returns A `ValidationResult` object.
   */
  static validateSectionCompleteness(term: TermData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    const expectedSections = Object.values(SECTION_NAMES);
    const actualSections = term.sections?.map(s => s.name) || [];

    const missingSections = expectedSections.filter(s => !actualSections.includes(s));
    const extraSections = actualSections.filter(s => !expectedSections.includes(s));

    if (missingSections.length > 0) {
      result.warnings.push(`Missing ${missingSections.length} sections: ${missingSections.slice(0, 5).join(', ')}${missingSections.length > 5 ? '...' : ''}`);
    }

    if (extraSections.length > 0) {
      result.warnings.push(`Found ${extraSections.length} extra sections: ${extraSections.slice(0, 5).join(', ')}${extraSections.length > 5 ? '...' : ''}`);
    }
    
    if(missingSections.length > 21) {
        result.isValid = false;
        result.errors.push(`Term is missing more than half of the required sections.`);
    }

    return result;
  }

  /**
   * Calculates a quality score for a term based on various metrics.
   * @param term The term data to score.
   * @returns A quality score from 0 to 100.
   */
  static calculateQualityScore(term: TermData): number {
    let score = 0;

    // Definition quality (40 points)
    if (term.definition) {
      if (term.definition.length > 200) {
        score += 25;
      } else if (term.definition.length > 100) {
        score += 15;
      } else if (term.definition.length > 50) {
        score += 10;
      }
    }

    // Categorization (20 points)
    if (term.mainCategories && term.mainCategories.length > 0) {
      score += 15;
    }
    if (term.subCategories && term.subCategories.length > 0) {
      score += 5;
    }

    // Section completeness (40 points)
    const expectedSections = Object.values(SECTION_NAMES).length;
    const actualSections = term.sections?.length || 0;
    const completenessRatio = Math.min(1, actualSections / expectedSections);
    score += completenessRatio * 40;

    return Math.min(score, 100);
  }
}

export default DataQualityValidator;