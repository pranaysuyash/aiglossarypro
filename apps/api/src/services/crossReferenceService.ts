/**
 * Cross-Reference Service for Automatic Term Linking
 * Automatically identifies and links terms within definitions
 */

import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { terms } from '@aiglossarypro/shared/schema';
import { db } from '@aiglossarypro/database';
import { log as logger } from '../utils/logger';

export interface CrossReference {
  termId: string;
  termName: string;
  slug: string;
  mentions: Array<{
    termId: string;
    termName: string;
    context: string;
    position: number;
  }>;
}

export interface LinkingResult {
  originalText: string;
  linkedText: string;
  linksAdded: number;
  linksFound: Array<{
    termName: string;
    termId: string;
    slug: string;
  }>;
}

class CrossReferenceService {
  private termCache: Map<string, { id: string; name: string; slug: string }> = new Map();
  private lastCacheUpdate: Date = new Date(0);
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Initialize and cache all terms for efficient lookups
   */
  async initializeTermCache(): Promise<void> {
    try {
      const allTerms = await db
        .select({
          id: terms.id,
          name: terms.name,
          slug: sql<string>`LOWER(REPLACE(${terms.name}, ' ', '-'))`, // Generate slug
        })
        .from(terms);

      this.termCache.clear();

      allTerms.forEach(term => {
        // Store by exact name (case-insensitive key)
        const key = term.name.toLowerCase();
        this.termCache.set(key, {
          id: term.id,
          name: term.name,
          slug: term.slug || this.generateSlug(term.name),
        });

        // Also store common variations
        const variations = this.generateTermVariations(term.name);
        variations.forEach(variation => {
          if (!this.termCache.has(variation.toLowerCase())) {
            this.termCache.set(variation.toLowerCase(), {
              id: term.id,
              name: term.name,
              slug: term.slug || this.generateSlug(term.name),
            });
          }
        });
      });

      this.lastCacheUpdate = new Date();
      logger.info('Term cache initialized', {
        cachedTerms: this.termCache.size,
        type: 'cross_reference_cache',
      });
    } catch (error) {
      logger.error('Error initializing term cache', {
        error: error instanceof Error ? error.message : String(error),
        type: 'cross_reference_cache_error',
      });
    }
  }

  /**
   * Generate common variations of a term
   */
  private generateTermVariations(termName: string): string[] {
    const variations = [termName];

    // Add plural forms
    if (!termName.endsWith('s')) {
      variations.push(`${termName}s`);
    }

    // Add singular form if plural
    if (termName.endsWith('s') && termName.length > 3) {
      variations.push(termName.slice(0, -1));
    }

    // Add acronym if applicable (e.g., "Machine Learning" -> "ML")
    const words = termName.split(' ');
    if (words.length > 1) {
      const acronym = words
        .map(word => word[0])
        .join('')
        .toUpperCase();
      if (acronym.length >= 2 && acronym.length <= 5) {
        variations.push(acronym);
      }
    }

    // Add hyphenated version
    if (termName.includes(' ')) {
      variations.push(termName.replace(/\s+/g, '-'));
    }

    return variations;
  }

  /**
   * Generate URL-friendly slug from term name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Check if cache needs refresh
   */
  private async ensureCacheIsValid(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastCacheUpdate.getTime() > this.CACHE_DURATION) {
      await this.initializeTermCache();
    }
  }

  /**
   * Process text and add automatic links to mentioned terms
   */
  async processTextForLinks(text: string, excludeTermId?: string): Promise<LinkingResult> {
    await this.ensureCacheIsValid();

    if (!text || text.trim().length === 0) {
      return {
        originalText: text,
        linkedText: text,
        linksAdded: 0,
        linksFound: [],
      };
    }

    const linksFound: Array<{ termName: string; termId: string; slug: string }> = [];
    let linkedText = text;
    let linksAdded = 0;

    // Sort terms by length (longer first) to avoid partial matches
    const sortedTerms = Array.from(this.termCache.entries()).sort(
      (a, b) => b[0].length - a[0].length
    );

    // Keep track of already linked positions to avoid double-linking
    const linkedPositions: Array<{ start: number; end: number }> = [];

    for (const [termKey, termData] of sortedTerms) {
      // Skip self-references
      if (excludeTermId && termData.id === excludeTermId) {
        continue;
      }

      // Skip very short terms to avoid false positives
      if (termKey.length < 3) {
        continue;
      }

      // Find all occurrences of this term
      const regex = new RegExp(`\\b${this.escapeRegex(termKey)}\\b`, 'gi');
      let match;

      while ((match = regex.exec(linkedText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        // Check if this position is already linked
        const isAlreadyLinked = linkedPositions.some(
          pos => (start >= pos.start && start < pos.end) || (end > pos.start && end <= pos.end)
        );

        if (!isAlreadyLinked) {
          // Check if it's inside an existing HTML tag
          const beforeMatch = linkedText.substring(0, start);
          const openTags = (beforeMatch.match(/</g) || []).length;
          const closeTags = (beforeMatch.match(/>/g) || []).length;

          // If inside a tag, skip
          if (openTags > closeTags) {
            continue;
          }

          // Create the link
          const originalTerm = match[0];
          const link = `<a href="/terms/${termData.slug}" class="term-link" title="Learn more about ${termData.name}">${originalTerm}</a>`;

          // Replace the text
          linkedText = linkedText.substring(0, start) + link + linkedText.substring(end);

          // Update regex lastIndex since we changed the string
          regex.lastIndex = start + link.length;

          // Track the linked position (adjusted for the new length)
          linkedPositions.push({
            start: start,
            end: start + link.length,
          });

          // Track this link
          if (!linksFound.some(l => l.termId === termData.id)) {
            linksFound.push({
              termName: termData.name,
              termId: termData.id,
              slug: termData.slug,
            });
          }

          linksAdded++;
        }
      }
    }

    return {
      originalText: text,
      linkedText,
      linksAdded,
      linksFound,
    };
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Find all cross-references for a specific term
   */
  async findCrossReferences(termId: string): Promise<CrossReference[]> {
    await this.ensureCacheIsValid();

    try {
      // Get the term details
      const term = await db.select().from(terms).where(eq(terms.id, termId)).limit(1);

      if (term.length === 0) {
        return [];
      }

      const targetTerm = term[0];
      const crossReferences: CrossReference[] = [];

      // Find other terms that mention this term
      const mentioningTerms = await db
        .select({
          id: terms.id,
          name: terms.name,
          definition: terms.definition,
          shortDefinition: terms.shortDefinition,
        })
        .from(terms)
        .where(
          and(
            sql`${terms.id} != ${termId}`, // Exclude self
            or(
              ilike(terms.definition, `%${targetTerm.name}%`),
              ilike(terms.shortDefinition, `%${targetTerm.name}%`)
            )
          )
        );

      for (const mentioningTerm of mentioningTerms) {
        const mentions: Array<{
          termId: string;
          termName: string;
          context: string;
          position: number;
        }> = [];

        // Check definition for mentions
        if (mentioningTerm.definition) {
          const position = mentioningTerm.definition
            .toLowerCase()
            .indexOf(targetTerm.name.toLowerCase());
          if (position !== -1) {
            const context = this.extractContext(
              mentioningTerm.definition,
              position,
              targetTerm.name.length
            );
            mentions.push({
              termId: mentioningTerm.id,
              termName: mentioningTerm.name,
              context,
              position,
            });
          }
        }

        // Check short definition for mentions
        if (mentioningTerm.shortDefinition) {
          const position = mentioningTerm.shortDefinition
            .toLowerCase()
            .indexOf(targetTerm.name.toLowerCase());
          if (position !== -1) {
            const context = this.extractContext(
              mentioningTerm.shortDefinition,
              position,
              targetTerm.name.length
            );
            mentions.push({
              termId: mentioningTerm.id,
              termName: mentioningTerm.name,
              context,
              position,
            });
          }
        }

        if (mentions.length > 0) {
          crossReferences.push({
            termId: mentioningTerm.id,
            termName: mentioningTerm.name,
            slug: this.generateSlug(mentioningTerm.name),
            mentions,
          });
        }
      }

      return crossReferences;
    } catch (error) {
      logger.error('Error finding cross-references', {
        termId,
        error: error instanceof Error ? error.message : String(error),
        type: 'cross_reference_search_error',
      });
      return [];
    }
  }

  /**
   * Extract context around a mention
   */
  private extractContext(
    text: string,
    position: number,
    termLength: number,
    contextLength = 100
  ): string {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(text.length, position + termLength + contextLength);

    let context = text.substring(start, end);

    // Add ellipsis if truncated
    if (start > 0) {context = `...${context}`;}
    if (end < text.length) {context = `${context}...`;}

    return context.trim();
  }

  /**
   * Bulk process multiple terms for cross-references
   */
  async bulkProcessTerms(termIds: string[]): Promise<Map<string, LinkingResult>> {
    const results = new Map<string, LinkingResult>();

    for (const termId of termIds) {
      try {
        const term = await db.select().from(terms).where(eq(terms.id, termId)).limit(1);

        if (term.length > 0) {
          const linkingResult = await this.processTextForLinks(term[0].definition || '', termId);
          results.set(termId, linkingResult);
        }
      } catch (error) {
        logger.error('Error processing term for cross-references', {
          termId,
          error: error instanceof Error ? error.message : String(error),
          type: 'cross_reference_bulk_process_error',
        });
      }
    }

    return results;
  }

  /**
   * Update term definitions with automatic links
   */
  async updateTermWithLinks(termId: string): Promise<boolean> {
    try {
      const term = await db.select().from(terms).where(eq(terms.id, termId)).limit(1);

      if (term.length === 0) {
        return false;
      }

      const linkingResult = await this.processTextForLinks(term[0].definition || '', termId);

      if (linkingResult.linksAdded > 0) {
        await db
          .update(terms)
          .set({
            definition: linkingResult.linkedText,
            updatedAt: new Date(),
          })
          .where(eq(terms.id, termId));

        logger.info('Added cross-reference links to term', {
          termId,
          termName: term[0].name,
          linksAdded: linkingResult.linksAdded,
          type: 'cross_reference_update',
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error updating term with links', {
        termId,
        error: error instanceof Error ? error.message : String(error),
        type: 'cross_reference_update_error',
      });
      return false;
    }
  }
}

// Export singleton instance
export const crossReferenceService = new CrossReferenceService();
