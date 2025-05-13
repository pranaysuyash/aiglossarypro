import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Search, ChevronDown, User } from "lucide-react";
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
import SearchBar from "./SearchBar";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.substring(0, 2).toUpperCase() || "ML";

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xl font-semibold">AI/ML Glossary</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <SearchBar />
          </div>

          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden bg-gray-100 p-2 rounded-lg dark:bg-gray-700" 
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            >
              <Search className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            </button>
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Avatar className="h-8 w-8">
                      {user?.profileImageUrl && (
                        <AvatarImage 
                          src={user.profileImageUrl} 
                          alt={user.firstName || "User"}
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
                  <DropdownMenuItem onClick={() => navigate("/favorites")}>
                    My Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    Settings
                  </DropdownMenuItem>
                  {user?.email === "admin@example.com" && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      Admin
                    </DropdownMenuItem>
                  )}
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
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
            <SearchBar />
          </div>
        )}
        
        {/* Mobile menu (hidden by default) */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-700">
            <nav className="flex flex-col space-y-2">
              <Link href="/">
                <div className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  Home
                </div>
              </Link>
              <Link href="/dashboard">
                <div className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  Dashboard
                </div>
              </Link>
              <Link href="/favorites">
                <div className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  Favorites
                </div>
              </Link>
              {!isAuthenticated && (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleLogin}
                  className="mx-3 mt-2"
                >
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
