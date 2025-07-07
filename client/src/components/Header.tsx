import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, ChevronDown, User, Sun, Moon, Settings, Home, BarChart3, Bookmark, Zap, Crown, LogOut, Grid3X3, GitBranch, Sparkles } from "@/components/ui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useFocusTrap, useFocusLock } from "@/hooks/useFocusTrap";
import { useTheme } from "@/components/ThemeProvider";
import SearchBar from "./SearchBar";
import { BaseComponentProps } from "@/types/common-props";
import { queryClient } from "@/lib/queryClient";
import { signOutUser } from "@/lib/firebase";

interface HeaderProps extends BaseComponentProps {
  onSearch?: (query: string) => void;
  onLogout?: () => void;
  onLogin?: () => void;
}

export default function Header({
  className,
  onSearch,
  onLogout,
  onLogin
}: HeaderProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  // Focus trap for mobile menu
  const mobileMenuRef = useFocusTrap(mobileMenuOpen);
  useFocusLock(mobileMenuOpen);

  // Handle escape key to close mobile menu
  const handleEscapeClose = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setMobileMenuOpen(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      try {
        await signOutUser();
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
        queryClient.clear();
        localStorage.clear();
        sessionStorage.clear();
        window.location.assign("/");
      } catch (error) {
        console.error("Logout error:", error);
        queryClient.clear();
        localStorage.clear();
        sessionStorage.clear();
        window.location.assign("/");
      }
    }
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      navigate("/login");
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
  const initials = userObj?.firstName && userObj?.lastName
    ? `${userObj.firstName[0]}${userObj.lastName[0]}`
    : userObj?.email?.substring(0, 2).toUpperCase() || "ML";

  return (
    <header id="navigation" className={`bg-white shadow-sm sticky top-0 z-50 dark:bg-gray-800 transition-all duration-200 ${className || ''}`} role="banner">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4 gap-2 sm:gap-4">
          {/* Logo and Branding */}
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <Link href={isAuthenticated ? "/app" : "/"} className="flex items-center space-x-2 cursor-pointer" aria-label="AI/ML Glossary - Go to homepage">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <title>AI/ML Glossary Logo</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xl font-semibold hidden sm:inline whitespace-nowrap">AI/ML Glossary</span>
              <span className="text-base font-semibold sm:hidden whitespace-nowrap">AI/ML</span>
            </Link>
          </div>

          {/* Search Bars for different screen sizes */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <SearchBar onSearch={handleSearch} />
          </div>
          <div className="hidden md:flex lg:hidden flex-1 max-w-md mx-4">
            <SearchBar onSearch={handleSearch} placeholder="Search..." />
          </div>
          <div className="hidden sm:flex md:hidden flex-1 max-w-sm mx-3">
            <SearchBar onSearch={handleSearch} iconOnly />
          </div>

          {/* Right-side action icons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden sm:flex h-10 w-10 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </Button>

            {/* Surprise Me Button */}
            <Link href="/surprise-me">
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-3 py-2"
                title="Discover amazing AI/ML terms you never knew existed!"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Surprise Me
              </Button>
            </Link>

            {/* Premium Status or Upgrade Button */}
            {user?.lifetimeAccess ? (
              <Badge 
                variant="secondary" 
                className="hidden lg:flex bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-4 py-2 font-medium"
              >
                <Crown className="w-4 h-4 mr-2" />
                Premium
              </Badge>
            ) : (
              <>
                <Link href="/lifetime">
                  <Button
                    variant="default"
                    size="sm"
                    className="hidden lg:flex bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-4 py-2"
                  >
                    Get Lifetime Access
                  </Button>
                </Link>
                <Link href="/lifetime">
                    <Button
                        variant="default"
                        size="sm"
                        className="hidden md:flex lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-3 py-2"
                    >
                        Upgrade
                    </Button>
                </Link>
              </>
            )}

            {/* Mobile Search Toggle */}
            <button
              className={`sm:hidden h-10 w-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center ${
                mobileSearchOpen
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              aria-expanded={mobileSearchOpen}
            >
              <Search className={`h-5 w-5 transition-transform duration-200 ${
                mobileSearchOpen
                  ? 'text-primary-foreground scale-110'
                  : 'text-gray-500 dark:text-gray-300'
              }`} />
            </button>

            {/* User Dropdown or Sign In Button */}
            {isAuthenticated ? (
              <div className="hidden sm:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 h-10 w-10"
                      aria-label={`User menu for ${userObj?.firstName || 'User'}`}
                    >
                      <Avatar className="h-8 w-8">
                        {userObj?.profileImageUrl && (
                          <AvatarImage
                            src={userObj.profileImageUrl}
                            alt={userObj.firstName || "User"}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="ml-1 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {/* Premium Status Header */}
                    {user?.lifetimeAccess && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-400 flex items-center">
                          <Crown className="w-4 h-4 mr-2" />
                          Premium Member
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/categories")}>Categories</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/learning-paths")}>Learning Paths</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/discovery")}>Discovery</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/surprise-me")} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Surprise Me
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/code-examples")}>Code Examples</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/trending")}>Trending</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/favorites")}>My Favorites</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/ai-tools")}>AI Tools</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
                    {userObj?.isAdmin && <DropdownMenuItem onClick={() => navigate("/admin")}>Admin</DropdownMenuItem>}
                    
                    {/* Upgrade Option for Free Users */}
                    {!user?.lifetimeAccess && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => navigate("/lifetime")}
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
                variant="default"
                size="sm"
                onClick={handleLogin}
                className="hidden sm:flex"
              >
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}

            {/* Mobile Menu Toggle (Hamburger) */}
            <button
              className={`lg:hidden h-10 w-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center ${
                mobileMenuOpen
                  ? 'bg-gray-100 dark:bg-gray-700 rotate-90'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
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
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={handleOutsideClick}
          >
            <div
              id="mobile-navigation-menu"
              ref={mobileMenuRef as React.RefObject<HTMLDivElement>}
              className="bg-white dark:bg-gray-800 py-4 px-4 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-80px)] overflow-y-auto relative"
              onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); handleEscapeClose(); } }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <nav aria-label="Mobile navigation menu" role="navigation">
                {/* Main Navigation */}
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Navigation</div>
                  <div className="space-y-2">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                      <Home className="mr-3 h-5 w-5" /> Home
                    </Link>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                      <BarChart3 className="mr-3 h-5 w-5" /> Dashboard
                    </Link>
                    <Link href="/categories" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                      <Grid3X3 className="mr-3 h-5 w-5" /> Categories
                    </Link>
                    <Link href="/learning-paths" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                      <Bookmark className="mr-3 h-5 w-5" /> Learning Paths
                    </Link>
                    <Link href="/discovery" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                      <GitBranch className="mr-3 h-5 w-5" /> Discovery
                    </Link>
                    <Link href="/surprise-me" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors min-h-[44px] text-purple-600 dark:text-purple-400">
                      <Sparkles className="mr-3 h-5 w-5" /> Surprise Me
                    </Link>
                    <Link href="/code-examples" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                      <Settings className="mr-3 h-5 w-5" /> Code Examples
                    </Link>
                    <Link href="/trending" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                      <BarChart3 className="mr-3 h-5 w-5" /> Trending
                    </Link>
                  </div>
                </div>

                {/* User Section */}
                {isAuthenticated && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Account</div>
                    <div className="space-y-2">
                      <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                        <User className="mr-3 h-5 w-5" /> Profile
                      </Link>
                      <Link href="/favorites" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                        <Bookmark className="mr-3 h-5 w-5" /> My Favorites
                      </Link>
                      <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                        <Settings className="mr-3 h-5 w-5" /> Settings
                      </Link>
                    </div>
                  </div>
                )}

                {/* Tools Section */}
                <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tools & Features</div>
                    <div className="space-y-2">
                        <button className="mobile-nav-item w-full flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] text-left" onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}>
                            {theme === 'dark' ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />}
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                        <Link href="/ai-tools" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                            <Zap className="mr-3 h-5 w-5" /> AI Tools
                        </Link>
                        {isAuthenticated && userObj?.isAdmin && (
                            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-item flex items-center py-3 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]">
                                <Settings className="mr-3 h-5 w-5" /> Admin
                            </Link>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="space-y-3">
                    {/* Premium Status or Upgrade Button */}
                    {user?.lifetimeAccess ? (
                      <div className="flex items-center w-full px-4 py-4 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium text-base min-h-[48px]">
                        <Crown className="mr-3 h-5 w-5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-semibold">Premium Member</div>
                          <div className="text-sm opacity-90">Unlimited Access Active</div>
                        </div>
                      </div>
                    ) : (
                      <Link href="/lifetime" onClick={() => setMobileMenuOpen(false)} className="flex items-center w-full px-4 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-150 text-base min-h-[48px]">
                        <Crown className="mr-3 h-5 w-5 flex-shrink-0" />
                        <span className="whitespace-nowrap">Get Lifetime Access</span>
                      </Link>
                    )}
                    {!isAuthenticated ? (
                      <Button variant="default" size="lg" onClick={() => { handleLogin(); setMobileMenuOpen(false); }} className="w-full justify-center min-h-[48px]">
                        <User className="mr-3 h-5 w-5" /> Sign In
                      </Button>
                    ) : (
                      <Button variant="ghost" size="lg" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 min-h-[48px]">
                        <LogOut className="mr-3 h-5 w-5" /> Sign Out
                      </Button>
                    )}
                  </div>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
