/**
 * Enhanced Mobile Navigation Component
 * Touch-optimized navigation with gesture support and mobile-first design
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Search, 
  BookOpen, 
  Star, 
  User, 
  Menu, 
  X, 
  TrendingUp, 
  Shuffle,
  Code,
  MapPin,
  Settings,
  ChevronRight,
  Compass
} from 'lucide-react';
import { useGestureNavigation } from '../../hooks/useGestureNavigation';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface MobileNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  color?: string;
  description?: string;
}

const primaryNavItems: MobileNavItem[] = [
  {
    label: 'Home',
    path: '/',
    icon: Home,
    color: 'text-blue-600',
    description: 'Dashboard and overview'
  },
  {
    label: 'Search',
    path: '/search',
    icon: Search,
    color: 'text-green-600',
    description: 'Find AI/ML terms'
  },
  {
    label: 'Categories',
    path: '/categories',
    icon: BookOpen,
    color: 'text-purple-600',
    description: 'Browse by topic'
  },
  {
    label: 'Trending',
    path: '/trending',
    icon: TrendingUp,
    color: 'text-red-600',
    description: 'Popular content'
  },
  {
    label: 'Surprise Me',
    path: '/surprise-me',
    icon: Shuffle,
    color: 'text-orange-600',
    description: 'Random discovery'
  }
];

const secondaryNavItems: MobileNavItem[] = [
  {
    label: 'Learning Paths',
    path: '/learning-paths',
    icon: MapPin,
    color: 'text-indigo-600',
    description: 'Structured learning'
  },
  {
    label: 'Code Examples',
    path: '/code-examples',
    icon: Code,
    color: 'text-teal-600',
    description: 'Implementation guides'
  },
  {
    label: 'Discovery',
    path: '/discovery',
    icon: Compass,
    color: 'text-pink-600',
    description: 'Explore relationships'
  },
  {
    label: 'Favorites',
    path: '/favorites',
    icon: Star,
    color: 'text-yellow-600',
    description: 'Saved content'
  }
];

interface MobileNavigationProps {
  className?: string;
  showGestureHints?: boolean;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  className,
  showGestureHints = true 
}) => {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const {
    isGestureActive,
    currentGesture,
    getGestureStats,
    triggerHaptic
  } = useGestureNavigation({
    enableHaptic: true,
    enableSwipeNavigation: true
  });

  // Close menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Determine if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Get current page info
  const getCurrentPageInfo = () => {
    const currentItem = [...primaryNavItems, ...secondaryNavItems].find(item => 
      item.path === location || (item.path !== '/' && location.startsWith(item.path))
    );
    return currentItem || primaryNavItems[0];
  };

  const currentPage = getCurrentPageInfo();

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    triggerHaptic('light');
  };

  const handleNavClick = (path: string) => {
    triggerHaptic('medium');
    setIsMenuOpen(false);
  };

  const handleQuickActionToggle = () => {
    setShowQuickActions(!showQuickActions);
    triggerHaptic('light');
  };

  // Mobile Bottom Navigation Bar
  const BottomNavBar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {primaryNavItems.slice(0, 4).map((item) => {
          const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px]",
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 scale-105" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-1", isActive && "scale-110")} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
        
        {/* Menu button */}
        <button
          onClick={handleMenuToggle}
          className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">More</span>
        </button>
      </div>
    </div>
  );

  // Full Screen Menu
  const FullScreenMenu = () => (
    <div className={cn(
      "fixed inset-0 z-50 bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out",
      isMenuOpen ? "transform translate-x-0" : "transform translate-x-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className={cn("p-2 rounded-lg", currentPage.color?.replace('text-', 'bg-').replace('-600', '-100'))}>
            <currentPage.icon className={cn("w-6 h-6", currentPage.color)} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentPage.label}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentPage.description}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMenuToggle}
          className="p-2"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/surprise-me">
              <button 
                onClick={() => handleNavClick('/surprise-me')}
                className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 w-full text-left"
              >
                <Shuffle className="w-5 h-5" />
                <span className="font-medium">Surprise Me</span>
              </button>
            </Link>
            <Link href="/trending">
              <button 
                onClick={() => handleNavClick('/trending')}
                className="flex items-center space-x-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 w-full text-left"
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Trending</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Primary Navigation */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Main Navigation
          </h3>
          <div className="space-y-2">
            {primaryNavItems.map((item) => {
              const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
              const Icon = item.icon;
              
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Secondary Navigation */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Learning & Tools
          </h3>
          <div className="space-y-2">
            {secondaryNavItems.map((item) => {
              const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
              const Icon = item.icon;
              
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Section */}
        {user && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Account
            </h3>
            <div className="space-y-2">
              <Link href="/dashboard">
                <button
                  onClick={() => handleNavClick('/dashboard')}
                  className="flex items-center justify-between w-full p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Dashboard</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Your learning progress</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
              <Link href="/settings">
                <button
                  onClick={() => handleNavClick('/settings')}
                  className="flex items-center justify-between w-full p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Settings</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Preferences and account</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Gesture Hints */}
        {showGestureHints && isMobile && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Navigation Gestures
            </h4>
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div>← Swipe left: Previous page</div>
              <div>→ Swipe right: Next page</div>
              <div>↑ Swipe up: Categories/Main</div>
              <div>↓ Swipe down: Discovery/More</div>
            </div>
            {isGestureActive && (
              <Badge variant="outline" className="mt-2">
                Gesture Active
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!isMobile) return null;

  return (
    <div className={className}>
      <BottomNavBar />
      <FullScreenMenu />
      
      {/* Gesture feedback overlay */}
      {isGestureActive && currentGesture && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60 pointer-events-none">
          <div className="bg-black/80 text-white rounded-full px-4 py-2 text-sm font-medium">
            Swipe {currentGesture.direction}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNavigation;