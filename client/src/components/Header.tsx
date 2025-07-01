import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, ChevronDown, User, Heart, Sun, Moon, Settings, Home, BarChart3, Bookmark, Zap, Crown, LogOut, Grid3X3 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFocusTrap, useFocusLock } from "@/hooks/useFocusTrap";
import SearchBar from "./SearchBar";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Focus trap for mobile menu
  const mobileMenuRef = useFocusTrap(mobileMenuOpen);
  useFocusLock(mobileMenuOpen);
  
  // Handle escape key to close mobile menu
  const handleEscapeClose = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSearch = (query: string) => {
    navigate(`/terms?search=${encodeURIComponent(query)}`);
    setMobileSearchOpen(false);
  };

  const userObj = user as any;
  const initials = userObj?.firstName && userObj?.lastName 
    ? `${userObj.firstName[0]}${userObj.lastName[0]}`
    : userObj?.email?.substring(0, 2).toUpperCase() || "ML";

  return (
    <header id="navigation" className="bg-white shadow-sm sticky top-0 z-50 dark:bg-gray-800 transition-all duration-200" role="banner">
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          <div className="flex items-center space-x-1 xs:space-x-2 min-w-0 flex-shrink-0">
            <Link href={isAuthenticated ? "/app" : "/"}>
              <div className="flex items-center space-x-2 cursor-pointer" role="link" aria-label="AI/ML Glossary - Go to homepage">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 xs:h-8 xs:w-8 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>AI/ML Glossary Logo</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xl font-semibold hidden sm:inline">AI/ML Glossary</span>
                <span className="text-lg xs:text-xl font-semibold sm:hidden">AI/ML</span>
              </div>
            </Link>
          </div>

          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <SearchBar onSearch={handleSearch} />
          </div>
          
          <div className="hidden md:flex lg:hidden flex-1 max-w-md mx-4">
            <SearchBar onSearch={handleSearch} placeholder="Search..." />
          </div>
          
          {/* Ultra-small screen search (icon only for screens < 350px) */}
          <div className="hidden xs:flex sm:hidden ml-2">
            <SearchBar onSearch={handleSearch} iconOnly />
          </div>

          <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Lifetime Access Button */}
            <Link href="/lifetime">
              <Button 
                variant="default" 
                size="sm" 
                className="hidden lg:flex bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-4 py-2"
              >
                Get Lifetime Access
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="hidden md:flex lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-3 py-2"
              >
                Upgrade
              </Button>
            </Link>
            
            <button 
              className={`xs:hidden p-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${
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
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
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
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/categories")}>
                    Categories
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/trending")}>
                    Trending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/favorites")}>
                    My Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/ai-tools")}>
                    AI Tools
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    Admin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            
            <button 
              className={`lg:hidden p-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${
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

        {/* Mobile search (hidden by default) */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-4 animate-in slide-in-from-top-2 duration-200">
            <div className="px-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Search AI/ML Terms
                    </h3>
                    <button
                      onClick={() => setMobileSearchOpen(false)}
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
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
        
        {/* Mobile menu (hidden by default) */}
        {mobileMenuOpen && (
          <div 
            id="mobile-navigation-menu" 
            ref={mobileMenuRef as React.RefObject<HTMLDivElement>}
            className="lg:hidden py-4 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                handleEscapeClose();
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <nav aria-label="Mobile navigation menu" role="navigation">
              <div className="space-y-1">
                {/* Main Navigation Section */}
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Navigation
                  </div>
                  <div className="space-y-1">
                    <Link href="/">
                      <a 
                        className="mobile-nav-item flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Home className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Home</span>
                      </a>
                    </Link>
                    <Link href="/dashboard">
                      <a 
                        className="mobile-nav-item flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <BarChart3 className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Dashboard</span>
                      </a>
                    </Link>
                    <Link href="/categories">
                      <a 
                        className="mobile-nav-item flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Grid3X3 className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Categories</span>
                      </a>
                    </Link>
                    <Link href="/trending">
                      <a 
                        className="mobile-nav-item flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <BarChart3 className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">Trending</span>
                      </a>
                    </Link>
                  </div>
                </div>

                {/* User Section */}
                {isAuthenticated && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Your Account
                    </div>
                    <div className="space-y-1">
                      <Link href="/profile">
                        <a 
                          className="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <User className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium">Profile</span>
                        </a>
                      </Link>
                      <Link href="/favorites">
                        <a 
                          className="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Bookmark className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium">My Favorites</span>
                        </a>
                      </Link>
                      <Link href="/settings">
                        <a 
                          className="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Settings className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium">Settings</span>
                        </a>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Tools Section */}
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Tools & Features
                  </div>
                  <div className="space-y-1">
                    <Link href="/ai-tools">
                      <a 
                        className="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Zap className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium">AI Tools</span>
                      </a>
                    </Link>
                    {isAuthenticated && (
                      <Link href="/admin">
                        <a 
                          className="flex items-center px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Settings className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="font-medium">Admin</span>
                        </a>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="space-y-2">
                    <Link href="/lifetime">
                      <a 
                        className="flex items-center w-full px-3 py-3 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-150"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Crown className="mr-3 h-4 w-4" />
                        <span>Get Lifetime Access</span>
                      </a>
                    </Link>
                    
                    {!isAuthenticated ? (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => {
                          handleLogin();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-start focus:outline-none focus:ring-2 focus:ring-primary"
                        aria-label="Sign in to your account"
                      >
                        <User className="mr-3 h-4 w-4" />
                        <span>Sign In</span>
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500"
                        aria-label="Sign out of your account"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Sign Out</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
