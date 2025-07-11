import type { Job } from 'bullmq';
import { and, eq, lte, or } from 'drizzle-orm';
import { enhancedTerms, sectionItems, sections } from '../../../shared/enhancedSchema';
import { db } from '../../db';
import { aiQualityEvaluationService } from '../../services/aiQualityEvaluationService';
import { qualityAnalyticsService } from '../../services/qualityAnalyticsService';
import { log as logger } from '../../utils/logger';
import { emailService as email } from '../../services/emailService';

export interface QualityEvaluationJobData {
  type: 'single' | 'batch' | 'scheduled-audit' | 'auto-evaluation';
  termId?: string;
  termIds?: string[];
  sectionName?: string;
  options?: {
    model?: string;
    forceRegenerate?: boolean;
    emailReport?: boolean;
    recipients?: string[];
    qualityThreshold?: number;
  };
  scheduledAudit?: {
    auditId: string;
    schedule: 'daily' | 'weekly' | 'monthly';
    includeRecommendations: boolean;
  };
}

/**
 * Process quality evaluation jobs
 */
export async function processQualityEvaluationJob(job: Job<QualityEvaluationJobData>) {
  const { type, termId, termIds, sectionName, options, scheduledAudit } = job.data;

  logger.info(`Processing quality evaluation job: ${type}`, {
    jobId: job.id,
    termId,
    termIds: termIds?.length,
    options,
  });

  try {
    switch (type) {
      case 'single':
        await processSingleEvaluation(job);
        break;

      case 'batch':
        await processBatchEvaluation(job);
        break;

      case 'scheduled-audit':
        await processScheduledAudit(job);
        break;

      case 'auto-evaluation':
        await processAutoEvaluation(job);
        break;

      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    logger.info(`Quality evaluation job completed`, {
      jobId: job.id,
      type,
    });
  } catch (error) {
    logger.error('Error processing quality evaluation job:', {
      error: error instanceof Error ? error.message : String(error),
      jobId: job.id,
      type,
    });
    throw error;
  }
}

/**
 * Process single term evaluation
 */
async function processSingleEvaluation(job: Job<QualityEvaluationJobData>) {
  const { termId, sectionName, options } = job.data;

  if (!termId) {
    throw new Error('termId is required for single evaluation');
  }

  // Get term content
  const term = await db.select().from(enhancedTerms).where(eq(enhancedTerms.id, termId)).limit(1);

  if (term.length === 0) {
    throw new Error(`Term not found: ${termId}`);
  }

  let content = '';
  let contentType = 'general';

  if (sectionName) {
    // Get specific section content
    const section = await db
      .select()
      .from(sections)
      .where(and(eq(sections.termId, termId), eq(sections.name, sectionName)))
      .limit(1);

    if (section.length > 0) {
      const items = await db
        .select()
        .from(sectionItems)
        .where(eq(sectionItems.sectionId, section[0].id));

      content = items.map((item) => item.content).join('\n\n');
      contentType = mapSectionToContentType(sectionName);
    }
  } else {
    // Get full term content
    content = `${term[0].name}\n\n${term[0].fullDefinition || ''}`;
  }

  // Evaluate content
  const result = await aiQualityEvaluationService.evaluateContent({
    termId,
    sectionName,
    content,
    contentType: contentType as 'definition' | 'example' | 'tutorial' | 'theory' | 'application' | 'general',
    model: options?.model,
  });

  // Update job progress
  await job.updateProgress(100);

  // Send email if requested
  if (options?.emailReport && options?.recipients && options.recipients.length > 0) {
    await sendEvaluationReport(term[0].name, result, options.recipients);
  }

  return result;
}

/**
 * Process batch evaluation
 */
async function processBatchEvaluation(job: Job<QualityEvaluationJobData>) {
  const { termIds, options } = job.data;

  if (!termIds || termIds.length === 0) {
    throw new Error('termIds array is required for batch evaluation');
  }

  const evaluations = [];
  let processed = 0;

  for (const termId of termIds) {
    try {
      // Get term content
      const term = await db
        .select()
        .from(enhancedTerms)
        .where(eq(enhancedTerms.id, termId))
        .limit(1);

      if (term.length > 0) {
        const content = `${term[0].name}\n\n${term[0].fullDefinition || ''}`;

        evaluations.push({
          termId,
          content,
          contentType: 'general' as const,
          model: options?.model,
        });
      }

      processed++;
      await job.updateProgress((processed / termIds.length) * 100);
    } catch (error) {
      logger.error(`Error preparing evaluation for term ${termId}:`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Batch evaluate
  const result = await aiQualityEvaluationService.batchEvaluate({
    evaluations,
    model: options?.model,
  });

  // Send summary email if requested
  if (options?.emailReport && options?.recipients && options.recipients.length > 0) {
    await sendBatchEvaluationSummary(result, options.recipients);
  }

  return result;
}

/**
 * Process scheduled quality audit
 */
async function processScheduledAudit(job: Job<QualityEvaluationJobData>) {
  const { scheduledAudit, options } = job.data;

  if (!scheduledAudit) {
    throw new Error('scheduledAudit data is required');
  }

  logger.info(`Running scheduled quality audit: ${scheduledAudit.auditId}`);

  // Determine date range based on schedule
  const endDate = new Date();
  let startDate: Date;

  switch (scheduledAudit.schedule) {
    case 'daily':
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
  }

  // Generate quality report
  const report = await qualityAnalyticsService.generateQualityReport(startDate, endDate, {
    includeAllTerms: false,
    minEvaluations: 1,
  });

  // Get flagged content if threshold is set
  let flaggedContent;
  if (options?.qualityThreshold) {
    flaggedContent = await aiQualityEvaluationService.autoFlagLowQualityContent(
      options.qualityThreshold
    );
  }

  // Send audit report
  if (options?.recipients && options.recipients.length > 0) {
    await sendAuditReport(
      report,
      flaggedContent,
      scheduledAudit.includeRecommendations,
      options.recipients
    );
  }

  return {
    auditId: scheduledAudit.auditId,
    reportId: report.reportId,
    summary: report.summary,
    flaggedCount: flaggedContent?.flaggedCount || 0,
  };
}

/**
 * Process auto evaluation for new or updated content
 */
async function processAutoEvaluation(job: Job<QualityEvaluationJobData>) {
  const { options } = job.data;

  logger.info('Running auto evaluation for unevaluated content');

  // Find content that hasn't been evaluated recently
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

  // Get terms with AI-generated content that haven't been evaluated
  const unevaluatedTerms = await db
    .select()
    .from(sectionItems)
    .innerJoin(sections, eq(sections.id, sectionItems.sectionId))
    .where(
      and(
        eq(sectionItems.isAiGenerated, true),
        or(
          eq(sectionItems.verificationStatus, 'unverified'),
          lte(sectionItems.updatedAt, cutoffDate)
        )
      )
    )
    .limit(50); // Process in batches

  const evaluations = [];
  for (const item of unevaluatedTerms) {
    evaluations.push({
      termId: item.sections.termId,
      sectionName: item.sections.name,
      content: item.section_items.content || '',
      contentType: mapSectionToContentType(item.sections.name),
      model: options?.model,
    });
  }

  if (evaluations.length === 0) {
    logger.info('No content requiring auto evaluation');
    return { evaluated: 0 };
  }

  // Batch evaluate
  const result = await aiQualityEvaluationService.batchEvaluate({
    evaluations,
    model: options?.model,
  });

  logger.info(`Auto evaluation completed`, {
    evaluated: result.summary.successCount,
    failed: result.summary.failureCount,
  });

  return {
    evaluated: result.summary.successCount,
    failed: result.summary.failureCount,
    averageScore: result.summary.averageScore,
  };
}

/**
 * Map section name to content type
 */
function mapSectionToContentType(
  sectionName: string
): 'definition' | 'example' | 'tutorial' | 'theory' | 'application' | 'general' {
  const mappings: Record<string, any> = {
    definition: 'definition',
    overview: 'definition',
    examples: 'example',
    'use cases': 'application',
    implementation: 'tutorial',
    code: 'tutorial',
    mathematical: 'theory',
    theory: 'theory',
    applications: 'application',
    practical: 'application',
  };

  const lowerSection = sectionName.toLowerCase();
  for (const [key, value] of Object.entries(mappings)) {
    if (lowerSection.includes(key)) {
      return value;
    }
  }

  return 'general';
}

/**
 * Send evaluation report email
 */
async function sendEvaluationReport(termName: string, result: any, recipients: string[]) {
  const subject = `Quality Evaluation Report: ${termName}`;
  const html = `
    <h2>Quality Evaluation Report</h2>
    <h3>${termName}</h3>
    
    <h4>Overall Score: ${result.overallScore}/10</h4>
    
    <h4>Dimension Scores:</h4>
    <ul>
      <li>Accuracy: ${result.dimensions.accuracy.score}/10</li>
      <li>Clarity: ${result.dimensions.clarity.score}/10</li>
      <li>Completeness: ${result.dimensions.completeness.score}/10</li>
      <li>Relevance: ${result.dimensions.relevance.score}/10</li>
      <li>Style: ${result.dimensions.style.score}/10</li>
      <li>Engagement: ${result.dimensions.engagement.score}/10</li>
    </ul>
    
    <h4>Key Strengths:</h4>
    <ul>
      ${result.summary.strengths.map((s: string) => `<li>${s}</li>`).join('')}
    </ul>
    
    <h4>Areas for Improvement:</h4>
    <ul>
      ${result.summary.improvements.map((i: string) => `<li>${i}</li>`).join('')}
    </ul>
    
    <p>Evaluated on: ${new Date().toISOString()}</p>
  `;

  await email.send({
    to: recipients,
    subject,
    html,
  });
}

/**
 * Send batch evaluation summary email
 */
async function sendBatchEvaluationSummary(result: any, recipients: string[]) {
  const subject = 'Batch Quality Evaluation Summary';
  const html = `
    <h2>Batch Quality Evaluation Summary</h2>
    
    <h3>Summary Statistics:</h3>
    <ul>
      <li>Total Evaluations: ${result.summary.totalEvaluations}</li>
      <li>Successful: ${result.summary.successCount}</li>
      <li>Failed: ${result.summary.failureCount}</li>
      <li>Average Score: ${result.summary.averageScore.toFixed(1)}/10</li>
      <li>Total Cost: $${result.summary.totalCost.toFixed(2)}</li>
      <li>Processing Time: ${(result.summary.processingTime / 1000).toFixed(1)}s</li>
    </ul>
    
    <h3>Score Distribution:</h3>
    <ul>
      <li>Excellent (8.5+): ${result.results.filter((r: any) => r.overallScore >= 8.5).length}</li>
      <li>Good (7.0-8.5): ${result.results.filter((r: any) => r.overallScore >= 7.0 && r.overallScore < 8.5).length}</li>
      <li>Acceptable (5.5-7.0): ${result.results.filter((r: any) => r.overallScore >= 5.5 && r.overallScore < 7.0).length}</li>
      <li>Poor (<5.5): ${result.results.filter((r: any) => r.overallScore < 5.5).length}</li>
    </ul>
    
    <p>Evaluated on: ${new Date().toISOString()}</p>
  `;

  await email.send({
    to: recipients,
    subject,
    html,
  });
}

/**
 * Send audit report email
 */
async function sendAuditReport(
  report: any,
  flaggedContent: any,
  includeRecommendations: boolean,
  recipients: string[]
) {
  const subject = `Quality Audit Report - ${report.reportId}`;
  let html = `
    <h2>Quality Audit Report</h2>
    <p>Report ID: ${report.reportId}</p>
    <p>Period: ${report.period.start.toISOString().split('T')[0]} to ${report.period.end.toISOString().split('T')[0]}</p>
    
    <h3>Summary:</h3>
    <ul>
      <li>Terms Evaluated: ${report.summary.totalTermsEvaluated}</li>
      <li>Average Quality Score: ${report.summary.averageQualityScore.toFixed(1)}/10</li>
      <li>Excellent: ${report.summary.excellentCount}</li>
      <li>Good: ${report.summary.goodCount}</li>
      <li>Acceptable: ${report.summary.acceptableCount}</li>
      <li>Poor: ${report.summary.poorCount}</li>
    </ul>
  `;

  if (flaggedContent && flaggedContent.flaggedCount > 0) {
    html += `
      <h3>Flagged Low Quality Content:</h3>
      <p>${flaggedContent.flaggedCount} terms flagged for review</p>
      <ul>
        ${flaggedContent.flaggedTerms
          .slice(0, 5)
          .map((t: any) => `<li>${t.termName} (Score: ${t.score}) - ${t.issues.join(', ')}</li>`)
          .join('')}
      </ul>
    `;
  }

  if (includeRecommendations && report.recommendations) {
    html += `
      <h3>Recommendations:</h3>
      <h4>Immediate Actions:</h4>
      <ul>
        ${report.recommendations.immediate.map((r: string) => `<li>${r}</li>`).join('')}
      </ul>
      <h4>Short Term:</h4>
      <ul>
        ${report.recommendations.shortTerm.map((r: string) => `<li>${r}</li>`).join('')}
      </ul>
    `;
  }

  html += `<p>Generated on: ${report.generatedAt.toISOString()}</p>`;

  await email.send({
    to: recipients,
    subject,
    html,
  });
}
