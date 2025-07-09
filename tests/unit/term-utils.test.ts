import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateDifficultyScore,
  calculateReadingTime,
  extractKeywords,
  formatRelativeTime,
  formatSearchQuery,
  generateTermSlug,
  generateTOC,
  parseMarkdownToSections,
  sanitizeTermDefinition,
  validateTermData,
} from '../../client/src/utils/termUtils';

describe('Term Utilities', () => {
  describe('sanitizeTermDefinition', () => {
    it('should remove potentially dangerous HTML tags', () => {
      const input = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeTermDefinition(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe content');
    });

    it('should preserve safe HTML tags', () => {
      const input = '<p>This is <strong>important</strong> and <em>emphasized</em></p>';
      const result = sanitizeTermDefinition(input);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    it('should handle markdown-style formatting', () => {
      const input = '**Bold text** and *italic text*';
      const result = sanitizeTermDefinition(input);

      expect(result).toContain('<strong>Bold text</strong>');
      expect(result).toContain('<em>italic text</em>');
    });

    it('should handle code blocks correctly', () => {
      const input = '```python\nprint("Hello, World!")\n```';
      const result = sanitizeTermDefinition(input);

      expect(result).toContain('<pre>');
      expect(result).toContain('<code>');
      expect(result).toContain('print("Hello, World!")');
    });

    it('should sanitize URLs and make them safe', () => {
      const input = '[Link](javascript:alert("xss")) and [Safe Link](https://example.com)';
      const result = sanitizeTermDefinition(input);

      expect(result).not.toContain('javascript:');
      expect(result).toContain('href="https://example.com"');
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time for short text', () => {
      const text = 'This is a short sentence with about ten words.';
      const result = calculateReadingTime(text);

      expect(result).toBe(1); // Should be less than 1 minute, rounded up
    });

    it('should calculate reading time for longer text', () => {
      const text = 'word '.repeat(300); // 300 words
      const result = calculateReadingTime(text);

      // At 200 WPM, 300 words should take 1.5 minutes, rounded to 2
      expect(result).toBe(2);
    });

    it('should handle empty or null text', () => {
      expect(calculateReadingTime('')).toBe(1);
      expect(calculateReadingTime(null)).toBe(1);
      expect(calculateReadingTime(undefined)).toBe(1);
    });

    it('should allow custom reading speed', () => {
      const text = 'word '.repeat(100); // 100 words
      const result = calculateReadingTime(text, 100); // 100 WPM

      expect(result).toBe(1); // 100 words at 100 WPM = 1 minute
    });
  });

  describe('formatSearchQuery', () => {
    it('should trim and normalize whitespace', () => {
      const result = formatSearchQuery('  neural   networks  ');
      expect(result).toBe('neural networks');
    });

    it('should handle special characters', () => {
      const result = formatSearchQuery('C++ programming');
      expect(result).toBe('C++ programming');
    });

    it('should remove excessive special characters', () => {
      const result = formatSearchQuery('neural!!!networks???');
      expect(result).toBe('neural networks');
    });

    it('should handle empty queries', () => {
      expect(formatSearchQuery('')).toBe('');
      expect(formatSearchQuery('   ')).toBe('');
    });

    it('should preserve meaningful punctuation', () => {
      const result = formatSearchQuery('machine-learning AI/ML');
      expect(result).toBe('machine-learning AI/ML');
    });
  });

  describe('validateTermData', () => {
    const validTerm = {
      name: 'Neural Network',
      definition: 'A computational model inspired by biological neural networks.',
      category: 'Deep Learning',
      difficulty: 'intermediate',
    };

    it('should validate correct term data', () => {
      const result = validateTermData(validTerm);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidTerm = { ...validTerm };
      delete invalidTerm.name;

      const result = validateTermData(invalidTerm);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should validate definition length', () => {
      const shortDefinition = { ...validTerm, definition: 'Too short' };
      const result = validateTermData(shortDefinition);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Definition must be at least 20 characters');
    });

    it('should validate difficulty levels', () => {
      const invalidDifficulty = { ...validTerm, difficulty: 'impossible' };
      const result = validateTermData(invalidDifficulty);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid difficulty level');
    });

    it('should validate name length and format', () => {
      const longName = { ...validTerm, name: 'A'.repeat(101) };
      const result = validateTermData(longName);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be less than 100 characters');
    });
  });

  describe('generateTermSlug', () => {
    it('should create URL-friendly slugs', () => {
      const result = generateTermSlug('Neural Networks & Deep Learning');
      expect(result).toBe('neural-networks-deep-learning');
    });

    it('should handle special characters', () => {
      const result = generateTermSlug('C++ Programming (Advanced)');
      expect(result).toBe('c-plus-plus-programming-advanced');
    });

    it('should handle numbers and abbreviations', () => {
      const result = generateTermSlug('AI/ML in 2024');
      expect(result).toBe('ai-ml-in-2024');
    });

    it('should handle Unicode characters', () => {
      const result = generateTermSlug('Réseau de Neurones');
      expect(result).toBe('reseau-de-neurones');
    });

    it('should prevent duplicate hyphens', () => {
      const result = generateTermSlug('Term   with    many    spaces');
      expect(result).toBe('term-with-many-spaces');
    });
  });

  describe('extractKeywords', () => {
    it('should extract meaningful keywords', () => {
      const text =
        'Neural networks are computational models inspired by biological neural networks in the brain.';
      const result = extractKeywords(text);

      expect(result).toContain('neural');
      expect(result).toContain('networks');
      expect(result).toContain('computational');
      expect(result).toContain('biological');
      expect(result).not.toContain('are'); // Stop word
      expect(result).not.toContain('the'); // Stop word
    });

    it('should handle technical terms', () => {
      const text = 'Machine learning algorithms use gradient descent optimization.';
      const result = extractKeywords(text);

      expect(result).toContain('machine');
      expect(result).toContain('learning');
      expect(result).toContain('algorithms');
      expect(result).toContain('gradient');
      expect(result).toContain('descent');
      expect(result).toContain('optimization');
    });

    it('should limit number of keywords', () => {
      const longText = 'word '.repeat(100);
      const result = extractKeywords(longText, 5);

      expect(result).toHaveLength(5);
    });

    it('should handle empty text', () => {
      const result = extractKeywords('');
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateDifficultyScore', () => {
    it('should calculate score based on text complexity', () => {
      const beginnerText = 'AI is computer thinking. It helps solve problems.';
      const advancedText =
        'Convolutional neural networks utilize hierarchical feature extraction through learnable filters and pooling operations.';

      const beginnerScore = calculateDifficultyScore(beginnerText);
      const advancedScore = calculateDifficultyScore(advancedText);

      expect(beginnerScore).toBeLessThan(advancedScore);
    });

    it('should consider sentence length', () => {
      const shortSentences = 'AI is smart. It learns fast. People use it.';
      const longSentences =
        'Artificial intelligence represents a complex computational paradigm that encompasses various sophisticated algorithms and methodologies designed to emulate human cognitive processes.';

      const shortScore = calculateDifficultyScore(shortSentences);
      const longScore = calculateDifficultyScore(longSentences);

      expect(shortScore).toBeLessThan(longScore);
    });

    it('should consider technical vocabulary', () => {
      const simpleText = 'The computer learns from data to make predictions.';
      const technicalText =
        'The algorithm optimizes hyperparameters using backpropagation and stochastic gradient descent.';

      const simpleScore = calculateDifficultyScore(simpleText);
      const technicalScore = calculateDifficultyScore(technicalText);

      expect(simpleScore).toBeLessThan(technicalScore);
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock Date.now to return a consistent value
      vi.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-15T10:00:00Z').getTime());
    });

    it('should format recent times correctly', () => {
      const oneMinuteAgo = new Date('2024-01-15T09:59:00Z').toISOString();
      const result = formatRelativeTime(oneMinuteAgo);

      expect(result).toBe('1 minute ago');
    });

    it('should format hours correctly', () => {
      const twoHoursAgo = new Date('2024-01-15T08:00:00Z').toISOString();
      const result = formatRelativeTime(twoHoursAgo);

      expect(result).toBe('2 hours ago');
    });

    it('should format days correctly', () => {
      const threeDaysAgo = new Date('2024-01-12T10:00:00Z').toISOString();
      const result = formatRelativeTime(threeDaysAgo);

      expect(result).toBe('3 days ago');
    });

    it('should format weeks correctly', () => {
      const twoWeeksAgo = new Date('2024-01-01T10:00:00Z').toISOString();
      const result = formatRelativeTime(twoWeeksAgo);

      expect(result).toBe('2 weeks ago');
    });

    it('should handle future dates', () => {
      const futureDate = new Date('2024-01-16T10:00:00Z').toISOString();
      const result = formatRelativeTime(futureDate);

      expect(result).toBe('in 1 day');
    });

    it('should handle just now', () => {
      const justNow = new Date('2024-01-15T09:59:50Z').toISOString();
      const result = formatRelativeTime(justNow);

      expect(result).toBe('just now');
    });
  });

  describe('parseMarkdownToSections', () => {
    it('should parse markdown headers into sections', () => {
      const markdown = `# Introduction
This is the intro.

## Technical Details
Some technical content here.

### Implementation
Code examples would go here.

## Examples
Real-world examples.`;

      const result = parseMarkdownToSections(markdown);

      expect(result).toHaveLength(4);
      expect(result[0].title).toBe('Introduction');
      expect(result[0].level).toBe(1);
      expect(result[1].title).toBe('Technical Details');
      expect(result[1].level).toBe(2);
      expect(result[2].title).toBe('Implementation');
      expect(result[2].level).toBe(3);
    });

    it('should preserve content between headers', () => {
      const markdown = `## Section 1
Content for section 1.

Multiple paragraphs here.

## Section 2
Content for section 2.`;

      const result = parseMarkdownToSections(markdown);

      expect(result[0].content).toContain('Content for section 1');
      expect(result[0].content).toContain('Multiple paragraphs here');
      expect(result[1].content).toContain('Content for section 2');
    });

    it('should handle code blocks correctly', () => {
      const markdown = `## Code Example
Here's some code:

\`\`\`python
def neural_network():
    return "AI"
\`\`\`

That was the code.`;

      const result = parseMarkdownToSections(markdown);

      expect(result[0].content).toContain('```python');
      expect(result[0].content).toContain('def neural_network()');
    });
  });

  describe('generateTOC', () => {
    it('should generate table of contents from sections', () => {
      const sections = [
        { title: 'Introduction', level: 1, content: 'Intro content' },
        { title: 'Basic Concepts', level: 2, content: 'Basic content' },
        { title: 'Advanced Topics', level: 2, content: 'Advanced content' },
        { title: 'Implementation', level: 3, content: 'Impl content' },
        { title: 'Conclusion', level: 1, content: 'Conclusion content' },
      ];

      const result = generateTOC(sections);

      expect(result).toHaveLength(5);
      expect(result[0].title).toBe('Introduction');
      expect(result[0].anchor).toBe('introduction');
      expect(result[0].level).toBe(1);

      expect(result[3].title).toBe('Implementation');
      expect(result[3].anchor).toBe('implementation');
      expect(result[3].level).toBe(3);
    });

    it('should generate unique anchors for duplicate titles', () => {
      const sections = [
        { title: 'Overview', level: 1, content: 'First overview' },
        { title: 'Overview', level: 2, content: 'Second overview' },
      ];

      const result = generateTOC(sections);

      expect(result[0].anchor).toBe('overview');
      expect(result[1].anchor).toBe('overview-1');
    });

    it('should handle special characters in titles', () => {
      const sections = [
        { title: 'C++ Programming', level: 1, content: 'C++ content' },
        { title: 'AI/ML Overview', level: 2, content: 'AI content' },
      ];

      const result = generateTOC(sections);

      expect(result[0].anchor).toBe('c-plus-plus-programming');
      expect(result[1].anchor).toBe('ai-ml-overview');
    });

    it('should filter by maximum level', () => {
      const sections = [
        { title: 'Level 1', level: 1, content: 'Content 1' },
        { title: 'Level 2', level: 2, content: 'Content 2' },
        { title: 'Level 3', level: 3, content: 'Content 3' },
        { title: 'Level 4', level: 4, content: 'Content 4' },
      ];

      const result = generateTOC(sections, 2);

      expect(result).toHaveLength(2);
      expect(result.every((item) => item.level <= 2)).toBe(true);
    });
  });
});
