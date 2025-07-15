/**
 * Daily Term Rotation Service
 * 
 * Implements intelligent daily term selection algorithm that picks 50 terms
 * based on various factors like quality, popularity, learning difficulty,
 * and user engagement patterns.
 */

import { subDays, format } from 'date-fns';
import { eq, and, gte, lte, desc, asc, sql, inArray } from 'drizzle-orm';
import { db } from '../db';
import { enhancedTerms, termSections, termViews, userProgress } from '../../shared/enhancedSchema';
import { log as logger } from '../utils/logger';
import type { ITerm } from '../../shared/types';

interface DailyTermsConfig {
  totalTerms: number;
  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
    expert: number;
  };
  categoryBalance: boolean;
  freshnessFactor: number;
  popularityWeight: number;
  qualityThreshold: number;
}

interface TermScore {
  termId: string;
  score: number;
  factors: {
    quality: number;
    popularity: number;
    freshness: number;
    difficulty: number;
    completeness: number;
    engagement: number;
  };
}

interface DailyTermsResponse {
  date: string;
  terms: ITerm[];
  metadata: {
    algorithm_version: string;
    selection_criteria: any;
    distribution: any;
    generated_at: string;
  };
}

export class DailyTermRotationService {
  private config: DailyTermsConfig;
  private algorithmVersion = '2.0';

  constructor(config?: Partial<DailyTermsConfig>) {
    this.config = {
      totalTerms: 50,
      difficultyDistribution: {
        beginner: 0.3,    // 30% beginner terms
        intermediate: 0.4, // 40% intermediate terms  
        advanced: 0.25,   // 25% advanced terms
        expert: 0.05      // 5% expert terms
      },
      categoryBalance: true,
      freshnessFactor: 0.2,
      popularityWeight: 0.3,
      qualityThreshold: 60,
      ...config
    };
  }

  /**
   * Get today's 50 terms using intelligent selection algorithm
   */
  async getTodaysTerms(date?: Date): Promise<DailyTermsResponse> {
    const targetDate = date || new Date();
    const dateString = format(targetDate, 'yyyy-MM-dd');
    
    logger.info('Generating daily terms selection', { date: dateString });

    try {
      // Check if we already have terms for this date
      const cached = await this.getCachedDailyTerms(dateString);
      if (cached) {
        logger.info('Returning cached daily terms', { date: dateString });
        return cached;
      }

      // Generate new selection
      const terms = await this.generateDailyTerms(targetDate);
      const response: DailyTermsResponse = {
        date: dateString,
        terms,
        metadata: {
          algorithm_version: this.algorithmVersion,
          selection_criteria: this.config,
          distribution: this.analyzeDistribution(terms),
          generated_at: new Date().toISOString()
        }
      };

      // Cache the selection
      await this.cacheDailyTerms(dateString, response);

      logger.info('Generated new daily terms selection', { 
        date: dateString, 
        termCount: terms.length 
      });

      return response;
    } catch (error) {
      logger.error('Error generating daily terms', { 
        error: error instanceof Error ? error.message : String(error),
        date: dateString 
      });
      throw error;
    }
  }

  /**
   * Generate intelligent term selection for a specific date
   */
  private async generateDailyTerms(date: Date): Promise<ITerm[]> {
    // Step 1: Get all eligible terms
    const allTerms = await this.getEligibleTerms();
    
    if (allTerms.length === 0) {
      throw new Error('No eligible terms found for selection');
    }

    // Step 2: Calculate scores for each term
    const scoredTerms = await this.calculateTermScores(allTerms, date);

    // Step 3: Apply selection algorithm
    const selectedTerms = await this.selectTermsWithBalancing(scoredTerms, date);

    // Step 4: Final validation and optimization
    return this.optimizeSelection(selectedTerms);
  }

  /**
   * Get all terms that are eligible for daily rotation
   */
  private async getEligibleTerms(): Promise<ITerm[]> {
    try {
      const terms = await db
        .select()
        .from(enhancedTerms)
        .where(
          and(
            sql`${enhancedTerms.fullDefinition} IS NOT NULL`,
            sql`length(${enhancedTerms.fullDefinition}) > 100`,
            sql`${enhancedTerms.mainCategories} IS NOT NULL`
          )
        )
        .orderBy(asc(enhancedTerms.name));

      return terms.map(term => ({
        id: term.id,
        name: term.name,
        slug: term.slug,
        definition: term.fullDefinition,
        shortDefinition: term.shortDefinition || term.fullDefinition?.substring(0, 200),
        categoryId: term.mainCategories?.[0] || 'general',
        category: term.mainCategories?.[0] || 'General',
        viewCount: term.viewCount || 0,
        createdAt: term.createdAt,
        updatedAt: term.updatedAt,
        // Additional metadata for scoring
        difficultyLevel: term.difficultyLevel || 'intermediate',
        hasImplementation: term.hasImplementation || false,
        hasInteractiveElements: term.hasInteractiveElements || false,
        hasCodeExamples: term.hasCodeExamples || false
      }));
    } catch (error) {
      logger.error('Error fetching eligible terms', { error });
      return [];
    }
  }

  /**
   * Calculate comprehensive scores for each term
   */
  private async calculateTermScores(terms: ITerm[], date: Date): Promise<TermScore[]> {
    const scores: TermScore[] = [];
    const thirtyDaysAgo = subDays(date, 30);
    const sevenDaysAgo = subDays(date, 7);

    for (const term of terms) {
      try {
        // Get recent engagement data
        const recentViews = await this.getRecentViews(term.id, thirtyDaysAgo);
        const weeklyViews = await this.getRecentViews(term.id, sevenDaysAgo);

        // Calculate individual factor scores
        const qualityScore = this.calculateQualityScore(term);
        const popularityScore = this.calculatePopularityScore(term, recentViews);
        const freshnessScore = this.calculateFreshnessScore(term, date);
        const difficultyScore = this.calculateDifficultyScore(term);
        const completenessScore = this.calculateCompletenessScore(term);
        const engagementScore = this.calculateEngagementScore(recentViews, weeklyViews);

        // Weighted composite score
        const compositeScore = 
          qualityScore * 0.25 +
          popularityScore * this.config.popularityWeight +
          freshnessScore * this.config.freshnessFactor +
          difficultyScore * 0.15 +
          completenessScore * 0.2 +
          engagementScore * 0.1;

        scores.push({
          termId: term.id,
          score: compositeScore,
          factors: {
            quality: qualityScore,
            popularity: popularityScore,
            freshness: freshnessScore,
            difficulty: difficultyScore,
            completeness: completenessScore,
            engagement: engagementScore
          }
        });
      } catch (error) {
        logger.warn('Error calculating score for term', { 
          termId: term.id, 
          termName: term.name,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Fallback score
        scores.push({
          termId: term.id,
          score: 0.5,
          factors: {
            quality: 0.5,
            popularity: 0.5,
            freshness: 0.5,
            difficulty: 0.5,
            completeness: 0.5,
            engagement: 0.5
          }
        });
      }
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  private calculateQualityScore(term: ITerm): number {
    let score = 0.5; // Base score

    // Definition quality
    if (term.definition && term.definition.length > 200) score += 0.2;
    if (term.shortDefinition && term.shortDefinition.length > 50) score += 0.1;

    // Content richness
    if ((term as any).hasImplementation) score += 0.1;
    if ((term as any).hasCodeExamples) score += 0.1;
    if ((term as any).hasInteractiveElements) score += 0.1;

    return Math.min(score, 1.0);
  }

  private calculatePopularityScore(term: ITerm, recentViews: number): number {
    if (recentViews === 0) return 0.3; // Base score for new/unviewed terms
    
    // Normalize based on logarithmic scale
    const normalizedViews = Math.log(recentViews + 1) / Math.log(100);
    return Math.min(normalizedViews, 1.0);
  }

  private calculateFreshnessScore(term: ITerm, currentDate: Date): number {
    const termDate = new Date(term.updatedAt || term.createdAt || currentDate);
    const daysSinceUpdate = Math.floor((currentDate.getTime() - termDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Recent updates get higher scores
    if (daysSinceUpdate <= 7) return 1.0;
    if (daysSinceUpdate <= 30) return 0.8;
    if (daysSinceUpdate <= 90) return 0.6;
    if (daysSinceUpdate <= 365) return 0.4;
    
    return 0.2; // Older content gets lower freshness score
  }

  private calculateDifficultyScore(term: ITerm): number {
    const difficulty = (term as any).difficultyLevel || 'intermediate';
    
    // Boost scores based on target distribution
    const difficultyScores = {
      'beginner': 0.8,     // Slightly favor beginner terms
      'intermediate': 1.0, // Highest weight for intermediate
      'advanced': 0.7,
      'expert': 0.5
    };
    
    return difficultyScores[difficulty as keyof typeof difficultyScores] || 0.6;
  }

  private calculateCompletenessScore(term: ITerm): number {
    let score = 0.3; // Base score
    
    // Check for key content elements
    if (term.definition && term.definition.length > 100) score += 0.2;
    if (term.shortDefinition) score += 0.1;
    if (term.category && term.category !== 'General') score += 0.1;
    if ((term as any).hasImplementation) score += 0.15;
    if ((term as any).hasCodeExamples) score += 0.15;
    
    return Math.min(score, 1.0);
  }

  private calculateEngagementScore(recentViews: number, weeklyViews: number): number {
    if (recentViews === 0) return 0.3;
    
    // Calculate engagement velocity (recent views vs weekly average)
    const weeklyAverage = weeklyViews / 7;
    const dailyViews = recentViews / 30;
    
    if (weeklyAverage === 0) return Math.min(dailyViews / 5, 1.0);
    
    const engagementRatio = dailyViews / weeklyAverage;
    return Math.min(engagementRatio / 2, 1.0);
  }

  private async getRecentViews(termId: string, since: Date): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(termViews)
        .where(
          and(
            eq(termViews.termId, termId),
            gte(termViews.viewedAt, since)
          )
        );
      
      return result[0]?.count || 0;
    } catch (error) {
      logger.warn('Error getting recent views', { termId, error });
      return 0;
    }
  }

  /**
   * Select terms with intelligent balancing across categories and difficulties
   */
  private async selectTermsWithBalancing(scoredTerms: TermScore[], date: Date): Promise<ITerm[]> {
    const termMap = new Map<string, ITerm>();
    const allTerms = await this.getEligibleTerms();
    
    allTerms.forEach(term => termMap.set(term.id, term));

    const selected: ITerm[] = [];
    const usedCategories = new Map<string, number>();
    const usedDifficulties = new Map<string, number>();

    // Calculate target counts for each difficulty
    const targetCounts = {
      beginner: Math.floor(this.config.totalTerms * this.config.difficultyDistribution.beginner),
      intermediate: Math.floor(this.config.totalTerms * this.config.difficultyDistribution.intermediate),
      advanced: Math.floor(this.config.totalTerms * this.config.difficultyDistribution.advanced),
      expert: Math.floor(this.config.totalTerms * this.config.difficultyDistribution.expert)
    };

    // Ensure we hit exactly the target number
    const totalTargeted = Object.values(targetCounts).reduce((a, b) => a + b, 0);
    if (totalTargeted < this.config.totalTerms) {
      targetCounts.intermediate += this.config.totalTerms - totalTargeted;
    }

    // Selection algorithm with balancing
    for (const scoredTerm of scoredTerms) {
      const term = termMap.get(scoredTerm.termId);
      if (!term) continue;

      const difficulty = (term as any).difficultyLevel || 'intermediate';
      const category = term.category || 'General';

      // Check difficulty quota
      const currentDifficultyCount = usedDifficulties.get(difficulty) || 0;
      const difficultyTarget = targetCounts[difficulty as keyof typeof targetCounts] || 0;
      
      if (currentDifficultyCount >= difficultyTarget) {
        continue; // Skip if difficulty quota is full
      }

      // Check category balance (if enabled)
      if (this.config.categoryBalance) {
        const categoryCount = usedCategories.get(category) || 0;
        const maxPerCategory = Math.ceil(this.config.totalTerms / 8); // Assuming ~8 major categories
        
        if (categoryCount >= maxPerCategory) {
          continue; // Skip if category is over-represented
        }
      }

      // Add term to selection
      selected.push(term);
      usedDifficulties.set(difficulty, currentDifficultyCount + 1);
      usedCategories.set(category, (usedCategories.get(category) || 0) + 1);

      if (selected.length >= this.config.totalTerms) {
        break;
      }
    }

    // Fill remaining slots if needed (relaxed criteria)
    if (selected.length < this.config.totalTerms) {
      const remaining = this.config.totalTerms - selected.length;
      const selectedIds = new Set(selected.map(t => t.id));
      
      const additionalTerms = scoredTerms
        .filter(st => !selectedIds.has(st.termId))
        .slice(0, remaining)
        .map(st => termMap.get(st.termId))
        .filter(term => term !== undefined) as ITerm[];
      
      selected.push(...additionalTerms);
    }

    logger.info('Term selection completed', {
      selectedCount: selected.length,
      targetCount: this.config.totalTerms,
      difficultyDistribution: this.analyzeDifficultyDistribution(selected),
      categoryDistribution: this.analyzeCategoryDistribution(selected)
    });

    return selected.slice(0, this.config.totalTerms);
  }

  private optimizeSelection(terms: ITerm[]): ITerm[] {
    // Shuffle terms to avoid predictable ordering
    const shuffled = [...terms];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  private analyzeDistribution(terms: ITerm[]) {
    return {
      difficulty: this.analyzeDifficultyDistribution(terms),
      category: this.analyzeCategoryDistribution(terms),
      quality: this.analyzeQualityDistribution(terms)
    };
  }

  private analyzeDifficultyDistribution(terms: ITerm[]) {
    const distribution = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
    
    terms.forEach(term => {
      const difficulty = (term as any).difficultyLevel || 'intermediate';
      if (difficulty in distribution) {
        distribution[difficulty as keyof typeof distribution]++;
      }
    });

    return distribution;
  }

  private analyzeCategoryDistribution(terms: ITerm[]) {
    const distribution: Record<string, number> = {};
    
    terms.forEach(term => {
      const category = term.category || 'General';
      distribution[category] = (distribution[category] || 0) + 1;
    });

    return distribution;
  }

  private analyzeQualityDistribution(terms: ITerm[]) {
    let hasImplementation = 0;
    let hasCodeExamples = 0;
    let hasInteractiveElements = 0;

    terms.forEach(term => {
      if ((term as any).hasImplementation) hasImplementation++;
      if ((term as any).hasCodeExamples) hasCodeExamples++;
      if ((term as any).hasInteractiveElements) hasInteractiveElements++;
    });

    return {
      withImplementation: hasImplementation,
      withCodeExamples: hasCodeExamples,
      withInteractiveElements: hasInteractiveElements,
      averageDefinitionLength: terms.reduce((sum, term) => 
        sum + (term.definition?.length || 0), 0) / terms.length
    };
  }

  /**
   * Cache daily terms selection
   */
  private async cacheDailyTerms(date: string, response: DailyTermsResponse): Promise<void> {
    // In production, this would use Redis or database caching
    // For now, we'll implement a simple file-based cache
    try {
      const cacheDir = path.join(process.cwd(), 'cache', 'daily-terms');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const cacheFile = path.join(cacheDir, `${date}.json`);
      fs.writeFileSync(cacheFile, JSON.stringify(response, null, 2));
      
      logger.info('Cached daily terms', { date, cacheFile });
    } catch (error) {
      logger.warn('Failed to cache daily terms', { date, error });
    }
  }

  /**
   * Get cached daily terms if available
   */
  private async getCachedDailyTerms(date: string): Promise<DailyTermsResponse | null> {
    try {
      const cacheFile = path.join(process.cwd(), 'cache', 'daily-terms', `${date}.json`);
      
      if (fs.existsSync(cacheFile)) {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        
        // Validate cache (check if it's from current algorithm version)
        if (cached.metadata?.algorithm_version === this.algorithmVersion) {
          return cached;
        }
      }
    } catch (error) {
      logger.warn('Error reading cached daily terms', { date, error });
    }
    
    return null;
  }

  /**
   * Get historical performance metrics for algorithm tuning
   */
  async getSelectionMetrics(days: number = 30): Promise<any> {
    const metrics = {
      totalSelections: 0,
      averageTermsPerDay: 0,
      difficultyDistribution: { beginner: 0, intermediate: 0, advanced: 0, expert: 0 },
      categoryBalance: {},
      algorithmVersions: {},
      engagementMetrics: {}
    };

    // Implementation would analyze historical selections and engagement
    return metrics;
  }

  /**
   * Update algorithm configuration
   */
  updateConfig(newConfig: Partial<DailyTermsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Updated daily terms configuration', { config: this.config });
  }
}

// Import required modules
import fs from 'fs';
import path from 'path';

export default DailyTermRotationService;