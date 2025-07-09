import type { Meta, StoryObj } from '@storybook/react';
import { FAQ } from './FAQ';

const meta: Meta<typeof FAQ> = {
  title: 'Landing/FAQ',
  component: FAQ,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Frequently Asked Questions component for the landing page with expandable sections and search functionality.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultFAQData = [
  {
    id: '1',
    category: 'General',
    question: 'What is AI Glossary Pro?',
    answer:
      'AI Glossary Pro is a comprehensive AI and Machine Learning terminology reference with over 10,000+ terms, definitions, and interactive learning tools. It includes AI-powered features like semantic search, definition improvement, and personalized learning paths.',
    tags: ['basics', 'overview'],
  },
  {
    id: '2',
    category: 'Features',
    question: 'What makes this different from other AI glossaries?',
    answer:
      'Our glossary features AI-powered semantic search, interactive visualizations, code examples, real-world case studies, and personalized learning recommendations. Each term includes multiple explanation levels (beginner to expert) and is regularly updated by AI researchers.',
    tags: ['features', 'comparison'],
  },
  {
    id: '3',
    category: 'Pricing',
    question: 'How much does AI Glossary Pro cost?',
    answer:
      'We offer flexible pricing starting at $29/month for individual users, with team and enterprise plans available. All plans include a 14-day free trial with full access to premium features.',
    tags: ['pricing', 'cost'],
  },
  {
    id: '4',
    category: 'Pricing',
    question: 'Is there a free version available?',
    answer:
      'Yes! We offer a free tier with access to 1,000+ basic terms and definitions. Premium features like AI-powered search, interactive content, and advanced explanations require a paid subscription.',
    tags: ['pricing', 'free'],
  },
  {
    id: '5',
    category: 'Technical',
    question: 'Can I access the glossary offline?',
    answer:
      'Yes, our mobile app supports offline access for downloaded terms. The web version requires an internet connection for AI-powered features, but cached content is available offline.',
    tags: ['technical', 'offline'],
  },
  {
    id: '6',
    category: 'Technical',
    question: 'Do you have an API for developers?',
    answer:
      'Yes, we provide a REST API for enterprise customers to integrate our terminology database into their applications. The API includes endpoints for term lookup, semantic search, and definition retrieval.',
    tags: ['technical', 'api', 'developers'],
  },
  {
    id: '7',
    category: 'Content',
    question: 'How often is the content updated?',
    answer:
      'Our content is updated weekly with new terms and improvements. We have a team of AI researchers and industry experts who review and enhance definitions regularly. Premium users get early access to new content.',
    tags: ['content', 'updates'],
  },
  {
    id: '8',
    category: 'Content',
    question: 'Can I suggest new terms or improvements?',
    answer:
      'Absolutely! We encourage user contributions. Premium users can suggest new terms, report inaccuracies, and vote on improvements. Our AI system also learns from user feedback to enhance definitions.',
    tags: ['content', 'contributions'],
  },
  {
    id: '9',
    category: 'Learning',
    question: 'Are there learning paths or courses available?',
    answer:
      'Yes, we offer structured learning paths for different skill levels and specializations (NLP, Computer Vision, MLOps, etc.). Each path includes curated terms, interactive exercises, and progress tracking.',
    tags: ['learning', 'education'],
  },
  {
    id: '10',
    category: 'Support',
    question: 'What kind of customer support do you provide?',
    answer:
      'We offer email support for all users, with priority support for premium customers. Enterprise clients get dedicated account management and phone support. Our average response time is under 4 hours.',
    tags: ['support', 'help'],
  },
];

export const Default: Story = {
  args: {
    faqs: defaultFAQData,
  },
};

export const WithSearch: Story = {
  args: {
    faqs: defaultFAQData,
    searchable: true,
    searchPlaceholder: 'Search frequently asked questions...',
  },
};

export const CategorizedView: Story = {
  args: {
    faqs: defaultFAQData,
    showCategories: true,
    defaultCategory: 'General',
  },
};

export const CompactLayout: Story = {
  args: {
    faqs: defaultFAQData.slice(0, 5),
    layout: 'compact',
    showCategories: false,
  },
};

export const WithCustomStyling: Story = {
  args: {
    faqs: defaultFAQData,
    theme: 'modern',
    accentColor: '#6366f1',
    borderRadius: 'large',
  },
};

export const LoadingState: Story = {
  args: {
    loading: true,
    skeletonCount: 6,
  },
};

export const EmptyState: Story = {
  args: {
    faqs: [],
    emptyStateMessage: 'No frequently asked questions found.',
    showAddButton: true,
    onAddFAQ: () => console.log('Add FAQ clicked'),
  },
};

export const WithAnalytics: Story = {
  args: {
    faqs: defaultFAQData.map((faq) => ({
      ...faq,
      views: Math.floor(Math.random() * 1000) + 100,
      helpful: Math.floor(Math.random() * 50) + 10,
      lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })),
    showAnalytics: true,
    onFeedback: (faqId: string, helpful: boolean) =>
      console.log(`FAQ ${faqId} marked as ${helpful ? 'helpful' : 'not helpful'}`),
  },
};

export const InteractiveFeatures: Story = {
  args: {
    faqs: defaultFAQData,
    searchable: true,
    showCategories: true,
    allowFeedback: true,
    showRelated: true,
    expandMultiple: false,
    onFAQClick: (faqId: string) => console.log(`FAQ ${faqId} clicked`),
    onFeedback: (faqId: string, helpful: boolean) =>
      console.log(`FAQ ${faqId} feedback: ${helpful}`),
  },
};

export const AdminMode: Story = {
  args: {
    faqs: defaultFAQData,
    adminMode: true,
    onEdit: (faqId: string) => console.log(`Edit FAQ ${faqId}`),
    onDelete: (faqId: string) => console.log(`Delete FAQ ${faqId}`),
    onReorder: (faqIds: string[]) => console.log('Reorder FAQs:', faqIds),
    showAnalytics: true,
  },
};

export const MultiLanguage: Story = {
  args: {
    faqs: [
      {
        id: '1',
        category: 'General',
        question: 'What is AI Glossary Pro?',
        answer:
          'AI Glossary Pro is a comprehensive AI and Machine Learning terminology reference...',
        translations: {
          es: {
            question: '¿Qué es AI Glossary Pro?',
            answer:
              'AI Glossary Pro es una referencia completa de terminología de IA y Machine Learning...',
          },
          fr: {
            question: "Qu'est-ce qu'AI Glossary Pro?",
            answer:
              'AI Glossary Pro est une référence complète de terminologie IA et Machine Learning...',
          },
        },
      },
      ...defaultFAQData.slice(1, 4),
    ],
    supportedLanguages: ['en', 'es', 'fr'],
    currentLanguage: 'en',
    onLanguageChange: (lang: string) => console.log('Language changed to:', lang),
  },
};

export const WithRichContent: Story = {
  args: {
    faqs: [
      {
        id: '1',
        category: 'Features',
        question: 'What AI-powered features are included?',
        answer: `Our AI-powered features include:

**Semantic Search**: Find terms using natural language queries
**Smart Recommendations**: Get personalized term suggestions
**Definition Enhancement**: AI improves clarity and completeness
**Interactive Learning**: Adaptive quizzes and visual explanations

*Code Example*:
\`\`\`python
from ai_glossary import SemanticSearch
search = SemanticSearch()
results = search.query("neural network optimization")
\`\`\`

[Learn more about our AI features →](https://example.com/ai-features)`,
        richContent: true,
        tags: ['features', 'ai'],
      },
      ...defaultFAQData.slice(1, 3),
    ],
    supportMarkdown: true,
    supportCodeHighlight: true,
  },
};

export const PopularQuestions: Story = {
  args: {
    faqs: defaultFAQData.map((faq, index) => ({
      ...faq,
      popularity: Math.max(0, 100 - index * 10),
      trending: index < 3,
    })),
    showPopularity: true,
    sortBy: 'popularity',
    highlightTrending: true,
  },
};

export const DarkMode: Story = {
  args: {
    faqs: defaultFAQData,
    searchable: true,
    showCategories: true,
    theme: 'dark',
  },
  parameters: {
    themes: {
      default: 'dark',
    },
  },
};

export const MobileOptimized: Story = {
  args: {
    faqs: defaultFAQData,
    searchable: true,
    showCategories: true,
    mobileOptimized: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const AccessibleVersion: Story = {
  args: {
    faqs: defaultFAQData,
    searchable: true,
    accessibilityFeatures: {
      keyboardNavigation: true,
      screenReaderOptimized: true,
      highContrast: true,
      focusVisible: true,
    },
    announceChanges: true,
  },
};

export const WithCustomActions: Story = {
  args: {
    faqs: defaultFAQData,
    customActions: [
      {
        id: 'share',
        label: 'Share',
        icon: 'share',
        onClick: (faqId: string) => console.log(`Share FAQ ${faqId}`),
      },
      {
        id: 'bookmark',
        label: 'Bookmark',
        icon: 'bookmark',
        onClick: (faqId: string) => console.log(`Bookmark FAQ ${faqId}`),
      },
      {
        id: 'report',
        label: 'Report Issue',
        icon: 'flag',
        onClick: (faqId: string) => console.log(`Report issue with FAQ ${faqId}`),
      },
    ],
  },
};

export const WithRelatedContent: Story = {
  args: {
    faqs: defaultFAQData.map((faq) => ({
      ...faq,
      relatedLinks: [
        { title: 'Documentation', url: '/docs', type: 'internal' },
        { title: 'Video Tutorial', url: '/tutorials', type: 'internal' },
        { title: 'Community Forum', url: '/community', type: 'external' },
      ],
      relatedFAQs: defaultFAQData
        .filter((related) => related.id !== faq.id && related.category === faq.category)
        .slice(0, 2)
        .map((related) => ({ id: related.id, question: related.question })),
    })),
    showRelatedContent: true,
  },
};
