// src/components/Enhanced295ContentDisplay.tsx
// Component to display the full 295-column hierarchical content structure

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Info, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Sparkles,
  Code,
  FileText,
  List,
  BarChart3 as BarChart,
  BookOpen,
  Lightbulb,
  Target,
  Shield,
  GitBranch,
  Calendar,
  Image,
  Link,
  Users,
  Briefcase,
  Tool,
  Activity,
  Award,
  TrendingUp,
  AlertTriangle,
  History,
  Layers,
  MessageSquare,
  Zap,
  Database,
  Settings,
  Package,
  Terminal,
  Globe,
  Lock,
  Search,
  Filter,
  Download,
  Grid3x3
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Types for the 295-column structure
interface ColumnDefinition {
  id: string;
  name: string;
  displayName: string;
  path: string;
  section: string;
  category: 'essential' | 'important' | 'supplementary' | 'advanced';
  priority: number;
  contentType: 'text' | 'markdown' | 'json' | 'array' | 'interactive';
  isInteractive: boolean;
  order: number;
}

interface SectionContent {
  columnId: string;
  displayName: string;
  category: string;
  contentType: string;
  isInteractive: boolean;
  hasContent: boolean;
  content: string | null;
  metadata?: {
    qualityScore?: number;
    isAIGenerated?: boolean;
    generatedAt?: string;
    model?: string;
  };
}

interface HierarchicalSection {
  name: string;
  displayName: string;
  subsections?: Record<string, HierarchicalSection>;
  content?: SectionContent;
}

export interface Enhanced295ContentDisplayProps {
  termId: string;
  termName: string;
  stats: {
    totalColumns: number;
    populatedColumns: number;
    completionPercentage: number;
  };
  onGenerateContent?: (columnId: string) => void;
  onEditContent?: (columnId: string, content: string) => void;
  isAdmin?: boolean;
  columnContents: Record<string, string>;
  fetchColumnContent: (columnId: string) => void;
  columnStructure: ColumnDefinition[];
  contentStatus: any; // TODO: Define a proper type for contentStatus
}

// Icon mapping for different sections
const sectionIcons: Record<string, React.ComponentType<any>> = {
  introduction: Info,
  prerequisites: BookOpen,
  theoretical: Lightbulb,
  how_it_works: Target,
  variants: GitBranch,
  applications: Briefcase,
  implementation: Tool,
  evaluation: Activity,
  advantages_disadvantages: BarChart,
  ethics: Shield,
  history: Calendar,
  illustration: Image,
  related: Link,
  case_studies: FileText,
  interviews: Users,
  hands_on: Code,
  interactive: Zap,
  industry: Globe,
  challenges: AlertTriangle,
  datasets: Database,
  tools: Settings,
  did_you_know: Lightbulb,
  quiz: MessageSquare,
  further_reading: BookOpen,
  projects: Package,
  websites: Globe,
  collaboration: Users,
  research: FileText,
  career: Briefcase,
  future: TrendingUp,
  glossary: BookOpen,
  faqs: MessageSquare,
  tags: Filter,
  appendices: FileText,
  index: List,
  references: Link,
  conclusion: CheckCircle,
  metadata: Database,
  best_practices: Award,
  security: Lock,
  optimization: Activity,
  comparison: BarChart
};

// Category colors
const categoryColors = {
  essential: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  important: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  supplementary: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
};

// Quality score colors
const getQualityColor = (score?: number) => {
  if (!score) return 'text-gray-500';
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  return 'text-red-600';
};

export const Enhanced295ContentDisplay = React.memo(({
  termId,
  termName,
  stats,
  onGenerateContent,
  onEditContent,
  isAdmin = false,
  columnContents,
  fetchColumnContent,
  columnStructure,
  contentStatus // Add contentStatus here
}: Enhanced295ContentDisplayProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['introduction']));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'accordion' | 'tabs' | 'grid'>('accordion');

  const hierarchicalContent = useMemo(() => {
    const sections: Record<string, HierarchicalSection> = {};

    columnStructure.forEach(column => {
      const pathParts = column.path.split('.');
      let currentSection: HierarchicalSection = sections;

      pathParts.forEach((part, index) => {
        if (!currentSection.subsections) {
          currentSection.subsections = {};
        }
        if (!currentSection.subsections[part]) {
          currentSection.subsections[part] = {
            name: part,
            displayName: column.section,
          };
        }
        currentSection = currentSection.subsections[part];

        if (index === pathParts.length - 1) {
          // This is the leaf node, assign content
          const content = contentStatus?.columnStatus.find(s => s.columnId === column.id);
          currentSection.content = {
            columnId: column.id,
            displayName: column.displayName,
            category: column.category,
            contentType: column.contentType,
            isInteractive: column.isInteractive,
            hasContent: content?.hasContent || false,
            content: null, // Content will be fetched on demand
            metadata: content?.metadata,
          };
        }
      });
    });

    return {
      term: { id: termId, name: termName },
      sections: sections.subsections || {},
    };
  }, [columnStructure, contentStatus, termId, termName]);

  // Toggle section expansion
  const toggleSection = (sectionPath: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionPath)) {
        newSet.delete(sectionPath);
      } else {
        newSet.add(sectionPath);
      }
      return newSet;
    });
  };

  // Render content based on type
  const renderContent = (content: SectionContent) => {
    if (!content.hasContent || !content.content) {
      return (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No content available for this section</p>
          {isAdmin && onGenerateContent && (
            <Button
              onClick={() => onGenerateContent(content.columnId)}
              className="mt-4"
              size="sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
          )}
        </div>
      );
    }

    switch (content.contentType) {
      case 'markdown':
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {content.content}
            </ReactMarkdown>
          </div>
        );

      case 'array':
        try {
          const items = JSON.parse(content.content);
          return (
            <ul className="space-y-2">
              {items.map((item: string, index: number) => (
                <li key={index} className="flex items-start">
                  <ChevronRight className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        } catch {
          return <p>{content.content}</p>;
        }

      case 'json':
        try {
          const data = JSON.parse(content.content);
          return (
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
              <code>{JSON.stringify(data, null, 2)}</code>
            </pre>
          );
        } catch {
          return <p>{content.content}</p>;
        }

      case 'interactive':
        return (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-lg font-medium mb-2">Interactive Content</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This section contains interactive elements that require special rendering
            </p>
          </div>
        );

      default:
        return <p className="whitespace-pre-wrap">{content.content}</p>;
    }
  };

  // Recursive component to render hierarchical sections
  const renderSection = (
    section: HierarchicalSection, 
    path: string, 
    level: number = 0,
    expandedSections: Set<string>,
    toggleSection: (sectionPath: string) => void,
    searchQuery: string,
    selectedCategory: string,
    renderContent: (content: SectionContent) => React.ReactNode,
    columnContents: Record<string, string>,
    fetchColumnContent: (columnId: string) => void,
    isAdmin: boolean,
    onGenerateContent?: (columnId: string) => void
  ): React.ReactNode => {
    const isExpanded = expandedSections.has(path);
    const hasSubsections = section.subsections && Object.keys(section.subsections).length > 0;
    const Icon = sectionIcons[path.split('.')[0]] || FileText;

    // Filter by search and category
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        section.displayName.toLowerCase().includes(searchLower) ||
        (section.content?.content && section.content.content.toLowerCase().includes(searchLower));
      
      if (!matchesSearch && !hasSubsections) return null;
    }

    if (selectedCategory !== 'all' && section.content && section.content.category !== selectedCategory) {
      return null;
    }

    // Content fetching logic moved to parent component
    // Check if content needs to be fetched
    if (isExpanded && section.content && !columnContents[section.content.columnId]) {
      // Schedule fetch for next tick to avoid render-time side effects
      setTimeout(() => fetchColumnContent(section.content.columnId), 0);
    }

    return (
      <div key={path} className={cn("border-l-2 border-gray-200 dark:border-gray-700", {
        "ml-4": level > 0
      })}>
        <div
          className={cn(
            "flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
            { "bg-gray-50 dark:bg-gray-800": isExpanded }
          )}
          onClick={() => hasSubsections ? toggleSection(path) : (section.content && toggleSection(path))}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasSubsections && (
              <ChevronRight
                className={cn("h-4 w-4 transition-transform", {
                  "transform rotate-90": isExpanded
                })}
              />
            )}
            <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium">{section.displayName}</span>
            
            {section.content && (
              <div className="flex items-center space-x-2 ml-auto">
                {section.content.hasContent && (
                  <>
                    <Badge variant="outline" className={cn("text-xs", categoryColors[section.content.category as keyof typeof categoryColors])}>
                      {section.content.category}
                    </Badge>
                    {section.content.metadata?.isAIGenerated && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Sparkles className="h-4 w-4 text-purple-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>AI Generated ({section.content.metadata.model})</p>
                            {section.content.metadata.qualityScore && (
                              <p className={getQualityColor(section.content.metadata.qualityScore)}>
                                Quality Score: {section.content.metadata.qualityScore}/10
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </>
                )}
                {!section.content.hasContent && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                    Empty
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {section.content && !hasSubsections && (
          <div className={cn(
            "p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700",
            { "hidden": !isExpanded }
          )}>
            {isExpanded && (
              columnContents[section.content.columnId] ? 
                renderContent({ ...section.content, content: columnContents[section.content.columnId] }) :
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Loading content...</p>
                </div>
            )}
          </div>
        )}

        {hasSubsections && isExpanded && (
          <div className="ml-2">
            {Object.entries(section.subsections!).map(([key, subsection]) =>
              renderSection(
                subsection, 
                `${path}.${key}`, 
                level + 1,
                expandedSections,
                toggleSection,
                searchQuery,
                selectedCategory,
                renderContent,
                columnContents,
                fetchColumnContent,
                isAdmin,
                onGenerateContent
              )
            )}
          </div>
        )}
      </div>
    );
  };

  // Render the complete hierarchical content
  const renderHierarchicalContent = () => {
    return Object.entries(hierarchicalContent.sections).map(([key, section]) =>
      renderSection(
        section, 
        key,
        0,
        expandedSections,
        toggleSection,
        searchQuery,
        selectedCategory,
        renderContent,
        columnContents,
        fetchColumnContent,
        isAdmin,
        onGenerateContent
      )
    );
  };

  // Calculate stats by category
  const statsByCategory = useMemo(() => {
    const counts = {
      essential: { total: 0, completed: 0 },
      important: { total: 0, completed: 0 },
      supplementary: { total: 0, completed: 0 },
      advanced: { total: 0, completed: 0 }
    };

    const countContent = (section: HierarchicalSection) => {
      if (section.content) {
        const category = section.content.category as keyof typeof counts;
        if (counts[category]) {
          counts[category].total++;
          if (section.content.hasContent) {
            counts[category].completed++;
          }
        }
      }
      if (section.subsections) {
        Object.values(section.subsections).forEach(countContent);
      }
    };

    Object.values(hierarchicalContent.sections).forEach(countContent);
    return counts;
  }, [hierarchicalContent]);

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{termName} - Complete Content Structure</span>
            <Badge variant="outline" className="text-lg">
              {stats.populatedColumns} / {stats.totalColumns} columns
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Completion</span>
                <span>{stats.completionPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={stats.completionPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statsByCategory).map(([category, data]) => (
                <div key={category} className="text-center">
                  <div className={cn("text-2xl font-bold", {
                    'text-green-600': category === 'essential',
                    'text-blue-600': category === 'important',
                    'text-yellow-600': category === 'supplementary',
                    'text-purple-600': category === 'advanced'
                  })}>
                    {data.completed}/{data.total}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-800"
        >
          <option value="all">All Categories</option>
          <option value="essential">Essential</option>
          <option value="important">Important</option>
          <option value="supplementary">Supplementary</option>
          <option value="advanced">Advanced</option>
        </select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'accordion' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('accordion')}
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'tabs' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tabs')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>

        {isAdmin && (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      {/* Content Display */}
      <Card>
        <CardContent className="p-0">
          {viewMode === 'accordion' && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {renderHierarchicalContent()}
            </div>
          )}

          {viewMode === 'tabs' && (
            <Tabs defaultValue="introduction" className="p-4">
              <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2 h-auto">
                {Object.entries(hierarchicalContent.sections).map(([key, section]) => (
                  <TabsTrigger key={key} value={key} className="data-[state=active]:bg-primary">
                    {section.displayName}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(hierarchicalContent.sections).map(([key, section]) => (
                <TabsContent key={key} value={key} className="mt-4">
                  {renderSection(
                    section, 
                    key,
                    0,
                    expandedSections,
                    toggleSection,
                    searchQuery,
                    selectedCategory,
                    renderContent,
                    columnContents,
                    fetchColumnContent,
                    isAdmin,
                    onGenerateContent
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {Object.entries(hierarchicalContent.sections).map(([key, section]) => {
                const Icon = sectionIcons[key] || FileText;
                return (
                  <Card key={key} className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => toggleSection(key)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {section.displayName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {/* Count subsections with content */}
                        {(() => {
                          let contentCount = 0;
                          let totalCount = 0;
                          const countContent = (s: HierarchicalSection) => {
                            if (s.content) {
                              totalCount++;
                              if (s.content.hasContent) contentCount++;
                            }
                            if (s.subsections) {
                              Object.values(s.subsections).forEach(countContent);
                            }
                          };
                          countContent(section);
                          return `${contentCount}/${totalCount} sections completed`;
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});