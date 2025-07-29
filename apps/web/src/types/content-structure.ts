// Type definitions for hierarchical content structure
export interface ContentNode {
  name: string;
  subsections?: ContentNode[];
  slug?: string;
  content?: string;
  contentType?: 'markdown' | 'mermaid' | 'interactive' | 'code' | 'json' | 'video' | 'quiz';
  metadata?: {
    isInteractive?: boolean;
    displayType?: 'card' | 'filter' | 'sidebar' | 'main' | 'metadata' | 'interactive';
    parseType?: 'simple' | 'list' | 'structured' | 'ai_parse';
    priority?: 'high' | 'medium' | 'low';
    estimatedReadTime?: number;
    prerequisites?: string[];
    relatedTopics?: string[];
    // Enhanced user experience
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    learningObjectives?: string[];
    keyTakeaways?: string[];
    practicalExamples?: string[];
    // Analytics and tracking
    views?: number;
    completions?: number;
    averageTimeSpent?: number;
    userRatings?: number[];
    feedbackCount?: number;
    // Performance metrics
    loadTime?: number;
    renderTime?: number;
    errorRate?: number;
    // Content management
    author?: string;
    lastReviewed?: Date;
    reviewStatus?: 'pending' | 'approved' | 'needs-revision';
    version?: number;
    changeLog?: Array<{
      date: Date;
      author: string;
      changes: string;
    }>;
    // SEO and discovery
    keywords?: string[];
    metaDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    // Accessibility
    altTexts?: Record<string, string>;
    ariaLabels?: Record<string, string>;
    transcripts?: Record<string, string>;
    // Admin features
    isHidden?: boolean;
    isPremium?: boolean;
    accessLevel?: 'public' | 'registered' | 'premium' | 'admin';
    expirationDate?: Date;
    customPermissions?: string[];
  };
  isCompleted?: boolean;
  progress?: number;
  // User interaction tracking
  userInteractions?: {
    bookmarked?: boolean;
    notes?: string;
    highlights?: Array<{
      text: string;
      position: number;
      color: string;
    }>;
    lastAccessed?: Date;
    accessCount?: number;
  };
  // Content relationships
  crossReferences?: Array<{
    nodeId: string;
    type: 'prerequisite' | 'related' | 'advanced' | 'example';
    title: string;
  }>;
  // Quality metrics
  qualityScore?: {
    accuracy: number;
    clarity: number;
    completeness: number;
    relevance: number;
  };
}

export interface ContentOutline {
  sections: ContentNode[];
  version: string;
  lastUpdated: string;
  totalSections: number;
  totalSubsections: number;
  // Enhanced metadata for better content management
  metadata?: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    language: string;
    targetAudience: 'beginner' | 'intermediate' | 'advanced' | 'all';
    estimatedCompletionTime: number; // in minutes
    certificateAvailable: boolean;
  };
  // Analytics summary
  analytics?: {
    totalViews: number;
    uniqueUsers: number;
    completionRate: number;
    averageRating: number;
    popularSections: string[];
    dropOffPoints: Array<{
      section: string;
      percentage: number;
    }>;
  };
  // Content quality metrics
  quality?: {
    overallScore: number;
    lastQualityCheck: Date;
    improvementSuggestions: string[];
    contentGaps: string[];
  };
  // Administrative information
  adminInfo?: {
    createdBy: string;
    createdAt: Date;
    lastModifiedBy: string;
    publishStatus: 'draft' | 'review' | 'published' | 'archived';
    approvedBy?: string;
    approvalDate?: Date;
    scheduledPublishDate?: Date;
  };
}

// Helper function to convert section name to slug
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to count total subsections recursively
export function countTotalSubsections(node: ContentNode): number {
  if (!node.subsections || node.subsections.length === 0) {
    return 0;
  }

  return (
    node.subsections.length +
    node.subsections.reduce((sum, subsection) => sum + countTotalSubsections(subsection), 0)
  );
}

// Helper function to flatten structure for search
export function flattenStructure(
  nodes: ContentNode[],
  parentPath = ''
): Array<{
  name: string;
  path: string;
  depth: number;
  node: ContentNode;
}> {
  const result = [];

  for (const [index, node] of nodes.entries()) {
    const currentPath = parentPath ? `${parentPath}.${index}` : `${index}`;
    const depth = parentPath ? parentPath.split('.').length : 0;

    result.push({
      name: node.name,
      path: currentPath,
      depth,
      node,
    });

    if (node.subsections && node.subsections.length > 0) {
      result.push(...flattenStructure(node.subsections, currentPath));
    }
  }

  return result;
}

// Helper function to find node by path
export function findNodeByPath(nodes: ContentNode[], path: string): ContentNode | null {
  const pathParts = path.split('.').map(p => parseInt(p));
  let current = nodes;

  for (let i = 0; i < pathParts.length; i++) {
    const index = pathParts[i];
    if (!current[index]) {return null;}
    if (i === pathParts.length - 1) {
      return current[index];
    }
    current = current[index].subsections || [];
  }

  return null;
}

// Helper function to get breadcrumb path
export function getBreadcrumbPath(nodes: ContentNode[], path: string): string[] {
  const pathParts = path.split('.').map(p => parseInt(p));
  const breadcrumbs: string[] = [];
  let current = nodes;

  for (const index of pathParts) {
    if (!current[index]) {break;}
    breadcrumbs.push(current[index].name);
    current = current[index].subsections || [];
  }

  return breadcrumbs;
}
