export interface ColumnDefinition {
    id: string;
    name: string;
    displayName: string;
    path: string;
    parentPath?: string | null;
    section: string;
    subsection?: string | null;
    subsubsection?: string | null;
    category: 'essential' | 'important' | 'supplementary' | 'advanced';
    priority: 1 | 2 | 3 | 4 | 5;
    estimatedTokens: number;
    contentType: 'text' | 'markdown' | 'code' | 'array' | 'object' | 'interactive';
    description: string;
    isInteractive: boolean;
    order: number;
}
export declare const COMPLETE_295_STRUCTURE: ColumnDefinition[];
export declare const HIERARCHICAL_295_STRUCTURE: ColumnDefinition[];
export declare const getColumnById: (id: string) => ColumnDefinition | undefined;
export declare const getColumnsBySection: (section: string) => ColumnDefinition[];
export declare const getColumnsByCategory: (category: string) => ColumnDefinition[];
export declare const getEssentialColumns: () => ColumnDefinition[];
export declare const getColumnsByPriority: (priority: number) => ColumnDefinition[];
export declare const getInteractiveColumns: () => ColumnDefinition[];
export declare const buildHierarchicalTree: () => any;
export declare const getStructureStats: () => {
    total: number;
    byCategory: {
        essential: number;
        important: number;
        supplementary: number;
        advanced: number;
    };
    interactive: number;
    totalTokens: number;
    averageTokens: number;
};
export declare const getMainSections: () => string[];
export declare const getSubsections: (section: string) => string[];
