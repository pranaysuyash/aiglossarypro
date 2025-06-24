import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, Chrome, Github, Code } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface AuthProvider {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  url: string;
  enabled: boolean;
}

interface AuthProvidersResponse {
  success: boolean;
  data: {
    google: boolean;
    github: boolean;
    replit: boolean;
  };
}

const LoginPage: React.FC = () => {
  const [providers, setProviders] = useState<AuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchAuthProviders();
  }, []);
  
  const fetchAuthProviders = async () => {
    try {
      const response = await fetch('/api/auth/providers');
      const data: AuthProvidersResponse = await response.json();
      
      if (data.success) {
        const availableProviders: AuthProvider[] = [];
        
        if (data.data.google) {
          availableProviders.push({
            name: 'google',
            displayName: 'Google',
            icon: <Chrome className="w-5 h-5" />,
            url: '/api/auth/google',
            enabled: true
          });
        }
        
        if (data.data.github) {
          availableProviders.push({
            name: 'github',
            displayName: 'GitHub',
            icon: <Github className="w-5 h-5" />,
            url: '/api/auth/github',
            enabled: true
          });
        }
        
        if (data.data.replit) {
          availableProviders.push({
            name: 'replit',
            displayName: 'Replit',
            icon: <Code className="w-5 h-5" />,
            url: '/api/login',
            enabled: true
          });
        }
        
        setProviders(availableProviders);
      } else {
        setError('Failed to load authentication providers');
      }
    } catch (err) {
      console.error('Error fetching auth providers:', err);
      setError('Failed to connect to authentication service');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProviderLogin = (provider: AuthProvider) => {
    window.location.href = provider.url;
  };
  
  // Check for error in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        'google_auth_failed': 'Google authentication failed. Please try again.',
        'github_auth_failed': 'GitHub authentication failed. Please try again.',
        'replit_auth_failed': 'Replit authentication failed. Please try again.',
        'session_expired': 'Your session has expired. Please log in again.',
        'unauthorized': 'You are not authorized to access this resource.'
      };
      
      setError(errorMessages[errorParam] || 'Authentication failed. Please try again.');
    }
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading authentication options...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to AI Glossary Pro</CardTitle>
          <CardDescription>
            Sign in to access your personalized AI/ML glossary experience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {providers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No authentication providers are currently configured. Please contact the administrator.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Choose your preferred sign-in method:
              </p>
              
              {providers.map((provider) => (
                <Button
                  key={provider.name}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 py-6 text-base"
                  onClick={() => handleProviderLogin(provider)}
                  disabled={!provider.enabled}
                >
                  {provider.icon}
                  Continue with {provider.displayName}
                </Button>
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our Terms of Service and Privacy Policy.
              Your data is secured and never shared with third parties.
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              New to AI/ML? Our glossary includes beginner-friendly explanations
              for over 10,000 terms and concepts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
