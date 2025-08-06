/**
 * Type conversion utilities to handle database null/undefined mismatches
 */

import type { Term } from '../types/storage.types';

/**
 * Convert database term result to Term type
 * Handles null to undefined conversions for optional fields
 */
export function dbTermToTerm(dbTerm: any): Term {
  return {
    id: dbTerm.id,
    name: dbTerm.name,
    definition: dbTerm.definition,
    shortDefinition: dbTerm.shortDefinition ?? undefined,
    category: dbTerm.category || '',
    categoryId: dbTerm.categoryId ?? undefined,
    subcategories: dbTerm.subcategories ?? undefined,
    subcategoryIds: dbTerm.subcategoryIds ?? undefined,
    viewCount: dbTerm.viewCount || 0,
    isFavorite: dbTerm.isFavorite ?? undefined,
    isLearned: dbTerm.isLearned ?? undefined,
    createdAt: dbTerm.createdAt ?? undefined,
    updatedAt: dbTerm.updatedAt ?? undefined,
    relativeTime: dbTerm.relativeTime ?? undefined,
    characteristics: dbTerm.characteristics ?? undefined,
    visualUrl: dbTerm.visualUrl ?? undefined,
    visualCaption: dbTerm.visualCaption ?? undefined,
    mathFormulation: dbTerm.mathFormulation ?? undefined,
    relatedTerms: dbTerm.relatedTerms ?? undefined,
    difficulty: dbTerm.difficulty ?? undefined,
    isAiGenerated: dbTerm.isAiGenerated ?? undefined,
    verificationStatus: dbTerm.verificationStatus ?? undefined,
    aiModel: dbTerm.aiModel ?? undefined,
    confidenceLevel: dbTerm.confidenceLevel ?? undefined,
    lastReviewed: dbTerm.lastReviewed ?? undefined,
    expertReviewRequired: dbTerm.expertReviewRequired ?? undefined,
  };
}

/**
 * Convert array of database terms to Term array
 */
export function dbTermsToTerms(dbTerms: any[]): Term[] {
  return dbTerms.map(dbTermToTerm);
}

/**
 * Convert database category to CategoryWithStats
 */
export function dbCategoryToCategoryWithStats(category: any, subcategories: any[] = [], terms: any[] = []): any {
  return {
    id: category.id,
    name: category.name,
    description: category.description || '',
    termCount: terms.length,
    completedTerms: 0, // TODO: Implement completion tracking
    averageCompletionRate: 0, // TODO: Calculate from user progress
    totalViews: terms.reduce((sum: number, term: any) => sum + (term.viewCount || 0), 0),
    subcategories: subcategories,
  };
}