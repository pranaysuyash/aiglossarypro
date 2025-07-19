import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import SearchBar from '@/components/SearchBar';
import { useTheme } from '@/components/ThemeProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  Bookmark,
  ChevronDown,
  Crown,
  GitBranch,
  Grid3X3,
  Home,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
  X,
  Zap,
} from '@/components/ui/icons';
import { useAccess } from '@/hooks/useAccess';
import { useAuth } from '@/hooks/useAuth';
import { useDailyUsage } from '@/hooks/useDailyUsage';
import type { BaseComponentProps } from '@/types/common-props';

interface HeaderProps extends BaseComponentProps {
  onSearch?: (query: string) => void;
  onLogout?: () => void;
  onLogin?: () => void;
}

export default function Header({ className, onSearch, onLogout, onLogin }: HeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { usage, shouldShowWarning } = useDailyUsage();
  const { accessStatus, isFreeTier, hasAccess: hasAccessToContent } = useAccess();

  // Focus trap for mobile menu - temporarily disabled for debugging
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  // const mobileMenuRef = useFocusTrap(mobileMenuOpen);
  // useFocusLock(mobileMenuOpen);

  // Handle escape key to close mobile menu
  const handleEscapeClose = () => {
    console.log('Escape key pressed, closing mobile menu'); // Debug log
    handleMobileMenuClose();
  };

  // Close mobile menu when clicking outside
  const _handleOutsideClick = (e: React.MouseEvent) => {
    console.log('Overlay clicked, closing mobile menu'); // Debug log
    if (e.target === e.currentTarget) {
      handleMobileMenuClose();
    }
  };

  // Handle mobile menu close - ensure it always works
  const handleMobileMenuClose = useCallback(() => {
    console.log('Mobile menu close clicked'); // Debug log
    setMobileMenuOpen(false);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      try {
        // Use the improved logout function from useAuth hook
        await logout();

        // Navigate to app home page after successful logout
        window.location.assign('/app');
      } catch (error: any) {
        console.error('Logout error:', error);
        // Fallback: force navigation to app home page even if logout fails
        window.location.assign('/app');
      }
    }
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      navigate('/login');
    }
  };

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    } else {
      navigate(`/terms?search=${encodeURIComponent(query)}`);
    }
    setMobileSearchOpen(false);
  };

  const userObj = user as any;
  const initials =
    userObj?.firstName && userObj?.lastName
      ? `${userObj.firstName[0]}${userObj.lastName[0]}`
      : userObj?.email?.substring(0, 2).toUpperCase() || 'ML';

  // Debug user data
  useEffect(() => {
    if (userObj) {
      console.log('Current user data:', {
        email: userObj.email,
        subscriptionTier: userObj.subscriptionTier,
        lifetimeAccess: userObj.lifetimeAccess,
        isAdmin: userObj.isAdmin,
        accessStatus: accessStatus,
        isFreeTier: isFreeTier,
        hasAccessToContent: hasAccessToContent,
      });
    }
  }, [userObj, accessStatus, isFreeTier, hasAccessToContent]);

  // Handle escape key globally for mobile menu
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        handleMobileMenuClose();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen, handleMobileMenuClose]);

  return (
    <header
      id="navigation"
      className={`bg-white shadow-sm sticky top-0 z-50 dark:bg-gray-800 transition-all duration-200 ${className || ''}`}
    >
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center py-2 sm:py-3 lg:py-4 gap-1 sm:gap-2">
          {/* Logo and Branding */}
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <Link
              href={isAuthenticated ? '/app' : '/'}
              className="flex items-center space-x-2 cursor-pointer"
              aria-label="AI/ML Glossary - Go to homepage"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 sm:h-8 sm:w-8 text-primary flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>AI/ML Glossary Logo</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span className="text-xl font-semibold hidden sm:inline whitespace-nowrap">
                AI/ML Glossary
              </span>
              <span className="text-base font-semibold sm:hidden whitespace-nowrap">AI/ML</span>
            </Link>
          </div>

          {/* Search Bar - More prominent and visible on more screen sizes */}
          <div className="hidden sm:flex flex-1 max-w-xl mx-4 lg:mx-8" data-testid="search-input">
            <div className="relative w-full group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-200"></div>
              <SearchBar 
                onSearch={handleSearch} 
                className="relative w-full" 
                placeholder="Search 10,000+ AI/ML terms..." 
              />
            </div>
          </div>

          {/* Right-side action icons */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden md:flex h-8 w-8 lg:h-10 lg:w-10 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </Button>

            {/* Surprise Me Button - More responsive */}
            <Link href="/surprise-me">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex font-medium px-2 lg:px-3 py-2 text-xs lg:text-sm"
                title="Discover amazing AI/ML terms you never knew existed!"
              >
                <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                <span className="hidden xl:inline">Surprise Me</span>
                <span className="xl:hidden">Surprise</span>
              </Button>
            </Link>

            {/* Premium Status or Upgrade Button - Only show for authenticated users */}
            {isAuthenticated && user?.lifetimeAccess && (
              <Badge
                variant="secondary"
                className="hidden xl:flex bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-3 lg:px-4 py-1 lg:py-2 font-medium text-xs lg:text-sm"
              >
                <Crown className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                <span className="hidden lg:inline">Premium</span>
                <span className="lg:hidden">Pro</span>
              </Badge>
            )}
            
            {/* Upgrade Button - Only for authenticated free users */}
            {isAuthenticated && !user?.lifetimeAccess && (
              <Link href="/lifetime">
                <Button
                  variant="default"
                  size="sm"
                  className="hidden md:flex font-medium px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Crown className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-1.5" />
                  <span className="hidden lg:inline">Upgrade to Premium</span>
                  <span className="lg:hidden">Upgrade</span>
                </Button>
              </Link>
            )}

            {/* Mobile Search Toggle - More prominent on mobile */}
            <button
              type="button"
              className={`sm:hidden h-10 w-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center shadow-sm ${
                mobileSearchOpen
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-primary/10 hover:bg-primary/20 border border-primary/20'
              }`}
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
              aria-expanded={mobileSearchOpen}
            >
              <Search
                className={`h-5 w-5 transition-transform duration-200 ${
                  mobileSearchOpen
                    ? 'text-primary-foreground scale-110'
                    : 'text-primary'
                }`}
              />
            </button>

            {/* User Dropdown or Sign In Button - Show on desktop */}
            {isAuthenticated ? (
              <div className="hidden md:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 h-8 w-8 lg:h-10 lg:w-10 relative"
                      aria-label={`User menu for ${userObj?.firstName || 'User'}`}
                    >
                      <Avatar className="h-6 w-6 lg:h-8 lg:w-8">
                        {userObj?.profileImageUrl && (
                          <AvatarImage
                            src={userObj.profileImageUrl}
                            alt={userObj.firstName || 'User'}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 text-xs lg:text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {/* Daily limit warning indicator */}
                      {shouldShowWarning && (
                        <div
                          className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-pulse"
                          title={`${usage?.remainingViews || 0} views remaining today`}
                        />
                      )}
                      <ChevronDown className="ml-0.5 lg:ml-1 h-3 w-3 lg:h-4 lg:w-4 text-gray-500 dark:text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {/* Premium Status Header */}
                    {accessStatus?.lifetimeAccess && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-400 flex items-center">
                          <Crown className="w-4 h-4 mr-2" />
                          Premium Member
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {/* Daily Usage Info for Free Users */}
                    {!accessStatus?.lifetimeAccess && usage && !usage.isInGracePeriod && (
                      <>
                        <div className="px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex justify-between items-center">
                            <span>Daily usage</span>
                            <span
                              className={`font-medium ${usage.remainingViews <= 10 ? 'text-orange-600 dark:text-orange-400' : ''}`}
                            >
                              {usage.todayViews}/{usage.dailyLimit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                usage.percentageUsed >= 90
                                  ? 'bg-red-500'
                                  : usage.percentageUsed >= 80
                                    ? 'bg-orange-500'
                                    : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                            />
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {/* Grace Period Info */}
                    {!accessStatus?.lifetimeAccess && usage?.isInGracePeriod && (
                      <>
                        <div className="px-2 py-1.5 text-xs text-green-600 dark:text-green-400 flex items-center">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Grace period: {usage.gracePeriodDaysLeft} days left
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/categories')}>
                      Categories
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/learning-paths')}>
                      Learning Paths
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/discovery')}>
                      Discovery
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate('/surprise-me')}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Surprise Me
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/code-examples')}>
                      Code Examples
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/trending')}>
                      Trending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorites')}>
                      My Favorites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/ai-tools')}>
                      AI Tools
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      Settings
                    </DropdownMenuItem>
                    {userObj?.isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>Admin</DropdownMenuItem>
                    )}

                    {/* Upgrade Option for Free Users */}
                    {!accessStatus?.lifetimeAccess && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate('/lifetime')}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Premium
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  handleLogin();
                  handleMobileMenuClose();
                }}
                className="hidden md:flex text-xs lg:text-sm px-3 lg:px-4 py-1.5 lg:py-2 font-medium"
              >
                <User className="mr-1.5 lg:mr-2 h-3.5 w-3.5 lg:h-4 lg:w-4" />
                <span>Sign In</span>
              </Button>
            )}

            {/* Mobile Menu Toggle (Hamburger) - Visible on mobile and tablet */}
            <button
              type="button"
              className={`lg:hidden h-10 w-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center ${
                mobileMenuOpen
                  ? 'bg-gray-100 dark:bg-gray-700 rotate-90'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 transition-transform duration-200" />
              ) : (
                <Menu className="h-5 w-5 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search panel */}
        {mobileSearchOpen && (
          <div className="sm:hidden pb-4 animate-in slide-in-from-top-2 duration-200">
            <div className="px-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Search AI/ML Terms
                    </h3>
                    <button
                      type="button"
                      onClick={() => setMobileSearchOpen(false)}
                      className="h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center"
                      aria-label="Close search"
                    >
                      <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <SearchBar onSearch={handleSearch} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="xl:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={handleMobileMenuClose}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <div
              id="mobile-navigation-menu"
              ref={mobileMenuRef as React.RefObject<HTMLDivElement>}
              className="xl:hidden fixed top-0 right-0 z-50 w-80 max-w-[85vw] h-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
              style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
              onClick={e => {
                // Prevent clicks inside the menu from bubbling to the backdrop
                e.stopPropagation();
                console.log('Menu panel clicked');
              }}
              onKeyDown={e => {
                // Handle keyboard events for accessibility
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleEscapeClose();
                }
              }}
            >
              {/* Mobile Menu Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isAuthenticated && (
                    <>
                      <Avatar className="h-8 w-8">
                        {userObj?.profileImageUrl && (
                          <AvatarImage
                            src={userObj.profileImageUrl}
                            alt={userObj.firstName || 'User'}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {userObj?.firstName || 'User'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {userObj?.email}
                        </div>
                      </div>
                    </>
                  )}
                  {!isAuthenticated && (
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      AI Glossary Pro
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleMobileMenuClose}
                  className="h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center"
                  aria-label="Close mobile menu"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <nav className="p-4" aria-label="Mobile navigation menu">
                {/* Main Navigation */}
                <div className="mb-6">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Navigation
                  </div>
                  <div className="space-y-1">
                    <Link
                      href="/"
                      onClick={_e => {
                        console.log('Home clicked');
                        handleMobileMenuClose();
                      }}
                      className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <Home className="mr-3 h-5 w-5" /> Home
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={_e => {
                        console.log('Dashboard clicked');
                        handleMobileMenuClose();
                      }}
                      className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] cursor-pointer"
                      data-testid="dashboard-nav"
                    >
                      <BarChart3 className="mr-3 h-5 w-5" /> Dashboard
                    </Link>
                    <Link
                      href="/categories"
                      onClick={_e => {
                        console.log('Categories clicked');
                        handleMobileMenuClose();
                      }}
                      className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] cursor-pointer"
                      data-testid="categories-nav"
                    >
                      <Grid3X3 className="mr-3 h-5 w-5" /> Categories
                    </Link>
                    <Link
                      href="/learning-paths"
                      onClick={_e => {
                        console.log('Learning Paths clicked');
                        handleMobileMenuClose();
                      }}
                      className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <Bookmark className="mr-3 h-5 w-5" /> Learning Paths
                    </Link>
                    <Link
                      href="/discovery"
                      onClick={_e => {
                        console.log('Discovery clicked');
                        handleMobileMenuClose();
                      }}
                      className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <GitBranch className="mr-3 h-5 w-5" /> Discovery
                    </Link>
                    <Link
                      href="/surprise-me"
                      onClick={_e => {
                        console.log('Surprise Me clicked');
                        handleMobileMenuClose();
                      }}
                      className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors min-h-[44px] text-purple-600 dark:text-purple-400 cursor-pointer"
                    >
                      <Sparkles className="mr-3 h-5 w-5" /> Surprise Me
                    </Link>
                    <Link
                      href="/code-examples"
                      onClick={_e => {
                        console.log('Code Examples clicked');
                        handleMobileMenuClose();
                      }}
                      className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <Settings className="mr-3 h-5 w-5" /> Code Examples
                    </Link>
                    <Link
                      href="/trending"
                      onClick={_e => {
                        console.log('Trending clicked');
                        handleMobileMenuClose();
                      }}
                      className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <BarChart3 className="mr-3 h-5 w-5" /> Trending
                    </Link>
                  </div>
                </div>

                {/* User Section */}
                {isAuthenticated && (
                  <div className="mb-6">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Your Account
                    </div>
                    <div className="space-y-1">
                      <Link
                        href="/profile"
                        onClick={handleMobileMenuClose}
                        className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                      >
                        <User className="mr-3 h-5 w-5" /> Profile
                      </Link>
                      <Link
                        href="/favorites"
                        onClick={handleMobileMenuClose}
                        className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                      >
                        <Bookmark className="mr-3 h-5 w-5" /> My Favorites
                      </Link>
                      <Link
                        href="/settings"
                        onClick={handleMobileMenuClose}
                        className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                      >
                        <Settings className="mr-3 h-5 w-5" /> Settings
                      </Link>
                    </div>
                  </div>
                )}

                {/* Tools Section */}
                <div className="mb-6">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Tools & Features
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="mobile-nav-item w-full flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] text-left cursor-pointer"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Theme toggle clicked');
                        toggleTheme();
                        handleMobileMenuClose();
                      }}
                    >
                      {theme === 'dark' ? (
                        <Sun className="mr-3 h-5 w-5" />
                      ) : (
                        <Moon className="mr-3 h-5 w-5" />
                      )}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <Link
                      href="/ai-tools"
                      onClick={handleMobileMenuClose}
                      className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                    >
                      <Zap className="mr-3 h-5 w-5" /> AI Tools
                    </Link>
                    {isAuthenticated && userObj?.isAdmin && (
                      <Link
                        href="/admin"
                        onClick={handleMobileMenuClose}
                        className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                      >
                        <Settings className="mr-3 h-5 w-5" /> Admin
                      </Link>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Premium Status for Authenticated Users */}
                  {isAuthenticated && accessStatus?.lifetimeAccess && (
                    <div className="flex items-center justify-center py-2 px-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                      <Crown className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Premium Member</span>
                    </div>
                  )}

                  {/* Upgrade Button for Free Users */}
                  {isAuthenticated && !accessStatus?.lifetimeAccess && (
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      onClick={() => {
                        navigate('/lifetime');
                        handleMobileMenuClose();
                      }}
                      className="w-full justify-center min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Crown className="mr-3 h-5 w-5" /> Upgrade to Premium
                    </Button>
                  )}

                  {!isAuthenticated ? (
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      onClick={() => {
                        handleLogin();
                        handleMobileMenuClose();
                      }}
                      className="w-full justify-center min-h-[48px]"
                    >
                      <User className="mr-3 h-5 w-5" /> Sign In
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={() => {
                        handleLogout();
                        handleMobileMenuClose();
                      }}
                      className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 min-h-[48px]"
                    >
                      <LogOut className="mr-3 h-5 w-5" /> Sign Out
                    </Button>
                  )}
                </div>
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
