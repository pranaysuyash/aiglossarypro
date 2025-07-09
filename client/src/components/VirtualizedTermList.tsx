import type React from 'react';
import { useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import type { ITerm } from '../../../shared/types';
import TermCard from './TermCard';

interface VirtualizedTermListProps {
  terms: ITerm[];
  hasNextPage?: boolean;
  isNextPageLoading?: boolean;
  loadNextPage?: () => Promise<void>;
  onTermClick?: (termId: string) => void;
  onFavoriteToggle?: (termId: string, isFavorite: boolean) => void;
  className?: string;
  itemHeight?: number;
  height?: number;
  width?: number;
}

const VirtualizedTermList: React.FC<VirtualizedTermListProps> = ({
  terms,
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  onTermClick,
  onFavoriteToggle,
  className = '',
  itemHeight = 200, // Estimated height of TermCard
  height = 600, // Container height
  width = 800, // Container width
}) => {
  // Memoize item count including loading placeholder
  const itemCount = useMemo(() => {
    return hasNextPage ? terms.length + 1 : terms.length;
  }, [terms.length, hasNextPage]);

  // Check if item is loaded
  const isItemLoaded = useCallback(
    (index: number) => {
      return !!terms[index];
    },
    [terms]
  );

  // Load more items when needed
  const loadMoreItems = useCallback(async () => {
    if (isNextPageLoading || !loadNextPage) return;
    await loadNextPage();
  }, [isNextPageLoading, loadNextPage]);

  // Render individual list item
  const Item = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const term = terms[index];

      // Loading placeholder for items being fetched
      if (!term) {
        return (
          <div style={style} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        );
      }

      return (
        <div style={style} className="px-2 py-1">
          <TermCard
            term={term}
            onTermClick={onTermClick}
            onFavoriteToggle={onFavoriteToggle}
            compact={true} // Enable compact mode for virtualized lists
          />
        </div>
      );
    },
    [terms, onTermClick, onFavoriteToggle]
  );

  // Fallback for empty state
  if (terms.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 ${className}`}
      >
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No terms found</p>
          <p className="text-sm">Try adjusting your search or filter criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }: { onItemsRendered: any; ref: any }) => (
          <List
            ref={ref}
            height={height}
            width={width}
            itemCount={itemCount}
            itemSize={itemHeight}
            onItemsRendered={onItemsRendered}
            className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            itemData={terms}
          >
            {Item}
          </List>
        )}
      </InfiniteLoader>

      {/* Loading indicator at bottom */}
      {isNextPageLoading && (
        <div className="flex items-center justify-center py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
            <span className="text-sm">Loading more terms...</span>
          </div>
        </div>
      )}

      {/* Status indicator for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isNextPageLoading ? 'Loading more terms' : `Showing ${terms.length} terms`}
      </div>
    </div>
  );
};

export default VirtualizedTermList;
