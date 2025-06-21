import OpenAI from 'openai';
import NodeCache from 'node-cache';
import { ITerm, ICategory } from '../client/src/interfaces/interfaces';

// Types for AI responses
export interface AIDefinitionResponse {
  shortDefinition: string;
  definition: string;
  characteristics?: string[];
  applications?: {
    name: string;
    description: string;
  }[];
  relatedTerms?: string[];
  mathFormulation?: string;
}

export interface AITermSuggestionsResponse {
  suggestions: {
    term: string;
    shortDefinition: string;
    category: string;
    reason: string;
  }[];
}

export interface AICategoryResponse {
  category: string;
  confidence: number;
  explanation: string;
  suggestedSubcategories?: string[];
}

export interface AISearchResponse {
  matches: {
    termId: string;
    relevanceScore: number;
    explanation: string;
  }[];
}

// Rate limiting configuration
interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
}

class AIService {
  private openai: OpenAI;
  private cache: NodeCache;
  private rateLimiter: Map<string, number[]> = new Map();
  private readonly rateLimitConfig: RateLimitConfig = {
    maxRequestsPerMinute: 20,
    maxRequestsPerHour: 100,
    maxRequestsPerDay: 500
  };

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Cache for 1 hour by default, 24 hours for definitions
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 hour default
      checkperiod: 600 // Check for expired keys every 10 minutes
    });

    // Clean up rate limiter every hour
    setInterval(() => this.cleanupRateLimiter(), 60 * 60 * 1000);
  }

  // Rate limiting logic
  private checkRateLimit(identifier: string = 'default'): boolean {
    const now = Date.now();
    const requests = this.rateLimiter.get(identifier) || [];
    
    // Clean old requests
    const validRequests = requests.filter(timestamp => {
      const age = now - timestamp;
      return age < 24 * 60 * 60 * 1000; // Keep requests from last 24 hours
    });

    // Check limits
    const lastMinute = validRequests.filter(ts => now - ts < 60 * 1000).length;
    const lastHour = validRequests.filter(ts => now - ts < 60 * 60 * 1000).length;
    const lastDay = validRequests.length;

    if (lastMinute >= this.rateLimitConfig.maxRequestsPerMinute ||
        lastHour >= this.rateLimitConfig.maxRequestsPerHour ||
        lastDay >= this.rateLimitConfig.maxRequestsPerDay) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.rateLimiter.set(identifier, validRequests);
    return true;
  }

  private cleanupRateLimiter(): void {
    const now = Date.now();
    for (const [key, requests] of this.rateLimiter.entries()) {
      const validRequests = requests.filter(timestamp => 
        now - timestamp < 24 * 60 * 60 * 1000
      );
      if (validRequests.length === 0) {
        this.rateLimiter.delete(key);
      } else {
        this.rateLimiter.set(key, validRequests);
      }
    }
  }

  // Generate comprehensive definition for a term
  async generateDefinition(term: string, category?: string, context?: string): Promise<AIDefinitionResponse> {
    const cacheKey = `definition:${term}:${category || 'none'}`;
    
    // Check cache first
    const cached = this.cache.get<AIDefinitionResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const prompt = this.buildDefinitionPrompt(term, category, context);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in AI/ML terminology. Provide comprehensive, accurate definitions for technical terms. Return your response as valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as AIDefinitionResponse;
      
      // Cache for 24 hours
      this.cache.set(cacheKey, result, 24 * 3600);
      
      return result;
    } catch (error) {
      console.error('Error generating definition:', error);
      throw new Error('Failed to generate definition');
    }
  }

  // Generate term suggestions based on existing terms and categories
  async generateTermSuggestions(
    existingTerms: string[], 
    categories: ICategory[], 
    focusCategory?: string
  ): Promise<AITermSuggestionsResponse> {
    const cacheKey = `suggestions:${focusCategory || 'all'}:${existingTerms.length}`;
    
    const cached = this.cache.get<AITermSuggestionsResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const prompt = this.buildSuggestionsPrompt(existingTerms, categories, focusCategory);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI/ML expert. Suggest important technical terms that would complement an existing glossary. Return your response as valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as AITermSuggestionsResponse;
      
      // Cache for 2 hours
      this.cache.set(cacheKey, result, 2 * 3600);
      
      return result;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw new Error('Failed to generate term suggestions');
    }
  }

  // Categorize a term automatically
  async categorizeTerm(term: string, definition: string, availableCategories: ICategory[]): Promise<AICategoryResponse> {
    const cacheKey = `categorize:${term}:${definition.substring(0, 50)}`;
    
    const cached = this.cache.get<AICategoryResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const prompt = this.buildCategorizationPrompt(term, definition, availableCategories);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI/ML categorization expert. Analyze terms and assign them to the most appropriate categories. Return your response as valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as AICategoryResponse;
      
      // Cache for 6 hours
      this.cache.set(cacheKey, result, 6 * 3600);
      
      return result;
    } catch (error) {
      console.error('Error categorizing term:', error);
      throw new Error('Failed to categorize term');
    }
  }

  // Semantic search for terms
  async semanticSearch(query: string, terms: ITerm[], limit: number = 10): Promise<AISearchResponse> {
    const cacheKey = `search:${query}:${terms.length}:${limit}`;
    
    const cached = this.cache.get<AISearchResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const prompt = this.buildSemanticSearchPrompt(query, terms, limit);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a semantic search expert. Analyze queries and find the most relevant terms based on meaning, not just keyword matching. Return your response as valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as AISearchResponse;
      
      // Cache for 30 minutes
      this.cache.set(cacheKey, result, 30 * 60);
      
      return result;
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw new Error('Failed to perform semantic search');
    }
  }

  // Improve existing term definition
  async improveDefinition(term: ITerm): Promise<AIDefinitionResponse> {
    const cacheKey = `improve:${term.id}:${term.updatedAt}`;
    
    const cached = this.cache.get<AIDefinitionResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const prompt = this.buildImprovementPrompt(term);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI/ML expert editor. Analyze existing definitions and suggest improvements for clarity, accuracy, and completeness. Return your response as valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as AIDefinitionResponse;
      
      // Cache for 12 hours
      this.cache.set(cacheKey, result, 12 * 3600);
      
      return result;
    } catch (error) {
      console.error('Error improving definition:', error);
      throw new Error('Failed to improve definition');
    }
  }

  // Private helper methods for building prompts
  private buildDefinitionPrompt(term: string, category?: string, context?: string): string {
    return `
Please provide a comprehensive definition for the AI/ML term: "${term}"

${category ? `Category: ${category}` : ''}
${context ? `Context: ${context}` : ''}

Return a JSON object with the following structure:
{
  "shortDefinition": "Brief 1-2 sentence definition",
  "definition": "Detailed explanation (3-5 sentences)",
  "characteristics": ["key characteristic 1", "key characteristic 2"],
  "applications": [
    {"name": "application name", "description": "brief description"}
  ],
  "relatedTerms": ["related term 1", "related term 2"],
  "mathFormulation": "Mathematical representation if applicable"
}

Focus on accuracy, clarity, and practical understanding. Include mathematical formulations only if they are essential to understanding the concept.
    `.trim();
  }

  private buildSuggestionsPrompt(existingTerms: string[], categories: ICategory[], focusCategory?: string): string {
    const categoryNames = categories.map(c => c.name).join(', ');
    const sampleTerms = existingTerms.slice(0, 20).join(', ');
    
    return `
Based on the existing AI/ML glossary terms and categories, suggest important terms that are missing.

Existing categories: ${categoryNames}
Sample existing terms: ${sampleTerms}
${focusCategory ? `Focus on category: ${focusCategory}` : ''}

Suggest 5-8 important AI/ML terms that would complement this glossary. Prioritize:
1. Fundamental concepts not yet covered
2. Current/trending technologies
3. Practical applications
4. Mathematical foundations

Return a JSON object with this structure:
{
  "suggestions": [
    {
      "term": "term name",
      "shortDefinition": "brief definition",
      "category": "suggested category from the list above",
      "reason": "why this term is important for the glossary"
    }
  ]
}
    `.trim();
  }

  private buildCategorizationPrompt(term: string, definition: string, categories: ICategory[]): string {
    const categoryNames = categories.map(c => c.name).join(', ');
    
    return `
Categorize the following AI/ML term into the most appropriate category:

Term: ${term}
Definition: ${definition}

Available categories: ${categoryNames}

Analyze the term and return a JSON object with this structure:
{
  "category": "best matching category from the list",
  "confidence": 0.95,
  "explanation": "brief explanation of why this category fits",
  "suggestedSubcategories": ["subcategory 1", "subcategory 2"]
}

Choose the category that best represents the primary focus of this term.
    `.trim();
  }

  private buildSemanticSearchPrompt(query: string, terms: ITerm[], limit: number): string {
    const termSummaries = terms.map(t => 
      `${t.id}: ${t.name} - ${t.shortDefinition || t.definition.substring(0, 100)}`
    ).join('\n');
    
    return `
Find the most semantically relevant terms for the query: "${query}"

Available terms:
${termSummaries}

Consider:
1. Conceptual similarity (not just keyword matching)
2. Related applications and use cases
3. Mathematical or technical relationships
4. Practical connections

Return the top ${limit} most relevant terms as JSON:
{
  "matches": [
    {
      "termId": "term ID from the list",
      "relevanceScore": 0.95,
      "explanation": "why this term is relevant to the query"
    }
  ]
}

Sort by relevance score (highest first).
    `.trim();
  }

  private buildImprovementPrompt(term: ITerm): string {
    return `
Analyze and improve this AI/ML term definition:

Term: ${term.name}
Current short definition: ${term.shortDefinition || 'None'}
Current definition: ${term.definition}
Category: ${term.category}
Current characteristics: ${term.characteristics?.join(', ') || 'None'}

Suggest improvements for:
1. Clarity and readability
2. Technical accuracy
3. Completeness of information
4. Better examples or applications

Return a JSON object with improved content:
{
  "shortDefinition": "improved brief definition",
  "definition": "improved detailed definition",
  "characteristics": ["improved characteristics"],
  "applications": [
    {"name": "application name", "description": "description"}
  ],
  "relatedTerms": ["related terms"],
  "mathFormulation": "mathematical formulation if applicable"
}

Keep the core meaning intact while enhancing clarity and usefulness.
    `.trim();
  }

  // Utility methods
  getCacheStats(): object {
    return {
      keys: this.cache.keys().length,
      stats: this.cache.getStats()
    };
  }

  clearCache(): void {
    this.cache.flushAll();
  }

  getRateLimitStatus(identifier: string = 'default'): object {
    const requests = this.rateLimiter.get(identifier) || [];
    const now = Date.now();
    
    return {
      requestsLastMinute: requests.filter(ts => now - ts < 60 * 1000).length,
      requestsLastHour: requests.filter(ts => now - ts < 60 * 60 * 1000).length,
      requestsLastDay: requests.length,
      limits: this.rateLimitConfig
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;