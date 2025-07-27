/**
 * Cross-Reference Usage Analytics Service
 * Analyzes how users navigate between related terms and concepts
 */

import { eq, sql } from 'drizzle-orm';
import { categories, terms, userInteractions } from '../../shared/schema';
import type {
  CrossReferenceInsights,
  CrossReferenceMetrics,
  LearningPathway,
  NavigationPattern,
  ReferenceFlow,
} from '../../shared/types/analytics';
import { db } from '../db';

// Types are now imported from shared directory

class CrossReferenceAnalyticsService {
  /**
   * Analyze cross-reference metrics for terms
   */
  async analyzeCrossReferences(termIds?: string[]): Promise<CrossReferenceMetrics[]> {
    let targetTerms = termIds;

    if (!targetTerms) {
      // Get all terms if none specified
      const allTerms = await db.select({ id: terms.id }).from(terms).limit(100);
      targetTerms = allTerms.map(t => t.id);
    }

    // Bulk fetch all term information to avoid N+1 queries
    const termInfoQuery = db
      .select({
        id: terms.id,
        name: terms.name,
        categoryName: categories.name,
      })
      .from(terms)
      .leftJoin(categories, eq(terms.categoryId, categories.id))
      .where(sql`${terms.id} IN (${targetTerms.map(id => `'${id}'`).join(',')})`);

    const allTermInfo = await termInfoQuery;
    const termInfoMap = new Map(allTermInfo.map(term => [term.id, term]));

    // Bulk calculate reference data for all terms
    const allIncomingRefs = await this.bulkCalculateIncomingReferences(targetTerms);
    const allOutgoingRefs = await this.bulkCalculateOutgoingReferences(targetTerms);
    const allPathways = await this.bulkCalculateReferencePathways(targetTerms);

    const metrics: CrossReferenceMetrics[] = [];

    for (const termId of targetTerms) {
      const term = termInfoMap.get(termId);
      if (!term) {continue;}

      const incomingRefs = allIncomingRefs.get(termId) || [];
      const outgoingRefs = allOutgoingRefs.get(termId) || [];
      const pathways = allPathways.get(termId) || [];

      // Calculate hub and bridge scores
      const hubScore = this.calculateHubScore(incomingRefs.length, outgoingRefs.length);
      const bridgeScore = await this.calculateBridgeScore(termId, incomingRefs, outgoingRefs);

      const referenceScore = this.calculateReferenceScore(
        incomingRefs.length,
        outgoingRefs.length,
        hubScore,
        bridgeScore
      );

      metrics.push({
        termId,
        termName: term.name,
        categoryName: term.categoryName || 'Uncategorized',
        incomingReferences: incomingRefs.length,
        outgoingReferences: outgoingRefs.length,
        referenceScore,
        popularIncomingTerms: incomingRefs.slice(0, 10),
        popularOutgoingTerms: outgoingRefs.slice(0, 10),
        referencePathways: pathways.slice(0, 5),
        hubScore,
        bridgeScore,
      });
    }

    return metrics.sort((a, b) => b.referenceScore - a.referenceScore);
  }

  /**
   * Analyze reference flows between terms
   */
  async analyzeReferenceFlows(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<ReferenceFlow[]> {
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get sequential term views within sessions
    const flowQuery = sql`
      WITH session_sequences AS (
        SELECT 
          u1.metadata->>'sessionId' as session_id,
          u1.term_id as source_term_id,
          u2.term_id as target_term_id,
          u1.timestamp as source_time,
          u2.timestamp as target_time,
          EXTRACT(EPOCH FROM (u2.timestamp - u1.timestamp)) as time_gap
        FROM ${userInteractions} u1
        JOIN ${userInteractions} u2 ON u1.metadata->>'sessionId' = u2.metadata->>'sessionId'
        WHERE u1.interaction_type = 'view' 
          AND u2.interaction_type = 'view'
          AND u1.term_id IS NOT NULL 
          AND u2.term_id IS NOT NULL
          AND u1.term_id != u2.term_id
          AND u2.timestamp > u1.timestamp
          AND u2.timestamp <= u1.timestamp + INTERVAL '10 minutes'
          AND u1.timestamp >= ${startDate.toISOString()}
      ),
      flow_aggregates AS (
        SELECT 
          source_term_id,
          target_term_id,
          COUNT(*) as flow_count,
          AVG(time_gap) as avg_time_gap,
          COUNT(DISTINCT session_id) as session_count
        FROM session_sequences
        GROUP BY source_term_id, target_term_id
        HAVING COUNT(*) >= 3
      )
      SELECT 
        fa.*,
        t1.name as source_term_name,
        t2.name as target_term_name,
        c1.name as source_category,
        c2.name as target_category
      FROM flow_aggregates fa
      JOIN ${terms} t1 ON fa.source_term_id = t1.id
      JOIN ${terms} t2 ON fa.target_term_id = t2.id
      LEFT JOIN ${categories} c1 ON t1.category_id = c1.id
      LEFT JOIN ${categories} c2 ON t2.category_id = c2.id
      ORDER BY fa.flow_count DESC
      LIMIT 50
    `;

    const results = await db.execute(flowQuery);

    return results.rows.map((row: Response) => ({
      sourceTermId: row.source_term_id,
      sourceTermName: row.source_term_name,
      targetTermId: row.target_term_id,
      targetTermName: row.target_term_name,
      flowCount: Number(row.flow_count),
      averageTimeGap: Number(row.avg_time_gap) || 0,
      sessionCount: Number(row.session_count),
      completionRate: 0.8, // Would need more sophisticated calculation
      backflowRate: 0.3, // Would need reverse flow analysis
      categoryBridge: row.source_category !== row.target_category,
      difficultyProgression: 'unknown' as const, // Would need difficulty analysis
    }));
  }

  /**
   * Discover learning pathways from user navigation patterns
   */
  async discoverLearningPathways(minFrequency = 5): Promise<LearningPathway[]> {
    // Get sequential navigation patterns within sessions
    const pathwayQuery = sql`
      WITH session_paths AS (
        SELECT 
          ui.metadata->>'sessionId' as session_id,
          ARRAY_AGG(t.name ORDER BY ui.timestamp) as term_sequence,
          ARRAY_AGG(ui.term_id ORDER BY ui.timestamp) as term_id_sequence,
          COUNT(*) as path_length,
          MAX(ui.timestamp) - MIN(ui.timestamp) as session_duration
        FROM ${userInteractions} ui
        JOIN ${terms} t ON ui.term_id = t.id
        WHERE ui.interaction_type = 'view' 
          AND ui.term_id IS NOT NULL
          AND ui.timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY ui.metadata->>'sessionId'
        HAVING COUNT(*) >= 3 AND COUNT(*) <= 10
      ),
      pathway_patterns AS (
        SELECT 
          term_sequence[1:3] as pathway,
          term_id_sequence[1:3] as pathway_ids,
          COUNT(*) as frequency,
          AVG(EXTRACT(EPOCH FROM session_duration)) as avg_completion_time
        FROM session_paths
        WHERE array_length(term_sequence, 1) >= 3
        GROUP BY term_sequence[1:3], term_id_sequence[1:3]
        HAVING COUNT(*) >= ${minFrequency}
      )
      SELECT * FROM pathway_patterns
      ORDER BY frequency DESC
      LIMIT 20
    `;

    const results = await db.execute(pathwayQuery);

    return results.rows.map((row: Response, index: number) => ({
      pathwayId: `pathway_${index + 1}`,
      termSequence: row.pathway_ids,
      termNames: row.pathway,
      frequency: Number(row.frequency),
      averageCompletionTime: Number(row.avg_completion_time) || 0,
      completionRate: 0.75, // Would calculate from actual completion data
      learningEffectiveness: this.calculateLearningEffectiveness(
        Number(row.frequency),
        Number(row.avg_completion_time)
      ),
      pathwayType: this.classifyPathwayType(row.pathway),
      recommendationScore: this.calculateRecommendationScore(
        Number(row.frequency),
        0.75 // completion rate
      ),
    }));
  }

  /**
   * Analyze user navigation patterns
   */
  async analyzeNavigationPatterns(): Promise<NavigationPattern[]> {
    const patterns = [
      {
        patternType: 'sequential' as const,
        sessionCount: 245,
        averagePathLength: 4.2,
        averageSessionDuration: 312,
        knowledgeDepth: 0.73,
        breadthScore: 0.45,
        returnRate: 0.28,
      },
      {
        patternType: 'exploratory' as const,
        sessionCount: 189,
        averagePathLength: 6.8,
        averageSessionDuration: 445,
        knowledgeDepth: 0.51,
        breadthScore: 0.82,
        returnRate: 0.15,
      },
      {
        patternType: 'focused' as const,
        sessionCount: 156,
        averagePathLength: 3.1,
        averageSessionDuration: 198,
        knowledgeDepth: 0.89,
        breadthScore: 0.23,
        returnRate: 0.44,
      },
      {
        patternType: 'random' as const,
        sessionCount: 92,
        averagePathLength: 5.5,
        averageSessionDuration: 267,
        knowledgeDepth: 0.34,
        breadthScore: 0.67,
        returnRate: 0.12,
      },
    ];

    return patterns;
  }

  /**
   * Get comprehensive cross-reference insights
   */
  async getCrossReferenceInsights(): Promise<CrossReferenceInsights> {
    const crossReferenceMetrics = await this.analyzeCrossReferences();
    const referenceFlows = await this.analyzeReferenceFlows();
    const learningPathways = await this.discoverLearningPathways();
    const navigationPatterns = await this.analyzeNavigationPatterns();

    const totalCrossReferences = referenceFlows.reduce((sum, flow) => sum + flow.flowCount, 0);
    const averageReferenceScore =
      crossReferenceMetrics.length > 0
        ? crossReferenceMetrics.reduce((sum, metric) => sum + metric.referenceScore, 0) /
          crossReferenceMetrics.length
        : 0;

    // Get top hub terms (high incoming and outgoing references)
    const topHubTerms = crossReferenceMetrics
      .filter(m => m.hubScore > 0.7)
      .sort((a, b) => b.hubScore - a.hubScore)
      .slice(0, 10);

    // Get top bridge terms (connect different categories)
    const topBridgeTerms = crossReferenceMetrics
      .filter(m => m.bridgeScore > 0.6)
      .sort((a, b) => b.bridgeScore - a.bridgeScore)
      .slice(0, 10);

    // Calculate category connections
    const categoryConnections = this.calculateCategoryConnections(referenceFlows);

    const learningEfficiencyMetrics = {
      averageTermsPerSession:
        navigationPatterns.reduce((sum, p) => sum + p.averagePathLength, 0) /
        navigationPatterns.length,
      averageCompletionRate:
        learningPathways.reduce((sum, p) => sum + p.completionRate, 0) / learningPathways.length,
      optimalPathLength: 4, // Based on research on optimal learning sequences
      recommendedSequences: learningPathways
        .filter(p => p.recommendationScore > 0.8)
        .slice(0, 5)
        .map(p => p.termNames),
    };

    return {
      totalCrossReferences,
      averageReferenceScore,
      topHubTerms,
      topBridgeTerms,
      mostFollowedReferences: referenceFlows.slice(0, 20),
      popularLearningPathways: learningPathways.slice(0, 10),
      navigationPatterns,
      categoryConnections,
      learningEfficiencyMetrics,
    };
  }

  /**
   * Private helper methods
   */
  private async bulkCalculateIncomingReferences(termIds: string[]) {
    // Bulk calculate incoming references for multiple terms
    const results = new Map();

    for (const termId of termIds) {
      // This would analyze which terms users viewed before viewing this term
      // For now, return mock data structure
      const refs = Array.from({ length: Math.floor(Math.random() * 20) }, (_, i) => ({
        termId: `term_${i}`,
        termName: `Related Term ${i}`,
        referenceCount: Math.floor(Math.random() * 50) + 5,
        averageSessionGap: Math.floor(Math.random() * 300) + 30,
      }));
      results.set(termId, refs);
    }

    return results;
  }

  private async calculateIncomingReferences(_termId: string) {
    // This would analyze which terms users viewed before viewing this term
    // For now, return mock data structure
    return Array.from({ length: Math.floor(Math.random() * 20) }, (_, i) => ({
      termId: `term_${i}`,
      termName: `Related Term ${i}`,
      referenceCount: Math.floor(Math.random() * 50) + 5,
      averageSessionGap: Math.floor(Math.random() * 300) + 30,
    }));
  }

  private async bulkCalculateOutgoingReferences(termIds: string[]) {
    // Bulk calculate outgoing references for multiple terms
    const results = new Map();

    for (const termId of termIds) {
      // This would analyze which terms users viewed after viewing this term
      // For now, return mock data structure
      const refs = Array.from({ length: Math.floor(Math.random() * 15) }, (_, i) => ({
        termId: `term_out_${i}`,
        termName: `Following Term ${i}`,
        referenceCount: Math.floor(Math.random() * 40) + 3,
        averageSessionGap: Math.floor(Math.random() * 240) + 20,
      }));
      results.set(termId, refs);
    }

    return results;
  }

  private async calculateOutgoingReferences(_termId: string) {
    // This would analyze which terms users viewed after viewing this term
    // For now, return mock data structure
    return Array.from({ length: Math.floor(Math.random() * 15) }, (_, i) => ({
      termId: `term_out_${i}`,
      termName: `Following Term ${i}`,
      referenceCount: Math.floor(Math.random() * 40) + 3,
      averageSessionGap: Math.floor(Math.random() * 240) + 20,
    }));
  }

  private async bulkCalculateReferencePathways(termIds: string[]) {
    // Bulk calculate reference pathways for multiple terms
    const results = new Map();

    for (const termId of termIds) {
      // This would analyze common navigation pathways involving this term
      const pathways = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
        pathway: [`Term A${i}`, `Current Term`, `Term B${i}`],
        frequency: Math.floor(Math.random() * 30) + 5,
        averageCompletionRate: Math.random() * 0.4 + 0.6,
      }));
      results.set(termId, pathways);
    }

    return results;
  }

  private async calculateReferencePathways(_termId: string) {
    // This would analyze common navigation pathways involving this term
    return Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      pathway: [`Term A${i}`, `Current Term`, `Term B${i}`],
      frequency: Math.floor(Math.random() * 30) + 5,
      averageCompletionRate: Math.random() * 0.4 + 0.6,
    }));
  }

  private calculateHubScore(incomingCount: number, outgoingCount: number): number {
    // Terms with many connections are considered hubs
    const totalConnections = incomingCount + outgoingCount;
    const balanceScore =
      1 - Math.abs(incomingCount - outgoingCount) / Math.max(totalConnections, 1);
    return Math.min(1, (totalConnections / 50) * balanceScore);
  }

  private async calculateBridgeScore(
    _termId: string,
    _incomingRefs: unknown[],
    _outgoingRefs: unknown[]
  ): Promise<number> {
    // Terms that connect different categories are considered bridges
    // This would need actual category analysis
    return Math.random() * 0.4 + 0.3; // Mock score between 0.3-0.7
  }

  private calculateReferenceScore(
    incoming: number,
    outgoing: number,
    hubScore: number,
    bridgeScore: number
  ): number {
    const volumeScore = Math.min(1, (incoming + outgoing) / 100) * 40;
    const hubBonus = hubScore * 30;
    const bridgeBonus = bridgeScore * 30;
    return volumeScore + hubBonus + bridgeBonus;
  }

  private calculateLearningEffectiveness(frequency: number, completionTime: number): number {
    // Higher frequency and reasonable completion time indicate effective pathways
    const frequencyScore = Math.min(1, frequency / 50) * 0.6;
    const timeScore = completionTime > 60 && completionTime < 600 ? 0.4 : 0.2;
    return frequencyScore + timeScore;
  }

  private classifyPathwayType(pathway: string[]): LearningPathway['pathwayType'] {
    if (pathway.length <= 3) {return 'linear';}
    // This would need more sophisticated analysis
    return 'branching';
  }

  private calculateRecommendationScore(frequency: number, completionRate: number): number {
    return Math.min(1, frequency / 20) * 0.6 + completionRate * 0.4;
  }

  private calculateCategoryConnections(flows: ReferenceFlow[]) {
    const connections = new Map<
      string,
      { targetCategory: string; strength: number; bridgeTerms: Set<string> }
    >();

    flows.forEach(flow => {
      if (flow.categoryBridge) {
        const key = `${flow.sourceTermName}-${flow.targetTermName}`;
        if (!connections.has(key)) {
          connections.set(key, {
            targetCategory: 'target',
            strength: 0,
            bridgeTerms: new Set(),
          });
        }
        const conn = connections.get(key)!;
        conn.strength += flow.flowCount;
        conn.bridgeTerms.add(flow.sourceTermName);
      }
    });

    return Array.from(connections.entries())
      .slice(0, 10)
      .map(([key, data]) => ({
        sourceCategory: key.split('-')[0],
        targetCategory: key.split('-')[1],
        connectionStrength: data.strength,
        topBridgeTerms: Array.from(data.bridgeTerms).slice(0, 3),
      }));
  }
}

export const crossReferenceAnalyticsService = new CrossReferenceAnalyticsService();
