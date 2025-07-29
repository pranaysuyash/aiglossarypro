import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { termVersions } from '@aiglossarypro/shared/enhancedSchema';
import { aiService } from './aiService';
import { db } from '@aiglossarypro/database';
import { log as logger } from './utils/logger';

/**
 * AI-Powered Term Versioning and Quality Assessment Service
 * Compares new content with existing terms and decides whether to upgrade, keep, or archive
 */

interface ContentQualityMetrics {
  clarity: number; // 0-10 scale
  completeness: number; // 0-10 scale
  accuracy: number; // 0-10 scale
  relevance: number; // 0-10 scale
  depth: number; // 0-10 scale
  overallScore: number; // weighted average
  reasoning: string;
  improvements: string[];
  concerns: string[];
}

interface VersionDecision {
  action: 'upgrade' | 'keep_current' | 'create_variant' | 'needs_review';
  confidence: number; // 0-1 scale
  reasoning: string;
  qualityDelta: number; // improvement score (-10 to +10)
  recommendations: string[];
}

interface TermVersion {
  id: string;
  termId: string;
  version: string;
  content: any;
  qualityMetrics: ContentQualityMetrics;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    source: string;
    processingMode: string;
    aiGenerated: boolean;
    humanReviewed: boolean;
    qualityAssessment: ContentQualityMetrics;
    versionDecision: VersionDecision;
  };
}

export class VersioningService {
  private readonly QUALITY_THRESHOLD = 6.5; // Minimum quality score for auto-upgrade
  private readonly IMPROVEMENT_THRESHOLD = 0.5; // Minimum improvement needed for upgrade
  private readonly MAX_VERSIONS_PER_TERM = 5; // Keep max 5 versions per term

  constructor() {
    logger.info('🔄 VersioningService initialized');
  }

  /**
   * Assess content quality using AI
   */
  async assessContentQuality(termName: string, content: any): Promise<ContentQualityMetrics> {
    logger.info(`🔍 Assessing content quality for: ${termName}`);

    try {
      const assessmentPrompt = this.buildQualityAssessmentPrompt(termName, content);

      const response = await aiService.generateDefinition(
        `quality_assessment_${termName}`,
        'content_quality',
        assessmentPrompt
      );

      // Parse AI response into quality metrics
      const qualityMetrics = await this.parseQualityAssessment(response.definition);

      logger.info(`📊 Quality assessment complete: ${qualityMetrics.overallScore}/10`);
      return qualityMetrics;
    } catch (error) {
      logger.error(
        `❌ Quality assessment failed for ${termName}:`,
        error as Record<string, unknown>
      );

      // Return default conservative assessment
      return {
        clarity: 5.0,
        completeness: 5.0,
        accuracy: 5.0,
        relevance: 5.0,
        depth: 5.0,
        overallScore: 5.0,
        reasoning: 'Assessment failed - using conservative defaults',
        improvements: ['Unable to assess - manual review recommended'],
        concerns: ['Quality assessment system error'],
      };
    }
  }

  /**
   * Compare new content with existing version and decide on action
   */
  async compareAndDecide(
    termName: string,
    newContent: any,
    existingContent?: any
  ): Promise<VersionDecision> {
    logger.info(`⚖️  Comparing content versions for: ${termName}`);

    try {
      // If no existing content, always accept new content
      if (!existingContent) {
        const newQuality = await this.assessContentQuality(termName, newContent);

        return {
          action: newQuality.overallScore >= this.QUALITY_THRESHOLD ? 'upgrade' : 'needs_review',
          confidence: newQuality.overallScore >= this.QUALITY_THRESHOLD ? 0.9 : 0.6,
          reasoning: 'No existing content - accepting new content based on quality assessment',
          qualityDelta: newQuality.overallScore,
          recommendations:
            newQuality.overallScore < this.QUALITY_THRESHOLD
              ? ['Consider improving content quality before publishing']
              : ['Content meets quality standards'],
        };
      }

      // Assess both versions
      const [newQuality, existingQuality] = await Promise.all([
        this.assessContentQuality(termName, newContent),
        this.assessContentQuality(termName, existingContent),
      ]);

      // Use AI to make comparison decision
      const comparisonPrompt = this.buildComparisonPrompt(
        termName,
        newContent,
        existingContent,
        newQuality,
        existingQuality
      );

      const decisionResponse = await aiService.generateDefinition(
        `version_decision_${termName}`,
        'version_comparison',
        comparisonPrompt
      );

      const decision = await this.parseVersionDecision(
        decisionResponse.definition,
        newQuality,
        existingQuality
      );

      logger.info(`🎯 Version decision: ${decision.action} (confidence: ${decision.confidence})`);
      return decision;
    } catch (error) {
      logger.error(
        `❌ Version comparison failed for ${termName}:`,
        error as Record<string, unknown>
      );

      // Conservative fallback
      return {
        action: 'needs_review',
        confidence: 0.3,
        reasoning: 'Comparison system error - manual review required',
        qualityDelta: 0,
        recommendations: ['System error occurred - human review needed'],
      };
    }
  }

  /**
   * Create a new version of a term
   */
  async createVersion(
    termId: string,
    termName: string,
    newContent: any,
    processingMetadata: {
      source: string;
      processingMode: string;
      aiGenerated: boolean;
    }
  ): Promise<{ versionId: string; decision: VersionDecision }> {
    logger.info(`📝 Creating new version for term: ${termName}`);

    try {
      // Get existing active version
      const existingVersions = await db
        .select()
        .from(termVersions)
        .where(and(eq(termVersions.termId, termId), eq(termVersions.isActive, true)))
        .orderBy(desc(termVersions.createdAt))
        .limit(1);

      const existingContent = existingVersions[0]?.content;

      // Assess and compare
      const [newQuality, decision] = await Promise.all([
        this.assessContentQuality(termName, newContent),
        this.compareAndDecide(termName, newContent, existingContent),
      ]);

      // Determine version number
      const allVersions = await db
        .select()
        .from(termVersions)
        .where(eq(termVersions.termId, termId))
        .orderBy(desc(termVersions.createdAt));

      const nextVersion = this.calculateNextVersion(allVersions, decision.action);

      // Create new version record
      const [newVersion] = await db
        .insert(termVersions)
        .values({
          id: randomUUID(),
          termId: termId,
          version: nextVersion,
          content: newContent,
          qualityMetrics: newQuality,
          isActive: decision.action === 'upgrade',
          metadata: {
            source: processingMetadata.source,
            processingMode: processingMetadata.processingMode,
            aiGenerated: processingMetadata.aiGenerated,
            humanReviewed: false,
            qualityAssessment: newQuality,
            versionDecision: decision,
          },
        })
        .returning();

      // If upgrading, deactivate previous version
      if (decision.action === 'upgrade' && existingVersions.length > 0) {
        await db
          .update(termVersions)
          .set({
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(termVersions.id, existingVersions[0].id));

        logger.info(`🔄 Deactivated previous version, activated v${nextVersion}`);
      }

      // Clean up old versions if exceeded limit
      await this.cleanupOldVersions(termId);

      logger.info(`✅ Version ${nextVersion} created for ${termName}: ${decision.action}`);

      return {
        versionId: newVersion.id,
        decision,
      };
    } catch (error) {
      logger.error(
        `❌ Failed to create version for ${termName}:`,
        error as Record<string, unknown>
      );
      throw error;
    }
  }

  /**
   * Get version history for a term
   */
  async getVersionHistory(termId: string): Promise<TermVersion[]> {
    try {
      const versions = await db
        .select()
        .from(termVersions)
        .where(eq(termVersions.termId, termId))
        .orderBy(desc(termVersions.createdAt));

      return versions.map(v => ({
        id: v.id,
        termId: v.termId,
        version: v.version,
        content: v.content,
        qualityMetrics: v.qualityMetrics as ContentQualityMetrics,
        isActive: v.isActive ?? false,
        createdAt: v.createdAt || new Date(),
        updatedAt: v.updatedAt || new Date(),
        metadata: v.metadata as any,
      }));
    } catch (error) {
      logger.error(
        `❌ Failed to get version history for term ${termId}:`,
        error as Record<string, unknown>
      );
      return [];
    }
  }

  /**
   * Promote a version to active
   */
  async promoteVersion(versionId: string, reviewerNotes?: string): Promise<boolean> {
    try {
      const version = await db
        .select()
        .from(termVersions)
        .where(eq(termVersions.id, versionId))
        .limit(1);

      if (version.length === 0) {
        logger.error(`❌ Version ${versionId} not found`);
        return false;
      }

      const termVersion = version[0];

      // Deactivate other versions for this term
      await db
        .update(termVersions)
        .set({ isActive: false })
        .where(eq(termVersions.termId, termVersion.termId));

      // Activate this version
      await db
        .update(termVersions)
        .set({
          isActive: true,
          updatedAt: new Date(),
          metadata: {
            ...(termVersion.metadata as any),
            humanReviewed: true,
            reviewerNotes: reviewerNotes || 'Manually promoted',
          },
        })
        .where(eq(termVersions.id, versionId));

      logger.info(`✅ Version ${termVersion.version} promoted to active`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to promote version ${versionId}:`, error as Record<string, unknown>);
      return false;
    }
  }

  /**
   * Generate quality report for a term
   */
  async generateQualityReport(termId: string): Promise<{
    currentVersion: TermVersion | null;
    allVersions: TermVersion[];
    qualityTrend: { version: string; score: number; date: Date }[];
    recommendations: string[];
  }> {
    try {
      const versions = await this.getVersionHistory(termId);
      const currentVersion = versions.find(v => v.isActive) || null;

      const qualityTrend = versions
        .map(v => ({
          version: v.version,
          score: v.qualityMetrics.overallScore,
          date: v.createdAt,
        }))
        .reverse(); // Chronological order

      const recommendations = this.generateQualityRecommendations(versions);

      return {
        currentVersion,
        allVersions: versions,
        qualityTrend,
        recommendations,
      };
    } catch (error) {
      logger.error(
        `❌ Failed to generate quality report for term ${termId}:`,
        error as Record<string, unknown>
      );
      throw error;
    }
  }

  // Private helper methods

  private buildQualityAssessmentPrompt(termName: string, content: any): string {
    return `
Assess the quality of this AI/ML glossary term content for "${termName}".

Content to assess:
${JSON.stringify(content, null, 2)}

Evaluate on these dimensions (score 0-10):
1. CLARITY: How clear and understandable is the content?
2. COMPLETENESS: How complete and comprehensive is the information?
3. ACCURACY: How technically accurate is the content?
4. RELEVANCE: How relevant is the content to AI/ML practitioners?
5. DEPTH: How detailed and in-depth is the explanation?

Return your assessment as JSON:
{
  "clarity": 8.5,
  "completeness": 7.0,
  "accuracy": 9.0,
  "relevance": 8.0,
  "depth": 6.5,
  "overallScore": 7.8,
  "reasoning": "Brief explanation of the assessment",
  "improvements": ["specific suggestion 1", "specific suggestion 2"],
  "concerns": ["any accuracy concerns", "any clarity issues"]
}

Focus on factual accuracy, clarity of explanation, and practical value for AI/ML practitioners.
    `.trim();
  }

  private buildComparisonPrompt(
    termName: string,
    newContent: any,
    existingContent: any,
    newQuality: ContentQualityMetrics,
    existingQuality: ContentQualityMetrics
  ): string {
    return `
Compare these two versions of content for the AI/ML term "${termName}" and decide which is better.

EXISTING CONTENT (Quality Score: ${existingQuality.overallScore}/10):
${JSON.stringify(existingContent, null, 2)}

NEW CONTENT (Quality Score: ${newQuality.overallScore}/10):
${JSON.stringify(newContent, null, 2)}

Decide the best action:
- "upgrade": Replace existing with new content (significant improvement)
- "keep_current": Keep existing content (new is not better)
- "create_variant": Keep both as alternatives (different but valid approaches)
- "needs_review": Unclear which is better (requires human review)

Return your decision as JSON:
{
  "action": "upgrade",
  "confidence": 0.85,
  "reasoning": "Detailed explanation of why this decision was made",
  "qualityDelta": 1.2,
  "recommendations": ["specific next steps", "suggestions for improvement"]
}

Consider: accuracy, clarity, completeness, and practical value for AI/ML practitioners.
    `.trim();
  }

  private async parseQualityAssessment(aiResponse: string): Promise<ContentQualityMetrics> {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize scores
      const normalizeScore = (score: any): number => {
        const num = parseFloat(score);
        return Number.isNaN(num) ? 5.0 : Math.max(0, Math.min(10, num));
      };

      return {
        clarity: normalizeScore(parsed.clarity),
        completeness: normalizeScore(parsed.completeness),
        accuracy: normalizeScore(parsed.accuracy),
        relevance: normalizeScore(parsed.relevance),
        depth: normalizeScore(parsed.depth),
        overallScore: normalizeScore(parsed.overallScore),
        reasoning: parsed.reasoning || 'No reasoning provided',
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      };
    } catch (error) {
      logger.error('❌ Failed to parse quality assessment:', error as Record<string, unknown>);
      throw error;
    }
  }

  private async parseVersionDecision(
    aiResponse: string,
    newQuality: ContentQualityMetrics,
    existingQuality: ContentQualityMetrics
  ): Promise<VersionDecision> {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const validActions = ['upgrade', 'keep_current', 'create_variant', 'needs_review'];
      const action = validActions.includes(parsed.action) ? parsed.action : 'needs_review';

      return {
        action: action as any,
        confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.5)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        qualityDelta: newQuality.overallScore - existingQuality.overallScore,
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    } catch (error) {
      logger.error('❌ Failed to parse version decision:', error as Record<string, unknown>);

      // Fallback decision based on quality scores
      const qualityDelta = newQuality.overallScore - existingQuality.overallScore;

      return {
        action: qualityDelta > this.IMPROVEMENT_THRESHOLD ? 'upgrade' : 'keep_current',
        confidence: 0.5,
        reasoning: 'Parsing failed - using quality score fallback',
        qualityDelta,
        recommendations: ['Review AI decision parsing system'],
      };
    }
  }

  private calculateNextVersion(existingVersions: unknown[], action: string): string {
    if (existingVersions.length === 0) {
      return '1.0';
    }

    const latestVersion = existingVersions[0].version;
    const [major, minor] = latestVersion.split('.').map(Number);

    switch (action) {
      case 'upgrade':
        return `${major}.${minor + 1}`;
      case 'create_variant':
        return `${major}.${minor + 1}`;
      case 'needs_review':
        return `${major}.${minor + 1}-review`;
      default:
        return `${major}.${minor + 1}`;
    }
  }

  private async cleanupOldVersions(termId: string): Promise<void> {
    try {
      const allVersions = await db
        .select()
        .from(termVersions)
        .where(eq(termVersions.termId, termId))
        .orderBy(desc(termVersions.createdAt));

      if (allVersions.length > this.MAX_VERSIONS_PER_TERM) {
        const versionsToDelete = allVersions.slice(this.MAX_VERSIONS_PER_TERM);

        for (const version of versionsToDelete) {
          await db.delete(termVersions).where(eq(termVersions.id, version.id));
        }

        logger.info(`🧹 Cleaned up ${versionsToDelete.length} old versions for term ${termId}`);
      }
    } catch (error) {
      logger.error(
        `❌ Failed to cleanup old versions for term ${termId}:`,
        error as Record<string, unknown>
      );
    }
  }

  private generateQualityRecommendations(versions: TermVersion[]): string[] {
    const recommendations = [];

    if (versions.length === 0) {
      return ['No versions available for analysis'];
    }

    const currentVersion = versions.find(v => v.isActive);
    if (!currentVersion) {
      recommendations.push('No active version set - review and promote a version');
    }

    const avgQuality =
      versions.reduce((sum, v) => sum + v.qualityMetrics.overallScore, 0) / versions.length;

    if (avgQuality < this.QUALITY_THRESHOLD) {
      recommendations.push(
        `Average quality score (${avgQuality.toFixed(1)}) below threshold - consider content improvement`
      );
    }

    const recentVersions = versions.slice(0, 3);
    const qualityTrend =
      recentVersions.length > 1
        ? recentVersions[0].qualityMetrics.overallScore -
          recentVersions[recentVersions.length - 1].qualityMetrics.overallScore
        : 0;

    if (qualityTrend < -0.5) {
      recommendations.push('Quality trend declining - review recent changes');
    } else if (qualityTrend > 0.5) {
      recommendations.push('Quality trend improving - good progress');
    }

    return recommendations;
  }
}

export const versioningService = new VersioningService();
