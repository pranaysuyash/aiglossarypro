/**
 * User Profiling Service
 * AI-powered user behavior analysis and profile generation
 */

import { and, desc, eq, gte, sql } from 'drizzle-orm';
import {
  categories,
  learningPaths,
  termAnalytics,
  terms,
  userInteractions,
  userLearningProgress,
} from '../../shared/schema';
import { db } from '../db';

export interface UserProfile {
  userId: string;
  interests: CategoryInterest[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learningStyle: 'visual' | 'theoretical' | 'practical' | 'mixed';
  activityLevel: 'low' | 'moderate' | 'high';
  preferredContentTypes: string[];
  recentTopics: string[];
  engagementScore: number;
  personalityVector: number[];
  lastUpdated: Date;
}

export interface CategoryInterest {
  categoryId: string;
  categoryName: string;
  interestScore: number;
  timeSpent: number;
  recentActivity: number;
}

export interface PersonalizedRecommendation {
  type: 'term' | 'category' | 'learning_path' | 'trending';
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
  reason: string;
  metadata: Record<string, any>;
}

/**
 * Generate comprehensive user profile from behavior data
 */
export async function generateUserProfile(userId: string): Promise<UserProfile> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get user's interaction history
  const interactions = await db
    .select({
      termId: userInteractions.termId,
      categoryId: terms.categoryId,
      categoryName: categories.name,
      interactionType: userInteractions.interactionType,
      duration: userInteractions.duration,
      timestamp: userInteractions.timestamp,
      termName: terms.name,
      difficultyLevel: terms.difficultyLevel,
    })
    .from(userInteractions)
    .leftJoin(terms, eq(userInteractions.termId, terms.id))
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .where(and(eq(userInteractions.userId, userId), gte(userInteractions.timestamp, thirtyDaysAgo)))
    .orderBy(desc(userInteractions.timestamp));

  // Calculate category interests
  const categoryInterests = await calculateCategoryInterests(interactions);

  // Determine skill level based on content complexity and learning progress
  const skillLevel = await calculateSkillLevel(userId, interactions);

  // Analyze learning style preferences
  const learningStyle = calculateLearningStyle(interactions);

  // Calculate activity level
  const activityLevel = calculateActivityLevel(interactions);

  // Determine preferred content types
  const preferredContentTypes = calculatePreferredContentTypes(interactions);

  // Get recent topics
  const recentTopics = extractRecentTopics(interactions, sevenDaysAgo);

  // Calculate overall engagement score
  const engagementScore = calculateEngagementScore(interactions);

  // Generate personality vector for ML recommendations
  const personalityVector = generatePersonalityVector(
    categoryInterests,
    skillLevel,
    learningStyle,
    activityLevel
  );

  return {
    userId,
    interests: categoryInterests,
    skillLevel,
    learningStyle,
    activityLevel,
    preferredContentTypes,
    recentTopics,
    engagementScore,
    personalityVector,
    lastUpdated: now,
  };
}

/**
 * Calculate user interest scores for each category
 */
async function calculateCategoryInterests(interactions: any[]): Promise<CategoryInterest[]> {
  const categoryMap = new Map<string, CategoryInterest>();

  interactions.forEach(interaction => {
    if (!interaction.categoryId) {return;}

    const key = interaction.categoryId;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        categoryId: interaction.categoryId,
        categoryName: interaction.categoryName || 'Unknown',
        interestScore: 0,
        timeSpent: 0,
        recentActivity: 0,
      });
    }

    const category = categoryMap.get(key)!;

    // Weight different interaction types
    const weights = {
      view: 1,
      bookmark: 3,
      share: 4,
      search: 2,
    };

    const weight = weights[interaction.interactionType as keyof typeof weights] || 1;
    const duration = interaction.duration || 30; // Default 30 seconds if no duration

    category.interestScore += weight * Math.log(duration + 1);
    category.timeSpent += duration;

    // Recent activity (last 7 days gets bonus)
    const daysSince =
      (Date.now() - new Date(interaction.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) {
      category.recentActivity += weight;
    }
  });

  // Normalize scores and return sorted array
  const categories = Array.from(categoryMap.values());
  const maxScore = Math.max(...categories.map(c => c.interestScore));

  return categories
    .map(category => ({
      ...category,
      interestScore: maxScore > 0 ? (category.interestScore / maxScore) * 100 : 0,
    }))
    .sort((a, b) => b.interestScore - a.interestScore)
    .slice(0, 10); // Top 10 interests
}

/**
 * Determine user skill level based on content complexity
 */
async function calculateSkillLevel(
  userId: string,
  interactions: any[]
): Promise<UserProfile['skillLevel']> {
  // Get learning path progress
  const learningProgress = await db
    .select({
      completionPercentage: userLearningProgress.completion_percentage,
      difficultyLevel: learningPaths.difficulty_level,
    })
    .from(userLearningProgress)
    .leftJoin(learningPaths, eq(userLearningProgress.learning_path_id, learningPaths.id))
    .where(eq(userLearningProgress.user_id, userId));

  // Analyze content difficulty preferences
  const difficultyScores = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    expert: 0,
  };

  interactions.forEach(interaction => {
    const difficulty = interaction.difficultyLevel;
    if (difficulty && Object.hasOwn(difficultyScores, difficulty)) {
      const duration = interaction.duration || 30;
      difficultyScores[difficulty as keyof typeof difficultyScores] += Math.log(duration + 1);
    }
  });

  // Factor in learning path completions
  learningProgress.forEach(progress => {
    if ((progress.completionPercentage || 0) > 50) {
      const difficulty = progress.difficultyLevel;
      if (difficulty && Object.hasOwn(difficultyScores, difficulty)) {
        difficultyScores[difficulty as keyof typeof difficultyScores] += 50;
      }
    }
  });

  // Determine skill level based on highest engagement
  const maxDifficulty = Object.entries(difficultyScores).sort(([, a], [, b]) => b - a)[0][0];

  return maxDifficulty as UserProfile['skillLevel'];
}

/**
 * Analyze learning style preferences
 */
function calculateLearningStyle(interactions: any[]): UserProfile['learningStyle'] {
  const styleScores = {
    visual: 0, // Interactions with visual content
    theoretical: 0, // Long reading sessions
    practical: 0, // Code examples, tutorials
    mixed: 0,
  };

  interactions.forEach(interaction => {
    const duration = interaction.duration || 30;

    // Visual learners: shorter sessions, more frequent interactions
    if (duration < 120 && interaction.interactionType === 'view') {
      styleScores.visual += 1;
    }

    // Theoretical learners: longer reading sessions
    if (duration > 300 && interaction.interactionType === 'view') {
      styleScores.theoretical += 2;
    }

    // Practical learners: bookmarks, shares, code interactions
    if (['bookmark', 'share'].includes(interaction.interactionType)) {
      styleScores.practical += 2;
    }

    // Mixed learners: balanced engagement
    styleScores.mixed += 0.5;
  });

  const maxStyle = Object.entries(styleScores).sort(([, a], [, b]) => b - a)[0][0];

  return maxStyle as UserProfile['learningStyle'];
}

/**
 * Calculate user activity level
 */
function calculateActivityLevel(interactions: any[]): UserProfile['activityLevel'] {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentInteractions = interactions.filter(i => new Date(i.timestamp) >= sevenDaysAgo);

  const dailyAverage = recentInteractions.length / 7;

  if (dailyAverage >= 10) {return 'high';}
  if (dailyAverage >= 3) {return 'moderate';}
  return 'low';
}

/**
 * Determine preferred content types
 */
function calculatePreferredContentTypes(interactions: any[]): string[] {
  const typeScores = new Map<string, number>();

  interactions.forEach(interaction => {
    const type = interaction.interactionType;
    typeScores.set(type, (typeScores.get(type) || 0) + 1);
  });

  return Array.from(typeScores.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);
}

/**
 * Extract recent topics of interest
 */
function extractRecentTopics(interactions: any[], since: Date): string[] {
  const recentTerms = interactions
    .filter(i => new Date(i.timestamp) >= since)
    .map(i => i.termName)
    .filter(Boolean);

  // Get unique recent terms
  return [...new Set(recentTerms)].slice(0, 5);
}

/**
 * Calculate overall engagement score
 */
function calculateEngagementScore(interactions: any[]): number {
  if (interactions.length === 0) {return 0;}

  const totalDuration = interactions.reduce((sum, i) => sum + (i.duration || 30), 0);
  const avgDuration = totalDuration / interactions.length;

  // Factors: frequency, duration, variety of interactions
  const frequencyScore = Math.min(interactions.length / 50, 1) * 30;
  const durationScore = Math.min(avgDuration / 300, 1) * 40;
  const varietyScore = (new Set(interactions.map(i => i.interactionType)).size / 4) * 30;

  return Math.round(frequencyScore + durationScore + varietyScore);
}

/**
 * Generate personality vector for ML recommendations
 */
function generatePersonalityVector(
  interests: CategoryInterest[],
  skillLevel: string,
  learningStyle: string,
  activityLevel: string
): number[] {
  const vector: number[] = [];

  // Interest dimensions (top 5 categories)
  interests.slice(0, 5).forEach(interest => {
    vector.push(interest.interestScore / 100);
  });

  // Pad to 5 dimensions if needed
  while (vector.length < 5) {
    vector.push(0);
  }

  // Skill level dimension
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  vector.push(skillLevels.indexOf(skillLevel) / 3);

  // Learning style dimensions
  const learningStyles = ['visual', 'theoretical', 'practical', 'mixed'];
  vector.push(learningStyles.indexOf(learningStyle) / 3);

  // Activity level dimension
  const activityLevels = ['low', 'moderate', 'high'];
  vector.push(activityLevels.indexOf(activityLevel) / 2);

  return vector;
}

/**
 * Generate personalized recommendations for a user
 */
export async function generatePersonalizedRecommendations(
  userProfile: UserProfile,
  limit = 10
): Promise<PersonalizedRecommendation[]> {
  const recommendations: PersonalizedRecommendation[] = [];

  // Get trending terms in user's interest areas
  const trendingRecommendations = await getTrendingRecommendations(userProfile);
  recommendations.push(...trendingRecommendations);

  // Get terms from less explored categories
  const explorationRecommendations = await getExplorationRecommendations(userProfile);
  recommendations.push(...explorationRecommendations);

  // Get learning paths matching skill level
  const learningPathRecommendations = await getLearningPathRecommendations(userProfile);
  recommendations.push(...learningPathRecommendations);

  // Sort by relevance score and return top results
  return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit);
}

/**
 * Get trending recommendations based on user interests
 */
async function getTrendingRecommendations(
  userProfile: UserProfile
): Promise<PersonalizedRecommendation[]> {
  const topInterests = userProfile.interests.slice(0, 3);
  if (topInterests.length === 0) {return [];}

  const recommendations: PersonalizedRecommendation[] = [];

  for (const interest of topInterests) {
    const trendingTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        definition: terms.definition,
        viewCount: termAnalytics.viewCount,
      })
      .from(terms)
      .leftJoin(termAnalytics, eq(terms.id, termAnalytics.termId))
      .where(eq(terms.categoryId, interest.categoryId))
      .orderBy(desc(termAnalytics.viewCount))
      .limit(2);

    trendingTerms.forEach(term => {
      recommendations.push({
        type: 'term',
        id: term.id,
        title: term.name,
        description: term.definition || '',
        relevanceScore: interest.interestScore * 0.8,
        reason: `Trending in ${interest.categoryName}`,
        metadata: {
          categoryId: interest.categoryId,
          categoryName: interest.categoryName,
          viewCount: term.viewCount,
        },
      });
    });
  }

  return recommendations;
}

/**
 * Get exploration recommendations for new areas
 */
async function getExplorationRecommendations(
  userProfile: UserProfile
): Promise<PersonalizedRecommendation[]> {
  const exploredCategoryIds = userProfile.interests.map(i => i.categoryId);

  const unexploredCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
    })
    .from(categories)
    .where(sql`${categories.id} NOT IN (${exploredCategoryIds.map(id => `'${id}'`).join(',')})`)
    .limit(3);

  return unexploredCategories.map(category => ({
    type: 'category' as const,
    id: category.id,
    title: category.name,
    description: category.description || '',
    relevanceScore: 60, // Medium relevance for exploration
    reason: 'Explore new topic area',
    metadata: {
      categoryId: category.id,
      isExploration: true,
    },
  }));
}

/**
 * Get learning path recommendations based on skill level
 */
async function getLearningPathRecommendations(
  userProfile: UserProfile
): Promise<PersonalizedRecommendation[]> {
  const recommendations: PersonalizedRecommendation[] = [];

  const suitablePaths = await db
    .select({
      id: learningPaths.id,
      name: learningPaths.name,
      description: learningPaths.description,
      difficultyLevel: learningPaths.difficulty_level,
      categoryId: learningPaths.category_id,
    })
    .from(learningPaths)
    .where(
      and(
        eq(learningPaths.difficulty_level, userProfile.skillLevel),
        eq(learningPaths.is_published, true)
      )
    )
    .limit(3);

  suitablePaths.forEach(path => {
    const categoryInterest = userProfile.interests.find(i => i.categoryId === path.categoryId);
    const relevanceScore = categoryInterest ? categoryInterest.interestScore * 0.9 : 40;

    recommendations.push({
      type: 'learning_path',
      id: path.id,
      title: path.name,
      description: path.description || '',
      relevanceScore,
      reason: `Matches your ${userProfile.skillLevel} level`,
      metadata: {
        difficultyLevel: path.difficultyLevel,
        categoryId: path.categoryId,
      },
    });
  });

  return recommendations;
}
