import OpenAI from 'openai';
import { cacheManager } from './cacheManager';

interface ChangeAnalysis {
  hasSignificantChanges: boolean;
  changeScore: number; // 0-100, higher means more significant changes
  changeDescription: string;
  recommendedAction: 'skip' | 'reprocess' | 'partial_update';
  changedSections: string[];
}

export class AIChangeDetector {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      });
    }
  }

  /**
   * Analyze if Excel content has meaningful changes using AI
   */
  async analyzeContentChanges(
    filePath: string,
    newDataSample: any,
    forceReprocess: boolean = false
  ): Promise<ChangeAnalysis> {
    if (forceReprocess) {
      return {
        hasSignificantChanges: true,
        changeScore: 100,
        changeDescription: 'Force reprocess requested',
        recommendedAction: 'reprocess',
        changedSections: ['all'],
      };
    }

    // Get cached data for comparison
    const cacheInfo = await cacheManager.getCacheInfo(filePath);
    if (!cacheInfo) {
      return {
        hasSignificantChanges: true,
        changeScore: 100,
        changeDescription: 'No cache found, initial processing required',
        recommendedAction: 'reprocess',
        changedSections: ['all'],
      };
    }

    // Check cache age - if older than 7 days, recommend reprocessing
    const cacheAge = Date.now() - cacheInfo.processedAt;
    const daysOld = cacheAge / (1000 * 60 * 60 * 24);

    if (daysOld > 7) {
      return {
        hasSignificantChanges: true,
        changeScore: 75,
        changeDescription: `Cache is ${Math.round(daysOld)} days old, recommended refresh`,
        recommendedAction: 'reprocess',
        changedSections: ['all'],
      };
    }

    // If we have OpenAI, use AI analysis
    if (this.openai && newDataSample) {
      try {
        return await this.performAIAnalysis(cacheInfo, newDataSample);
      } catch (error) {
        console.warn('AI analysis failed, falling back to basic checks:', error);
      }
    }

    // Basic analysis without AI
    return this.performBasicAnalysis(cacheInfo, newDataSample);
  }

  /**
   * Perform AI-powered content analysis
   */
  private async performAIAnalysis(cacheInfo: any, newDataSample: any): Promise<ChangeAnalysis> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const prompt = `
Analyze the changes between cached AI/ML glossary data and new data sample.

CACHED DATA INFO:
- Terms: ${cacheInfo.termCount}
- Categories: ${cacheInfo.categoryCount}
- Subcategories: ${cacheInfo.subcategoryCount}
- Last processed: ${new Date(cacheInfo.processedAt).toISOString()}

NEW DATA SAMPLE (first 5 terms):
${JSON.stringify(newDataSample.terms?.slice(0, 5), null, 2)}

NEW DATA COUNTS:
- Terms: ${newDataSample.terms?.length || 0}
- Categories: ${newDataSample.categories?.length || 0}
- Subcategories: ${newDataSample.subcategories?.length || 0}

Analyze and respond with JSON only:
{
  "hasSignificantChanges": boolean,
  "changeScore": number (0-100),
  "changeDescription": "brief description of changes",
  "recommendedAction": "skip" | "reprocess" | "partial_update",
  "changedSections": ["categories", "terms", "subcategories", etc.]
}

Consider significant changes:
- New terms/categories added (score +20)
- Existing content modified (score +30)
- Structural changes (score +40)
- Large volume changes >10% (score +50)

Consider minor changes:
- Formatting updates (score +5)
- Minor corrections (score +10)
- Metadata updates (score +5)
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI system analyzing changes in educational content data. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    try {
      const analysis = JSON.parse(content);
      console.log('🤖 AI Change Analysis:', analysis);
      return analysis;
    } catch (error) {
      console.error('Failed to parse AI response:', content);
      throw error;
    }
  }

  /**
   * Perform basic analysis without AI
   */
  private performBasicAnalysis(cacheInfo: any, newDataSample: any): ChangeAnalysis {
    const termsDiff = Math.abs((newDataSample.terms?.length || 0) - cacheInfo.termCount);
    const categoriesDiff = Math.abs(
      (newDataSample.categories?.length || 0) - cacheInfo.categoryCount
    );
    const subcategoriesDiff = Math.abs(
      (newDataSample.subcategories?.length || 0) - cacheInfo.subcategoryCount
    );

    const totalCached = cacheInfo.termCount + cacheInfo.categoryCount + cacheInfo.subcategoryCount;
    const totalNew =
      (newDataSample.terms?.length || 0) +
      (newDataSample.categories?.length || 0) +
      (newDataSample.subcategories?.length || 0);

    const totalDiff = Math.abs(totalNew - totalCached);
    const changePercentage = totalCached > 0 ? (totalDiff / totalCached) * 100 : 100;

    const changeScore = Math.min(changePercentage, 100);
    const hasSignificantChanges = changeScore > 5; // 5% threshold
    let recommendedAction: 'skip' | 'reprocess' | 'partial_update' = 'skip';
    const changedSections: string[] = [];

    if (termsDiff > 0) changedSections.push('terms');
    if (categoriesDiff > 0) changedSections.push('categories');
    if (subcategoriesDiff > 0) changedSections.push('subcategories');

    if (changeScore > 20) {
      recommendedAction = 'reprocess';
    } else if (changeScore > 5) {
      recommendedAction = 'partial_update';
    }

    const changeDescription =
      `${Math.round(changePercentage)}% change detected. ` +
      `Terms: ${termsDiff > 0 ? '+' : ''}${termsDiff}, ` +
      `Categories: ${categoriesDiff > 0 ? '+' : ''}${categoriesDiff}, ` +
      `Subcategories: ${subcategoriesDiff > 0 ? '+' : ''}${subcategoriesDiff}`;

    console.log('📊 Basic Change Analysis:', {
      hasSignificantChanges,
      changeScore: Math.round(changeScore),
      changeDescription,
      recommendedAction,
      changedSections,
    });

    return {
      hasSignificantChanges,
      changeScore: Math.round(changeScore),
      changeDescription,
      recommendedAction,
      changedSections,
    };
  }

  /**
   * Determine processing strategy based on change analysis
   */
  getProcessingStrategy(analysis: ChangeAnalysis): {
    shouldProcess: boolean;
    strategy: 'full' | 'incremental' | 'skip';
    reason: string;
  } {
    if (!analysis.hasSignificantChanges) {
      return {
        shouldProcess: false,
        strategy: 'skip',
        reason: 'No significant changes detected',
      };
    }

    if (analysis.changeScore >= 50 || analysis.recommendedAction === 'reprocess') {
      return {
        shouldProcess: true,
        strategy: 'full',
        reason: 'Significant changes require full reprocessing',
      };
    }

    if (analysis.changeScore >= 10 || analysis.recommendedAction === 'partial_update') {
      return {
        shouldProcess: true,
        strategy: 'incremental',
        reason: 'Minor changes, incremental update recommended',
      };
    }

    return {
      shouldProcess: false,
      strategy: 'skip',
      reason: 'Changes too minor to warrant reprocessing',
    };
  }
}

export const aiChangeDetector = new AIChangeDetector();
