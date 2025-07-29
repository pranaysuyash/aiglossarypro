// Display categorization system for the 42 sections across different UI areas

export interface DisplayConfig {
  area: 'card' | 'filter' | 'sidebar' | 'main' | 'metadata' | 'modal';
  priority: number; // 1-10, higher = more important
  showInList?: boolean; // Show in term listing
  showInDetail?: boolean; // Show in term detail page
  interactive?: boolean; // Has interactive elements
  searchable?: boolean; // Can be searched
  filterable?: boolean; // Can be used as filter
}

export const SECTION_DISPLAY_CONFIG: Record<string, DisplayConfig> = {
  // Card Display (Term preview cards)
  Introduction: {
    area: 'card',
    priority: 10,
    showInList: true,
    showInDetail: true,
    searchable: true,
  },

  // Filter/Navigation Areas
  Categories: {
    area: 'filter',
    priority: 9,
    showInList: true,
    showInDetail: true,
    filterable: true,
    searchable: true,
  },

  // Sidebar Content (Prerequisites, Quick Info)
  Prerequisites: {
    area: 'sidebar',
    priority: 8,
    showInDetail: true,
    searchable: true,
  },

  'Quick Quiz': {
    area: 'sidebar',
    priority: 6,
    showInDetail: true,
    interactive: true,
  },

  'Did You Know?': {
    area: 'sidebar',
    priority: 5,
    showInDetail: true,
    interactive: true,
  },

  // Main Content Areas (Detailed explanations)
  'Theoretical Concepts': {
    area: 'main',
    priority: 9,
    showInDetail: true,
    searchable: true,
    interactive: true,
  },

  'How It Works': {
    area: 'main',
    priority: 8,
    showInDetail: true,
    searchable: true,
    interactive: true,
  },

  Implementation: {
    area: 'main',
    priority: 7,
    showInDetail: true,
    searchable: true,
    interactive: true,
  },

  Applications: {
    area: 'main',
    priority: 7,
    showInDetail: true,
    searchable: true,
  },

  'Variants or Extensions': {
    area: 'main',
    priority: 6,
    showInDetail: true,
    searchable: true,
  },

  'Evaluation and Metrics': {
    area: 'main',
    priority: 6,
    showInDetail: true,
    searchable: true,
  },

  'Advantages and Disadvantages': {
    area: 'main',
    priority: 5,
    showInDetail: true,
    interactive: true,
  },

  // Modal/Expandable Content (Less frequently accessed)
  'Historical Context': {
    area: 'modal',
    priority: 4,
    showInDetail: true,
    searchable: true,
  },

  'Ethics and Responsible AI': {
    area: 'modal',
    priority: 5,
    showInDetail: true,
    searchable: true,
  },

  'Case Studies': {
    area: 'modal',
    priority: 6,
    showInDetail: true,
    searchable: true,
    interactive: true,
  },

  'Interviews with Experts': {
    area: 'modal',
    priority: 4,
    showInDetail: true,
    interactive: true,
  },

  'Hands-on Tutorials': {
    area: 'modal',
    priority: 7,
    showInDetail: true,
    interactive: true,
  },

  'Research Papers': {
    area: 'modal',
    priority: 5,
    showInDetail: true,
    searchable: true,
  },

  'Further Reading': {
    area: 'modal',
    priority: 4,
    showInDetail: true,
  },

  'Career Guidance': {
    area: 'modal',
    priority: 3,
    showInDetail: true,
  },

  // Metadata (Background processing, search indexing)
  Metadata: {
    area: 'metadata',
    priority: 8,
    searchable: true,
    filterable: true,
  },

  'Tags and Keywords': {
    area: 'metadata',
    priority: 9,
    filterable: true,
    searchable: true,
  },

  Glossary: {
    area: 'metadata',
    priority: 6,
    searchable: true,
  },

  References: {
    area: 'metadata',
    priority: 5,
    searchable: true,
  },
};

// Content organization for different page layouts
export interface PageLayout {
  cardContent: string[]; // Sections shown on term cards
  sidebarContent: string[]; // Sections in sidebar
  mainContent: string[]; // Main content sections (ordered)
  modalContent: string[]; // Expandable/modal sections
  filterableData: string[]; // Data used for filtering
  searchableData: string[]; // Data included in search
}

export const DEFAULT_LAYOUT: PageLayout = {
  cardContent: ['Introduction', 'Categories'],

  sidebarContent: ['Prerequisites', 'Quick Quiz', 'Did You Know?', 'Related Concepts'],

  mainContent: [
    'Introduction',
    'Theoretical Concepts',
    'How It Works',
    'Implementation',
    'Applications',
    'Variants or Extensions',
    'Evaluation and Metrics',
    'Advantages and Disadvantages',
  ],

  modalContent: [
    'Historical Context',
    'Ethics and Responsible AI',
    'Case Studies',
    'Interviews with Experts',
    'Hands-on Tutorials',
    'Research Papers',
    'Further Reading',
    'Career Guidance',
    'Future Directions',
  ],

  filterableData: ['Categories', 'Tags and Keywords', 'Metadata'],

  searchableData: [
    'Introduction',
    'Theoretical Concepts',
    'How It Works',
    'Implementation',
    'Applications',
    'Categories',
    'Tags and Keywords',
    'Metadata',
  ],
};

// Filter configuration for the UI
export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'search' | 'range';
  options?: string[];
  searchable?: boolean;
}

export const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'main_category',
    label: 'Main Category',
    type: 'multiselect',
    searchable: true,
  },
  {
    key: 'sub_category',
    label: 'Sub Category',
    type: 'multiselect',
    searchable: true,
  },
  {
    key: 'application_domains',
    label: 'Application Domains',
    type: 'multiselect',
    searchable: true,
  },
  {
    key: 'techniques',
    label: 'Techniques & Algorithms',
    type: 'multiselect',
    searchable: true,
  },
  {
    key: 'difficulty_level',
    label: 'Difficulty Level',
    type: 'select',
    options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  },
  {
    key: 'has_implementation',
    label: 'Has Implementation',
    type: 'select',
    options: ['Yes', 'No'],
  },
  {
    key: 'has_interactive_elements',
    label: 'Interactive Content',
    type: 'select',
    options: ['Yes', 'No'],
  },
];

// Helper functions for organizing content
export class ContentOrganizer {
  static organizeForCard(sections: Map<string, any>) {
    const cardData: any = {};

    DEFAULT_LAYOUT.cardContent.forEach(sectionName => {
      if (sections.has(sectionName)) {
        const sectionData = sections.get(sectionName);
        cardData[sectionName] = ContentOrganizer.extractCardSummary(sectionData, sectionName);
      }
    });

    return cardData;
  }

  static organizeForSidebar(sections: Map<string, any>) {
    const sidebarData: any = {};

    DEFAULT_LAYOUT.sidebarContent.forEach(sectionName => {
      if (sections.has(sectionName)) {
        sidebarData[sectionName] = sections.get(sectionName);
      }
    });

    return sidebarData;
  }

  static organizeForMain(sections: Map<string, any>): unknown[] {
    const mainSections: unknown[] = [];

    DEFAULT_LAYOUT.mainContent.forEach(sectionName => {
      if (sections.has(sectionName)) {
        const sectionData = sections.get(sectionName);
        const config = SECTION_DISPLAY_CONFIG[sectionName];

        mainSections.push({
          name: sectionName,
          data: sectionData,
          config,
          priority: config?.priority || 5,
        });
      }
    });

    // Sort by priority
    return mainSections.sort((a, b) => b.priority - a.priority);
  }

  static organizeForModal(sections: Map<string, any>): unknown[] {
    const modalSections: unknown[] = [];

    DEFAULT_LAYOUT.modalContent.forEach(sectionName => {
      if (sections.has(sectionName)) {
        const sectionData = sections.get(sectionName);
        const config = SECTION_DISPLAY_CONFIG[sectionName];

        modalSections.push({
          name: sectionName,
          data: sectionData,
          config,
          priority: config?.priority || 3,
        });
      }
    });

    return modalSections.sort((a, b) => b.priority - a.priority);
  }

  static extractFilterData(sections: Map<string, any>, categories: any) {
    const filterData: any = {};

    // Add category data
    filterData.main_category = categories.main;
    filterData.sub_category = categories.sub;
    filterData.application_domains = categories.domains;
    filterData.techniques = categories.techniques;

    // Extract other filterable data
    DEFAULT_LAYOUT.filterableData.forEach(sectionName => {
      if (sections.has(sectionName)) {
        const sectionData = sections.get(sectionName);
        filterData[sectionName] = ContentOrganizer.extractFilterableValues(sectionData);
      }
    });

    // Determine computed filters
    filterData.difficulty_level = ContentOrganizer.determineDifficultyLevel(sections);
    filterData.has_implementation = sections.has('Implementation') ? 'Yes' : 'No';
    filterData.has_interactive_elements = ContentOrganizer.hasInteractiveElements(sections)
      ? 'Yes'
      : 'No';

    return filterData;
  }

  static extractSearchData(sections: Map<string, any>): string {
    let searchText = '';

    DEFAULT_LAYOUT.searchableData.forEach(sectionName => {
      if (sections.has(sectionName)) {
        const sectionData = sections.get(sectionName);
        searchText += ` ${ContentOrganizer.extractSearchableText(sectionData)}`;
      }
    });

    return searchText.trim();
  }

  private static extractCardSummary(sectionData: any, sectionName: string) {
    if (sectionName === 'Introduction') {
      return {
        overview: sectionData.definition_and_overview?.content || '',
        keyPoints: sectionData.key_concepts_and_principles?.content || '',
      };
    }

    if (sectionName === 'Categories') {
      return sectionData;
    }

    return sectionData;
  }

  private static extractFilterableValues(sectionData: any): string[] {
    const values: string[] = [];

    // Extract values from various data structures
    if (Array.isArray(sectionData)) {
      values.push(...sectionData);
    } else if (typeof sectionData === 'object') {
      Object.values(sectionData).forEach(value => {
        if (Array.isArray(value)) {
          values.push(...value);
        } else if (typeof value === 'string') {
          values.push(value);
        }
      });
    } else if (typeof sectionData === 'string') {
      values.push(sectionData);
    }

    return values.filter(v => v && v.length > 0);
  }

  private static extractSearchableText(sectionData: any): string {
    let text = '';

    if (typeof sectionData === 'string') {
      text = sectionData;
    } else if (typeof sectionData === 'object') {
      Object.values(sectionData).forEach(value => {
        if (typeof value === 'string') {
          text += ` ${value}`;
        } else if (Array.isArray(value)) {
          text += ` ${value.join(' ')}`;
        } else if (typeof value === 'object' && (value as any)?.content) {
          text += ` ${(value as any).content}`;
        }
      });
    }

    return text;
  }

  private static determineDifficultyLevel(sections: Map<string, any>): string {
    // Simple heuristic to determine difficulty
    const hasAdvancedMath = sections.has('Theoretical Concepts');
    const hasImplementation = sections.has('Implementation');
    const hasPrerequisites = sections.has('Prerequisites');

    if (hasAdvancedMath && hasImplementation) {return 'Advanced';}
    if (hasImplementation && hasPrerequisites) {return 'Intermediate';}
    if (hasPrerequisites) {return 'Beginner';}

    return 'Beginner';
  }

  private static hasInteractiveElements(sections: Map<string, any>): boolean {
    // Check for interactive elements in any section
    for (const [_sectionName, sectionData] of sections) {
      if (typeof sectionData === 'object') {
        const dataStr = JSON.stringify(sectionData).toLowerCase();
        if (
          dataStr.includes('interactive') ||
          dataStr.includes('mermaid') ||
          dataStr.includes('quiz') ||
          dataStr.includes('demo')
        ) {
          return true;
        }
      }
    }
    return false;
  }
}

// Exports are already defined above
