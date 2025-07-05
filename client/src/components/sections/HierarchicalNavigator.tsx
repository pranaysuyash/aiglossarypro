import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  BookOpen, 
  Code, 
  Play, 
  FileText,
  Target,
  CheckCircle,
  Circle,
  Clock,
  Star
} from 'lucide-react';
import { ContentNode, flattenStructure, findNodeByPath, getBreadcrumbPath } from '@/types/content-structure';
import { cn } from '@/lib/utils';

interface HierarchicalNavigatorProps {
  sections: ContentNode[];
  currentPath?: string;
  onNodeClick: (path: string, node: ContentNode) => void;
  className?: string;
  userProgress?: Record<string, {
    isCompleted: boolean;
    progress: number;
    timeSpent: number;
  }>;
  searchable?: boolean;
  collapsible?: boolean;
  showProgress?: boolean;
  showInteractiveElements?: boolean;
}

// Recursive outline renderer component
const OutlineNode: React.FC<{
  node: ContentNode;
  path: string;
  depth: number;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: (path: string) => void;
  onNodeClick: (path: string, node: ContentNode) => void;
  userProgress?: Record<string, {
    isCompleted: boolean;
    progress: number;
    timeSpent: number;
  }>;
  showProgress: boolean;
  showInteractiveElements: boolean;
}> = ({ 
  node, 
  path, 
  depth, 
  isActive, 
  isExpanded, 
  onToggle, 
  onNodeClick, 
  userProgress,
  showProgress,
  showInteractiveElements
}) => {
  const hasChildren = node.subsections && node.subsections.length > 0;
  const nodeProgress = userProgress?.[path];
  const isInteractive = node.metadata?.isInteractive || 
                       node.contentType === 'interactive' || 
                       node.name.toLowerCase().includes('interactive element');
  
  // Calculate completion status
  const isCompleted = nodeProgress?.isCompleted || node.isCompleted;
  const progress = nodeProgress?.progress || node.progress || 0;
  
  // Get appropriate icon based on content type and metadata
  const getIcon = () => {
    if (isInteractive) return <Play className="h-4 w-4 text-purple-500" />;
    if (node.contentType === 'code') return <Code className="h-4 w-4 text-green-500" />;
    if (node.contentType === 'mermaid') return <Target className="h-4 w-4 text-blue-500" />;
    if (node.metadata?.displayType === 'interactive') return <Play className="h-4 w-4 text-purple-500" />;
    return <BookOpen className="h-4 w-4 text-gray-500" />;
  };

  // Get priority styling
  const getPriorityStyle = () => {
    if (node.metadata?.priority === 'high') return 'border-l-2 border-l-blue-500';
    if (node.metadata?.priority === 'medium') return 'border-l-2 border-l-yellow-500';
    return 'border-l-2 border-l-gray-300';
  };

  return (
    <div className={cn('transition-all duration-200', getPriorityStyle())}>
      <div
        className={cn(
          'flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
          isActive && 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
          depth > 0 && 'ml-4'
        )}
        onClick={() => onNodeClick(path, node)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNodeClick(path, node);
          }
        }}
        role="button"
        tabIndex={0}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-4 w-4"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(path);
            }}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        )}
        
        {/* Content Icon */}
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        {/* Node Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={cn(
              'text-sm font-medium truncate',
              isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'
            )}>
              {node.name}
            </span>
            
            {/* Interactive Element Badge */}
            {isInteractive && showInteractiveElements && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                Interactive
              </Badge>
            )}
            
            {/* Priority Badge */}
            {node.metadata?.priority === 'high' && (
              <Star className="h-3 w-3 text-yellow-500" />
            )}
          </div>
          
          {/* Progress Bar */}
          {showProgress && progress > 0 && (
            <div className="mt-1">
              <Progress value={progress} className="h-1" />
            </div>
          )}
        </div>
        
        {/* Completion Status */}
        <div className="flex-shrink-0 flex items-center space-x-1">
          {isCompleted ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : progress > 0 ? (
            <Clock className="h-4 w-4 text-yellow-500" />
          ) : (
            <Circle className="h-4 w-4 text-gray-300" />
          )}
          
                     {/* Subsection Count */}
           {hasChildren && (
             <Badge variant="outline" className="text-xs">
               {node.subsections?.length || 0}
             </Badge>
           )}
         </div>
       </div>
       
       {/* Render Children */}
       {hasChildren && isExpanded && (
         <div className="ml-2 mt-1 space-y-1">
           {node.subsections?.map((child, index) => (
             <OutlineNode
               key={child.slug || `${path}.${index}`}
               node={child}
               path={`${path}.${index}`}
               depth={depth + 1}
               isActive={isActive}
               isExpanded={isExpanded}
               onToggle={onToggle}
               onNodeClick={onNodeClick}
               userProgress={userProgress}
               showProgress={showProgress}
               showInteractiveElements={showInteractiveElements}
             />
           ))}
         </div>
       )}
    </div>
  );
};

export const HierarchicalNavigator: React.FC<HierarchicalNavigatorProps> = ({
  sections,
  currentPath = '',
  onNodeClick,
  className = '',
  userProgress = {},
  searchable = true,
  collapsible = true,
  showProgress = true,
  showInteractiveElements = true
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['0', '1', '2'])); // Expand first few sections by default
  const [searchTerm, setSearchTerm] = useState('');
  const [displayMode, setDisplayMode] = useState<'tree' | 'flat'>('tree');

  // Handle node expansion/collapse
  const handleToggle = useCallback((path: string) => {
    if (!collapsible) return;
    
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, [collapsible]);

  // Filter sections based on search
  const filteredSections = searchTerm
    ? sections.filter(section => 
        section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (section.subsections && section.subsections.some(sub => 
          sub.name.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    : sections;

  // Calculate overall progress
  const totalNodes = flattenStructure(sections).length;
  const completedNodes = Object.values(userProgress).filter(p => p.isCompleted).length;
  const overallProgress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

  // Get breadcrumb for current path
  const breadcrumbs = currentPath ? getBreadcrumbPath(sections, currentPath) : [];

  return (
    <Card className={cn('h-fit', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Content Navigation</CardTitle>
        
        {/* Search */}
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search sections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        {/* Progress Overview */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
              <span className="font-medium">{completedNodes}/{totalNodes}</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{Math.round(overallProgress)}% Complete</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant={displayMode === 'tree' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDisplayMode('tree')}
                  className="h-6 text-xs"
                >
                  Tree
                </Button>
                <Button
                  variant={displayMode === 'flat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDisplayMode('flat')}
                  className="h-6 text-xs"
                >
                  Flat
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="text-xs text-gray-500">
            <span>Current: </span>
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {index > 0 && ' > '}
                <span className="font-medium">{crumb}</span>
              </span>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
                 {/* Tree View */}
         {displayMode === 'tree' && (
           <div className="space-y-1 max-h-96 overflow-y-auto">
             {filteredSections.map((section, index) => (
               <OutlineNode
                 key={section.slug || index}
                 node={section}
                 path={index.toString()}
                 depth={0}
                 isActive={currentPath === index.toString()}
                 isExpanded={expandedNodes.has(index.toString())}
                 onToggle={handleToggle}
                 onNodeClick={onNodeClick}
                 userProgress={userProgress}
                 showProgress={showProgress}
                 showInteractiveElements={showInteractiveElements}
               />
             ))}
           </div>
         )}
         
         {/* Flat View */}
         {displayMode === 'flat' && (
           <div className="space-y-1 max-h-96 overflow-y-auto">
             {flattenStructure(filteredSections).map((item, index) => (
               <div
                 key={item.node.slug || item.path || index}
                 className={cn(
                   'flex items-center space-x-2 p-2 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                   currentPath === item.path && 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                 )}
                 onClick={() => onNodeClick(item.path, item.node)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     onNodeClick(item.path, item.node);
                   }
                 }}
                 role="button"
                 tabIndex={0}
                 style={{ paddingLeft: `${(item.depth + 1) * 12}px` }}
               >
                <div className="flex-shrink-0">
                  {item.node.metadata?.isInteractive ? (
                    <Play className="h-4 w-4 text-purple-500" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <span className="text-sm font-medium truncate">{item.name}</span>
                {userProgress[item.path]?.isCompleted && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* No Results */}
        {filteredSections.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">No sections found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};