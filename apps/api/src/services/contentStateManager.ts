/**
 * Content State Management System
 *
 * Purpose: Unified state machine for content lifecycle across all generation systems
 * Fixes: Inconsistent state names across sectionItems, aiContentVerification, modelContentVersions
 *
 * CRITICAL: All content operations must use this state manager!
 */

import { db } from '@aiglossarypro/database';
import { eq, and, desc } from 'drizzle-orm';
import { log } from '../utils/logger';

/**
 * Unified Content States
 *
 * Lifecycle: DRAFT → GENERATING → EVALUATING → (IMPROVING) → PENDING_REVIEW → APPROVED → PUBLISHED
 *
 * Error states: FLAGGED, REJECTED
 */
export enum ContentState {
  DRAFT = 'DRAFT',                     // Initial creation, not yet generated
  GENERATING = 'GENERATING',           // AI is generating content
  EVALUATING = 'EVALUATING',           // Quality evaluation in progress
  IMPROVING = 'IMPROVING',             // Regenerating based on feedback (optional)
  PENDING_REVIEW = 'PENDING_REVIEW',   // Awaiting human review
  EXPERT_REVIEW = 'EXPERT_REVIEW',     // Requires expert validation
  APPROVED = 'APPROVED',               // Approved, ready to publish
  PUBLISHED = 'PUBLISHED',             // Live on site
  FLAGGED = 'FLAGGED',                 // Quality issue identified
  REJECTED = 'REJECTED',               // Needs complete rewrite
  ARCHIVED = 'ARCHIVED',               // Deprecated content
}

/**
 * State Transition Metadata
 */
export interface StateTransition {
  from: ContentState;
  to: ContentState;
  reason?: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Content State Record (to be persisted in database)
 */
export interface ContentStateRecord {
  id: string;
  termId: string;
  sectionName?: string;
  columnId?: string;
  contentType: 'section' | 'column';

  // Current state
  state: ContentState;
  previousState?: ContentState;

  // Transition history
  transitionReason?: string;
  transitionMetadata?: Record<string, any>;
  transitionedBy?: string;
  transitionedAt: Date;

  // Quality metadata
  qualityScore?: number;
  qualityTier?: 'excellent' | 'good' | 'acceptable' | 'poor';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Valid State Transitions
 *
 * Defines which state transitions are allowed
 */
const VALID_TRANSITIONS: Record<ContentState, ContentState[]> = {
  [ContentState.DRAFT]: [ContentState.GENERATING],

  [ContentState.GENERATING]: [
    ContentState.EVALUATING,
    ContentState.FLAGGED,
    ContentState.REJECTED, // If generation fails completely
  ],

  [ContentState.EVALUATING]: [
    ContentState.IMPROVING,        // Quality < threshold
    ContentState.PENDING_REVIEW,   // Quality acceptable
    ContentState.APPROVED,         // Quality excellent (auto-approve)
    ContentState.FLAGGED,          // Evaluation identifies issues
  ],

  [ContentState.IMPROVING]: [
    ContentState.EVALUATING,       // Re-evaluate after improvement
    ContentState.REJECTED,         // Can't improve further
  ],

  [ContentState.PENDING_REVIEW]: [
    ContentState.EXPERT_REVIEW,    // Escalate to expert
    ContentState.APPROVED,         // Human approves
    ContentState.REJECTED,         // Human rejects
  ],

  [ContentState.EXPERT_REVIEW]: [
    ContentState.APPROVED,
    ContentState.REJECTED,
    ContentState.IMPROVING,        // Expert requests changes
  ],

  [ContentState.APPROVED]: [
    ContentState.PUBLISHED,
    ContentState.FLAGGED,          // Issue discovered before publishing
  ],

  [ContentState.PUBLISHED]: [
    ContentState.FLAGGED,          // Issue discovered in production
    ContentState.ARCHIVED,         // Deprecate content
  ],

  [ContentState.FLAGGED]: [
    ContentState.IMPROVING,        // Fix the issue
    ContentState.REJECTED,         // Can't be fixed
    ContentState.EXPERT_REVIEW,    // Escalate to expert
  ],

  [ContentState.REJECTED]: [
    ContentState.DRAFT,            // Start over
    ContentState.ARCHIVED,         // Give up
  ],

  [ContentState.ARCHIVED]: [],    // Terminal state
};

/**
 * Auto-approval Quality Thresholds
 */
const AUTO_APPROVAL_THRESHOLDS = {
  excellent: 8.5,  // Auto-approve and publish
  good: 7.0,       // Auto-approve, human can review before publish
  acceptable: 5.5, // Requires human review
  poor: 0,         // Requires improvement or rejection
};

/**
 * Content State Manager
 *
 * Centralized state machine for all content operations
 */
export class ContentStateManager {
  /**
   * Validate if a state transition is allowed
   */
  isValidTransition(from: ContentState, to: ContentState): boolean {
    const validNextStates = VALID_TRANSITIONS[from];
    return validNextStates.includes(to);
  }

  /**
   * Get all valid next states for current state
   */
  getValidNextStates(currentState: ContentState): ContentState[] {
    return VALID_TRANSITIONS[currentState] || [];
  }

  /**
   * Create initial content state record
   */
  async createContentState(params: {
    termId: string;
    sectionName?: string;
    columnId?: string;
    contentType: 'section' | 'column';
    userId?: string;
  }): Promise<ContentStateRecord> {
    const now = new Date();

    const record: ContentStateRecord = {
      id: `${params.termId}_${params.sectionName || params.columnId}`,
      termId: params.termId,
      sectionName: params.sectionName,
      columnId: params.columnId,
      contentType: params.contentType,
      state: ContentState.DRAFT,
      transitionedBy: params.userId,
      transitionedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    log.info('Content state created', {
      contentId: record.id,
      state: record.state,
      contentType: record.contentType,
    });

    return record;
  }

  /**
   * Transition content to new state
   *
   * @throws Error if transition is invalid
   */
  async transition(
    contentId: string,
    to: ContentState,
    params?: {
      reason?: string;
      userId?: string;
      metadata?: Record<string, any>;
      qualityScore?: number;
    }
  ): Promise<StateTransition> {
    // In a real implementation, this would fetch from database
    // For now, this is the business logic

    const transition: StateTransition = {
      from: ContentState.DRAFT, // Would fetch current state from DB
      to,
      reason: params?.reason,
      userId: params?.userId,
      metadata: params?.metadata,
      timestamp: new Date(),
    };

    // Validate transition
    if (!this.isValidTransition(transition.from, to)) {
      throw new Error(
        `Invalid state transition: ${transition.from} → ${to}. ` +
        `Valid transitions from ${transition.from}: ${this.getValidNextStates(transition.from).join(', ')}`
      );
    }

    log.info('Content state transition', {
      contentId,
      from: transition.from,
      to: transition.to,
      reason: transition.reason,
      userId: transition.userId,
    });

    // TODO: Persist to database
    // await db.update(contentStates)
    //   .set({
    //     state: to,
    //     previousState: transition.from,
    //     transitionReason: params?.reason,
    //     transitionMetadata: params?.metadata,
    //     transitionedBy: params?.userId,
    //     transitionedAt: transition.timestamp,
    //     updatedAt: transition.timestamp,
    //   })
    //   .where(eq(contentStates.id, contentId));

    return transition;
  }

  /**
   * Determine next state based on quality evaluation
   *
   * Auto-decides state transition based on quality score
   */
  async transitionBasedOnQuality(
    contentId: string,
    qualityScore: number,
    params?: {
      userId?: string;
      feedback?: string;
    }
  ): Promise<ContentState> {
    let nextState: ContentState;
    let reason: string;

    if (qualityScore >= AUTO_APPROVAL_THRESHOLDS.excellent) {
      nextState = ContentState.APPROVED;
      reason = `Excellent quality score (${qualityScore}/10) - auto-approved`;
    } else if (qualityScore >= AUTO_APPROVAL_THRESHOLDS.good) {
      nextState = ContentState.PENDING_REVIEW;
      reason = `Good quality score (${qualityScore}/10) - pending review`;
    } else if (qualityScore >= AUTO_APPROVAL_THRESHOLDS.acceptable) {
      nextState = ContentState.IMPROVING;
      reason = `Acceptable quality score (${qualityScore}/10) - needs improvement`;
    } else {
      nextState = ContentState.REJECTED;
      reason = `Poor quality score (${qualityScore}/10) - rejected`;
    }

    await this.transition(contentId, nextState, {
      reason,
      userId: params?.userId,
      metadata: {
        qualityScore,
        feedback: params?.feedback,
        autoTransition: true,
      },
      qualityScore,
    });

    return nextState;
  }

  /**
   * Get quality tier from score
   */
  getQualityTier(qualityScore: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
    if (qualityScore >= AUTO_APPROVAL_THRESHOLDS.excellent) return 'excellent';
    if (qualityScore >= AUTO_APPROVAL_THRESHOLDS.good) return 'good';
    if (qualityScore >= AUTO_APPROVAL_THRESHOLDS.acceptable) return 'acceptable';
    return 'poor';
  }

  /**
   * Check if content can be published
   */
  canPublish(state: ContentState): boolean {
    return state === ContentState.APPROVED;
  }

  /**
   * Check if content needs human review
   */
  needsReview(state: ContentState): boolean {
    return [
      ContentState.PENDING_REVIEW,
      ContentState.EXPERT_REVIEW,
      ContentState.FLAGGED,
    ].includes(state);
  }

  /**
   * Check if content is in error state
   */
  isErrorState(state: ContentState): boolean {
    return [
      ContentState.FLAGGED,
      ContentState.REJECTED,
    ].includes(state);
  }

  /**
   * Get state color for UI display
   */
  getStateColor(state: ContentState): string {
    const colors: Record<ContentState, string> = {
      [ContentState.DRAFT]: 'gray',
      [ContentState.GENERATING]: 'blue',
      [ContentState.EVALUATING]: 'yellow',
      [ContentState.IMPROVING]: 'orange',
      [ContentState.PENDING_REVIEW]: 'purple',
      [ContentState.EXPERT_REVIEW]: 'indigo',
      [ContentState.APPROVED]: 'green',
      [ContentState.PUBLISHED]: 'teal',
      [ContentState.FLAGGED]: 'red',
      [ContentState.REJECTED]: 'red',
      [ContentState.ARCHIVED]: 'gray',
    };

    return colors[state] || 'gray';
  }

  /**
   * Get state description for UI
   */
  getStateDescription(state: ContentState): string {
    const descriptions: Record<ContentState, string> = {
      [ContentState.DRAFT]: 'Content is in draft state, not yet generated',
      [ContentState.GENERATING]: 'AI is currently generating content',
      [ContentState.EVALUATING]: 'Quality evaluation in progress',
      [ContentState.IMPROVING]: 'Content is being improved based on feedback',
      [ContentState.PENDING_REVIEW]: 'Awaiting human review',
      [ContentState.EXPERT_REVIEW]: 'Requires expert validation',
      [ContentState.APPROVED]: 'Approved and ready to publish',
      [ContentState.PUBLISHED]: 'Live on production site',
      [ContentState.FLAGGED]: 'Quality issue identified - needs attention',
      [ContentState.REJECTED]: 'Rejected - needs complete rewrite',
      [ContentState.ARCHIVED]: 'Archived and no longer active',
    };

    return descriptions[state] || 'Unknown state';
  }
}

/**
 * Singleton instance
 */
export const contentStateManager = new ContentStateManager();

/**
 * Helper functions for common state operations
 */

export async function startContentGeneration(
  termId: string,
  contentIdentifier: string,
  contentType: 'section' | 'column',
  userId?: string
): Promise<void> {
  const contentId = `${termId}_${contentIdentifier}`;

  await contentStateManager.transition(contentId, ContentState.GENERATING, {
    reason: 'Content generation started',
    userId,
  });
}

export async function completeContentGeneration(
  termId: string,
  contentIdentifier: string,
  qualityScore?: number,
  userId?: string
): Promise<ContentState> {
  const contentId = `${termId}_${contentIdentifier}`;

  // First transition to EVALUATING
  await contentStateManager.transition(contentId, ContentState.EVALUATING, {
    reason: 'Content generated, evaluating quality',
    userId,
  });

  // Then auto-transition based on quality
  if (qualityScore !== undefined) {
    return await contentStateManager.transitionBasedOnQuality(
      contentId,
      qualityScore,
      { userId }
    );
  }

  return ContentState.EVALUATING;
}

export async function flagContent(
  termId: string,
  contentIdentifier: string,
  reason: string,
  userId?: string
): Promise<void> {
  const contentId = `${termId}_${contentIdentifier}`;

  await contentStateManager.transition(contentId, ContentState.FLAGGED, {
    reason,
    userId,
  });
}

export async function publishContent(
  termId: string,
  contentIdentifier: string,
  userId?: string
): Promise<void> {
  const contentId = `${termId}_${contentIdentifier}`;

  await contentStateManager.transition(contentId, ContentState.PUBLISHED, {
    reason: 'Content published to production',
    userId,
  });
}
