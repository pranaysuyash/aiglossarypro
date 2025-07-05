// Type definitions for hierarchical content structure
export interface ContentNode {
  name: string;
  subsections?: ContentNode[];
  slug?: string;
  content?: string;
  contentType?: 'markdown' | 'mermaid' | 'interactive' | 'code' | 'json';
  metadata?: {
    isInteractive?: boolean;
    displayType?: 'card' | 'filter' | 'sidebar' | 'main' | 'metadata' | 'interactive';
    parseType?: 'simple' | 'list' | 'structured' | 'ai_parse';
    priority?: 'high' | 'medium' | 'low';
    estimatedReadTime?: number;
    prerequisites?: string[];
    relatedTopics?: string[];
  };
  isCompleted?: boolean;
  progress?: number;
}

export interface ContentOutline {
  sections: ContentNode[];
  version: string;
  lastUpdated: string;
  totalSections: number;
  totalSubsections: number;
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
  
  return node.subsections.length + 
    node.subsections.reduce((sum, subsection) => sum + countTotalSubsections(subsection), 0);
}

// Helper function to flatten structure for search
export function flattenStructure(nodes: ContentNode[], parentPath: string = ''): Array<{
  name: string;
  path: string;
  depth: number;
  node: ContentNode;
}> {
  const result = [];
  
  for (const [index, node] of nodes.entries()) {
    const currentPath = parentPath ? `${parentPath}.${index}` : `${index}`;
    const depth = parentPath.split('.').length;
    
    result.push({
      name: node.name,
      path: currentPath,
      depth,
      node
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
  
  for (const index of pathParts) {
    if (!current[index]) return null;
    if (pathParts.indexOf(index) === pathParts.length - 1) {
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
    if (!current[index]) break;
    breadcrumbs.push(current[index].name);
    current = current[index].subsections || [];
  }
  
  return breadcrumbs;
}