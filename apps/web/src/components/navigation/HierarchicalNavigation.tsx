import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  Search,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils';
import type { ContentNode } from '@/types/content-structure';

interface NavigationNode extends ContentNode {
  id: string;
  path: string;
  depth: number;
  parentId?: string;
  isExpanded?: boolean;
  isVisible?: boolean;
  matchesSearch?: boolean;
}

interface HierarchicalNavigationProps {
  contentStructure: ContentNode[];
  currentPath?: string;
  onNavigate?: (path: string, node: NavigationNode) => void;
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableProgress?: boolean;
  enableVirtualization?: boolean;
  className?: string | undefined;
}

// Performance optimized navigation item component
const NavigationItem = memo<{
  node: NavigationNode;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onSelect: (path: string, node: NavigationNode) => void;
  searchQuery: string;
  filterType?: string;
}>(({ node, isSelected, onToggle, onSelect, searchQuery, filterType }) => {
  const hasChildren = node.subsections && node.subsections.length > 0;
  const isInteractive = node.metadata?.isInteractive;
  const displayType = node.metadata?.displayType;
  const priority = node.metadata?.priority;

  // Filter logic
  const matchesFilter =
    !filterType ||
    filterType === 'all' ||
    displayType === filterType ||
    priority === filterType ||
    (filterType === 'interactive' && isInteractive);

  if (!matchesFilter && !node.matchesSearch) {return null;}

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        onToggle(node.id);
      }
    },
    [hasChildren, onToggle, node.id]
  );

  const handleSelect = useCallback(() => {
    onSelect(node.path, node);
  }, [onSelect, node.path, node]);

  // Highlight search matches
  const highlightText = (text: string, query: string) => {
    if (!query) {return text;}
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-900">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all duration-150',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isSelected && 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500',
          node.depth > 0 && 'ml-4',
          node.depth > 1 && 'ml-8',
          node.depth > 2 && 'ml-12'
        )}
        onClick={handleSelect}
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
          >
            {node.isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Content Type Icon */}
        <div className="flex-shrink-0">
          {isInteractive ? (
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          ) : (
            <BookOpen
              className={cn(
                'w-4 h-4',
                displayType === 'main' && 'text-blue-500',
                displayType === 'sidebar' && 'text-gray-500',
                displayType === 'card' && 'text-purple-500',
                displayType === 'filter' && 'text-orange-500',
                displayType === 'metadata' && 'text-gray-400'
              )}
            />
          )}
        </div>

        {/* Node Name with Search Highlighting */}
        <span
          className={cn(
            'flex-1 text-sm',
            priority === 'high' && 'font-semibold',
            priority === 'medium' && 'font-medium',
            priority === 'low' && 'text-gray-600 dark:text-gray-400'
          )}
        >
          {highlightText(node.name, searchQuery)}
        </span>

        {/* Progress Indicator */}
        {node.progress !== undefined && (
          <div className="flex items-center gap-1">
            {node.isCompleted ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <div className="w-8 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${node.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{Math.round(node.progress)}%</span>
              </div>
            )}
          </div>
        )}

        {/* Metadata Pills */}
        <div className="flex gap-1">
          {isInteractive && (
            <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
              Interactive
            </span>
          )}
          {priority === 'high' && (
            <span className="px-1.5 py-0.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              High Priority
            </span>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && node.isExpanded && node.subsections && (
        <div className="ml-2">
          {node.subsections.map((child: any) => (
            <NavigationItem
              key={child.id}
              node={child}
              isSelected={isSelected}
              onToggle={onToggle}
              onSelect={onSelect}
              searchQuery={searchQuery}
              filterType={filterType}
            />
          ))}
        </div>
      )}
    </div>
  );
});

NavigationItem.displayName = 'NavigationItem';

// Virtual scrolling hook for performance with large datasets
const useVirtualScrolling = (items: NavigationNode[], containerHeight = 600) => {
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 40; // Approximate height per item

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
};

export const HierarchicalNavigation: React.FC<HierarchicalNavigationProps> = ({
  contentStructure,
  currentPath = '',
  onNavigate,
  enableSearch = true,
  enableFilters = true,
  enableProgress = true,
  enableVirtualization = false,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Transform flat structure to hierarchical with performance optimization
  const navigationNodes = useMemo(() => {
    const nodes: NavigationNode[] = [];

    const processNode = (
      node: ContentNode,
      parentPath = '',
      depth = 0,
      parentId?: string
    ): NavigationNode => {
      const id = `${parentPath}-${node.slug || node.name.toLowerCase().replace(/\s+/g, '-')}`;
      const path = parentPath ? `${parentPath}/${node.slug || ''}` : node.slug || '';

      const processedNode: NavigationNode = {
        ...node,
        id,
        path,
        depth,
        parentId,
        isExpanded: expandedNodes.has(id),
        isVisible: true,
        matchesSearch: !searchQuery || node.name.toLowerCase().includes(searchQuery.toLowerCase()),
      };

      if (node.subsections) {
        processedNode.subsections = node.subsections.map(child =>
          processNode(child, path, depth + 1, id)
        );
      }

      return processedNode;
    };

    contentStructure.forEach(section => {
      nodes.push(processNode(section));
    });

    return nodes;
  }, [contentStructure, expandedNodes, searchQuery]);

  // Flatten nodes for search and filtering
  const flattenedNodes = useMemo(() => {
    const flatten = (nodes: NavigationNode[]): NavigationNode[] => {
      const result: NavigationNode[] = [];

      nodes.forEach(node => {
        result.push(node);
        if (node.subsections && node.isExpanded) {
          result.push(...flatten(node.subsections as NavigationNode[]));
        }
      });

      return result;
    };

    return flatten(navigationNodes);
  }, [navigationNodes]);

  // Virtual scrolling setup
  const virtualScrolling = useVirtualScrolling(flattenedNodes);

  // Search performance optimization with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        // Auto-expand nodes that contain search matches
        const matchingNodeIds = new Set<string>();
        const findMatches = (nodes: NavigationNode[]) => {
          nodes.forEach(node => {
            if (node.matchesSearch) {
              matchingNodeIds.add(node.id);
              if (node.parentId) {matchingNodeIds.add(node.parentId);}
            }
            if (node.subsections) {
              findMatches(node.subsections as NavigationNode[]);
            }
          });
        };
        findMatches(navigationNodes);
        setExpandedNodes(matchingNodeIds);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, navigationNodes]);

  const handleToggle = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelect = useCallback(
    (path: string, node: NavigationNode) => {
      onNavigate?.(path, node);
    },
    [onNavigate]
  );

  const handleSearchFocus = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleSearchFocus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSearchFocus]);

  const filterOptions = [
    { value: 'all', label: 'All Content' },
    { value: 'main', label: 'Main Sections' },
    { value: 'sidebar', label: 'Sidebar Content' },
    { value: 'interactive', label: 'Interactive Elements' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
  ];

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3">Content Navigation</h2>

        {/* Search */}
        {enableSearch && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search content... (Ctrl+K)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Filters */}
        {enableFilters && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-hidden">
        {enableVirtualization ? (
          <div className="h-full overflow-auto" onScroll={virtualScrolling.onScroll}>
            <div
              style={{
                height: virtualScrolling.totalHeight,
                position: 'relative',
              }}
            >
              <div
                style={{
                  transform: `translateY(${virtualScrolling.offsetY}px)`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                }}
              >
                {virtualScrolling.visibleItems.map(node => (
                  <NavigationItem
                    key={node.id}
                    node={node}
                    isSelected={currentPath === node.path}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                    searchQuery={searchQuery}
                    filterType={filterType}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto p-2">
            {navigationNodes.map(node => (
              <NavigationItem
                key={node.id}
                node={node}
                isSelected={currentPath === node.path}
                onToggle={handleToggle}
                onSelect={handleSelect}
                searchQuery={searchQuery}
                filterType={filterType}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>
            {navigationNodes.length} sections, {flattenedNodes.length} total items
          </span>
          {searchQuery && <span>{flattenedNodes.filter(n => n.matchesSearch).length} matches</span>}
        </div>
      </div>
    </div>
  );
};

export default HierarchicalNavigation;
