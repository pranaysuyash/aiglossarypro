import { Search } from 'lucide-react';
import { useState } from 'react';
import { MobileSearchOverlay } from './MobileSearchOverlay';
import { Button } from './ui/button';

interface MobileStickySearchBarProps {
  className?: string | undefined;
  placeholder?: string;
  showOnlyOnMobile?: boolean;
}

export function MobileStickySearchBar({
  className = '',
  placeholder = 'Search AI/ML terms...',
  showOnlyOnMobile = true,
}: MobileStickySearchBarProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const baseClasses =
    'fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg';
  const mobileOnlyClasses = showOnlyOnMobile ? 'sm:hidden' : '';
  const finalClasses = `${baseClasses} ${mobileOnlyClasses} ${className}`;

  const handleSearchBarClick = () => {
    setIsOverlayOpen(true);
  };

  const handleOverlayClose = () => {
    setIsOverlayOpen(false);
  };

  const handleResultClick = (result: any) => {
    console.log('Result clicked:', result);
    // Navigate to term detail page
    // This would typically use your routing system
  };

  const handleFavoriteToggle = (resultId: string) => {
    console.log('Favorite toggled:', resultId);
    // Handle favorite toggle logic
  };

  return (
    <>
      {/* Sticky Search Bar */}
      <div className={finalClasses}>
        <div className="p-3">
          <Button
            variant="outline"
            className="w-full h-12 justify-start text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleSearchBarClick}
          >
            <Search className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="text-left flex-1 truncate">{placeholder}</span>
          </Button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay
        isOpen={isOverlayOpen}
        onClose={handleOverlayClose}
        onResultClick={handleResultClick}
        onFavoriteToggle={handleFavoriteToggle}
        placeholder={placeholder}
        showVoiceSearch
      />

      {/* Bottom padding to prevent content from being hidden behind sticky bar */}
      {showOnlyOnMobile && <div className="h-20 sm:hidden" />}
      {!showOnlyOnMobile && <div className="h-20" />}
    </>
  );
}

export default MobileStickySearchBar;
