import { ChevronDown, ChevronUp, Filter, Menu, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  searchComponent?: React.ReactNode;
  filterComponent?: React.ReactNode;
  title?: string;
  className?: string;
}

export default function MobileOptimizedLayout({
  children,
  sidebar,
  searchComponent,
  filterComponent,
  title,
  className = '',
}: MobileOptimizedLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // Handle scroll for sticky header
  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsSticky(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  const MobileHeader = () => (
    <div
      className={`
      sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700
      transition-all duration-200 ${isSticky ? 'shadow-md' : ''}
    `}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {sidebar && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                {sidebar}
              </SheetContent>
            </Sheet>
          )}

          {title && (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {searchComponent && (
            <Drawer open={searchOpen} onOpenChange={setSearchOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[80vh]">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Search</h3>
                    <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  {searchComponent}
                </div>
              </DrawerContent>
            </Drawer>
          )}

          {filterComponent && (
            <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Filter className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[80vh]">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <Button variant="ghost" size="icon" onClick={() => setFilterOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  {filterComponent}
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
      </div>
    </div>
  );

  const DesktopLayout = () => (
    <div className="flex flex-col lg:flex-row gap-6">
      {sidebar && <aside className="lg:w-64 flex-shrink-0">{sidebar}</aside>}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );

  const MobileLayout = () => (
    <div className="flex flex-col min-h-screen">
      <MobileHeader />
      <main className="flex-1 p-4">{children}</main>
    </div>
  );

  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </div>
  );
}

// Hook for responsive card layouts
export const useResponsiveCardLayout = () => {
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth <= 1024 && window.innerWidth > 768);
    };

    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  const getGridCols = (itemCount: number) => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return itemCount > 2 ? 'grid-cols-2' : 'grid-cols-1';
    return itemCount > 6 ? 'grid-cols-3' : itemCount > 3 ? 'grid-cols-2' : 'grid-cols-1';
  };

  const getCardSpacing = () => {
    return isMobile ? 'gap-3' : 'gap-4';
  };

  const getCardPadding = () => {
    return isMobile ? 'p-3' : 'p-4';
  };

  return {
    isMobile,
    isTablet,
    getGridCols,
    getCardSpacing,
    getCardPadding,
  };
};

// Component for responsive text
export const ResponsiveText = ({
  children,
  className = '',
  mobileSize = 'text-sm',
  desktopSize = 'text-base',
}: {
  children: React.ReactNode;
  className?: string;
  mobileSize?: string;
  desktopSize?: string;
}) => {
  const isMobile = useIsMobile();

  return <span className={`${isMobile ? mobileSize : desktopSize} ${className}`}>{children}</span>;
};

// Component for responsive spacing
export const ResponsiveContainer = ({
  children,
  className = '',
  mobilePadding = 'p-4',
  desktopPadding = 'p-6',
}: {
  children: React.ReactNode;
  className?: string;
  mobilePadding?: string;
  desktopPadding?: string;
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? mobilePadding : desktopPadding} ${className}`}>{children}</div>
  );
};

// Mobile-optimized expandable section
export const MobileExpandableSection = ({
  title,
  children,
  defaultExpanded = false,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <div>{children}</div>;
  }

  return (
    <div className="border rounded-lg mb-3">
      <Button
        variant="ghost"
        className="w-full justify-between p-4 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="font-medium">{title}</span>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isExpanded && <div className="px-4 pb-4 border-t">{children}</div>}
    </div>
  );
};
