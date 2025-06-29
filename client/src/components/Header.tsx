import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, ChevronDown, User, Heart, Sun, Moon, Settings } from "lucide-react";
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
    <header id="navigation" className="bg-white shadow-sm sticky top-0 z-10 dark:bg-gray-800" role="banner">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer" role="link" aria-label="AI/ML Glossary - Go to homepage">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>AI/ML Glossary Logo</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xl font-semibold hidden sm:inline">AI/ML Glossary</span>
                <span className="text-xl font-semibold sm:hidden">AI/ML</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <SearchBar onSearch={handleSearch} />
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
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
              className="md:hidden bg-gray-100 p-2 rounded-lg dark:bg-gray-700" 
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label={mobileSearchOpen ? "Close search" : "Open search"}
            >
              <Search className="h-5 w-5 text-gray-500 dark:text-gray-300" />
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
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search (hidden by default) */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-4">
            <SearchBar onSearch={handleSearch} />
          </div>
        )}
        
        {/* Mobile menu (hidden by default) */}
        {mobileMenuOpen && (
          <div 
            id="mobile-navigation-menu" 
            ref={mobileMenuRef}
            className="md:hidden py-4 border-t border-gray-100 dark:border-gray-700"
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
              <ul className="flex flex-col space-y-2">
                <li>
                  <Link href="/">
                    <a className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                      Home
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard">
                    <a className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                      Dashboard
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/categories">
                    <a className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                      Categories
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/trending">
                    <a className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                      Trending
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/favorites">
                    <a className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                      Favorites
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/ai-tools">
                    <a className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                      AI Tools
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/lifetime">
                    <a className="block px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                      Get Lifetime Access
                    </a>
                  </Link>
                </li>
                {!isAuthenticated && (
                  <li>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleLogin}
                      className="mx-3 mt-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Sign in to your account"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
