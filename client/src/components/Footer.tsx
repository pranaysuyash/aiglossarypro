import { Link } from "wouter";
import { Github, Twitter, Linkedin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BaseComponentProps } from "@/types/common-props";
import { cn } from "@/lib/utils";

interface FooterProps extends BaseComponentProps {
  onSubscribe?: (email: string) => void;
}

export default function Footer({ className, onSubscribe }: FooterProps = {}) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = form.email.value;
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    
    if (onSubscribe) {
      onSubscribe(email);
    } else {
      // Here you would typically send the email to your backend
      toast({
        title: "Success",
        description: "You have been subscribed to our newsletter",
      });
    }
    form.reset();
  };

  return (
    <footer className={cn("bg-gray-900 text-gray-100 dark:bg-gray-950 dark:text-gray-50", className)} role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-300 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xl font-semibold text-white dark:text-gray-100">AI/ML Glossary</span>
            </div>
            <p className="text-sm mb-4 text-gray-100 dark:text-gray-50">
              A comprehensive resource for artificial intelligence and machine learning terminology, 
              designed to help you understand complex concepts.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-200 hover:text-white dark:text-gray-100 dark:hover:text-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Follow us on GitHub"
                title="Follow us on GitHub"
              >
                <Github className="h-6 w-6" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-200 hover:text-white dark:text-gray-100 dark:hover:text-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Follow us on Twitter"
                title="Follow us on Twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-200 hover:text-white dark:text-gray-100 dark:hover:text-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Connect with us on LinkedIn"
                title="Connect with us on LinkedIn"
              >
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white dark:text-gray-100 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href={isAuthenticated ? "/app" : "/"} className="text-gray-100 hover:text-white dark:text-gray-50 dark:hover:text-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-100 hover:text-white dark:text-gray-50 dark:hover:text-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-gray-100 hover:text-white dark:text-gray-50 dark:hover:text-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Favorites
                </Link>
              </li>
              <li>
                <a href="#about" className="text-gray-100 hover:text-white dark:text-gray-50 dark:hover:text-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">About Us</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white dark:text-gray-100 mb-4">Subscribe to Updates</h3>
            <p className="text-sm mb-4 text-gray-100 dark:text-gray-50">Get notified when we add new terms or update content.</p>
            <form onSubmit={handleSubscribe} className="flex" role="form" aria-label="Newsletter subscription">
              <label htmlFor="newsletter-email" className="sr-only">Email address for newsletter</label>
              <Input 
                id="newsletter-email"
                type="email" 
                name="email" 
                placeholder="Enter your email" 
                className="rounded-r-none focus:ring-primary dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-300" 
                required
                aria-describedby="newsletter-description"
              />
              <Button type="submit" className="rounded-l-none" aria-label="Subscribe to newsletter">
                Subscribe
              </Button>
            </form>
            <p id="newsletter-description" className="sr-only">Subscribe to receive updates about new AI/ML terms and content</p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 dark:border-gray-600 text-sm text-gray-100 dark:text-gray-50">
          <div className="flex flex-col md:flex-row justify-between">
            <p>&copy; {new Date().getFullYear()} AI/ML Glossary. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="/privacy" className="hover:text-white dark:hover:text-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white dark:hover:text-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Terms of Service
              </a>
              <a href="/cookies" className="hover:text-white dark:hover:text-gray-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
