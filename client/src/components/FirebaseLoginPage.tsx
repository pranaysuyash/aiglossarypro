import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, Eye, EyeOff } from '@/components/ui/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useLiveRegion } from '@/components/accessibility/LiveRegion';
import { signInWithProvider, signInWithEmail, createAccount } from '@/lib/firebase';
import { api } from '@/lib/api';
import { OptimizedImage } from '@/components/ui/optimized-image';

export default function FirebaseLoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { announce } = useLiveRegion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + L to focus login tab
      if (event.altKey && event.key === 'l') {
        event.preventDefault();
        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
        loginTab?.click();
        loginTab?.focus();
        announce('Switched to login tab', 'polite');
      }
      
      // Alt + R to focus register tab
      if (event.altKey && event.key === 'r') {
        event.preventDefault();
        const registerTab = document.querySelector('[value="register"]') as HTMLElement;
        registerTab?.click();
        registerTab?.focus();
        announce('Switched to registration tab', 'polite');
      }
      
      // Alt + G for Google sign in
      if (event.altKey && event.key === 'g') {
        event.preventDefault();
        if (!loading) {
          handleOAuthLogin('google');
          announce('Initiating Google sign-in', 'polite');
        }
      }
      
      // Alt + H for GitHub sign in
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        if (!loading) {
          handleOAuthLogin('github');
          announce('Initiating GitHub sign-in', 'polite');
        }
      }
      
      // Show keyboard shortcuts help
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault();
        announce('Keyboard shortcuts: Alt+L for login tab, Alt+R for register tab, Alt+G for Google sign-in, Alt+H for GitHub sign-in', 'polite');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, announce]);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      setError(null);

      // Provide immediate feedback
      announce(`Initiating ${provider} sign-in...`, 'polite');
      
      // Sign in with Firebase
      const { idToken } = await signInWithProvider(provider);

      // Show progress feedback
      announce('Completing authentication...', 'polite');
      
      // Exchange Firebase token for JWT
      const response = await api.post('/api/auth/firebase/login', { idToken });

      if (response.success) {
        // Store token in localStorage for API calls
        localStorage.setItem('authToken', response.data.token);
        
        // Check for premium status
        const userType = response.data.user.lifetimeAccess ? 'Premium' : 'Free';
        const welcomeMessage = response.data.user.lifetimeAccess 
          ? `Welcome back, ${response.data.user.email}! Your premium access is active.`
          : `Welcome back, ${response.data.user.email}!`;
        
        toast({
          title: `${userType} User - Welcome back!`,
          description: welcomeMessage,
          duration: 5000,
        });
        
        announce(`Successfully signed in as ${response.data.user.email}${response.data.user.lifetimeAccess ? ' with premium access' : ''}`, 'polite');

        // Redirect based on user type and status
        if (response.data.user.isAdmin) {
          navigate('/admin');
        } else if (response.data.user.lifetimeAccess) {
          navigate('/dashboard?welcome=premium');
        } else {
          navigate('/dashboard?welcome=true');
        }
      }
    } catch (err: any) {
      console.error(`${provider} OAuth error:`, err);
      
      // Handle specific Firebase error codes
      let errorMessage = `Failed to sign in with ${provider}`;
      if (err.code) {
        switch (err.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign-in was cancelled. Please try again.';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup was blocked by your browser. Please allow popups and try again.';
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = 'Another sign-in popup is already open.';
            break;
          case 'auth/internal-error':
            errorMessage = 'Authentication service is temporarily unavailable. Please try again in a moment.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'auth/account-exists-with-different-credential':
            errorMessage = 'An account with this email already exists. Please try signing in with a different method.';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      announce(`OAuth sign-in error: ${errorMessage}`, 'assertive');
      
      // Show error toast as well
      toast({
        title: 'Sign-in Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Provide immediate feedback
      announce('Signing in...', 'polite');
      
      // Sign in with Firebase
      const { idToken } = await signInWithEmail(email, password);

      // Show progress feedback
      announce('Completing authentication...', 'polite');
      
      // Exchange Firebase token for JWT
      const response = await api.post('/api/auth/firebase/login', { idToken });

      if (response.success) {
        localStorage.setItem('authToken', response.data.token);
        
        // Check for premium status
        const userType = response.data.user.lifetimeAccess ? 'Premium' : 'Free';
        const welcomeMessage = response.data.user.lifetimeAccess 
          ? `Welcome back! Your premium access is active.`
          : `Welcome back!`;
        
        toast({
          title: `${userType} User - Welcome back!`,
          description: welcomeMessage,
          duration: 5000,
        });
        
        announce(`Successfully signed in as ${response.data.user.email}${response.data.user.lifetimeAccess ? ' with premium access' : ''}`, 'polite');

        // Redirect based on user type and status
        if (response.data.user.isAdmin) {
          navigate('/admin');
        } else if (response.data.user.lifetimeAccess) {
          navigate('/dashboard?welcome=premium');
        } else {
          navigate('/dashboard?welcome=true');
        }
      }
    } catch (err: any) {
      console.error('Email login error:', err);
      
      // Handle specific Firebase error codes for email login
      let errorMessage = 'Failed to sign in';
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address format.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          case 'auth/internal-error':
            errorMessage = 'Authentication service is temporarily unavailable. Please try again in a moment.';
            break;
          case 'auth/invalid-login-credentials':
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      announce(`Sign-in error: ${errorMessage}`, 'assertive');
      
      // Show error toast as well
      toast({
        title: 'Sign-in Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Provide immediate feedback
      announce('Creating your account...', 'polite');
      
      // Create account in backend (which creates Firebase user)
      const response = await api.post('/api/auth/firebase/register', {
        email,
        password,
        firstName,
        lastName
      });

      if (response.success) {
        toast({
          title: 'Account created successfully!',
          description: 'Welcome to AI/ML Glossary! You can now sign in with your new account.',
          duration: 6000,
        });
        
        announce('Account created successfully! Please sign in to continue.', 'polite');

        // Clear form
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        
        // Switch to login tab
        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
        loginTab?.click();
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle specific Firebase error codes for registration
      let errorMessage = 'Failed to create account';
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists. Please sign in instead.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password (at least 6 characters).';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address format.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.';
            break;
          case 'auth/internal-error':
            errorMessage = 'Authentication service is temporarily unavailable. Please try again in a moment.';
            break;
          default:
            errorMessage = err.message || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      announce(`Registration error: ${errorMessage}`, 'assertive');
      
      // Show error toast as well
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Welcome to AI/ML Glossary</h1>
          <p className="text-muted-foreground">Sign in to save progress and unlock features</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription id="login-error register-error">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className={`grid w-full ${import.meta.env.DEV ? 'grid-cols-3' : 'grid-cols-2'}`} role="tablist" aria-label="Authentication options">
            <TabsTrigger value="login" role="tab" aria-controls="login-panel">Sign In</TabsTrigger>
            <TabsTrigger value="register" role="tab" aria-controls="register-panel">Sign Up</TabsTrigger>
            {import.meta.env.DEV && <TabsTrigger value="test" role="tab" aria-controls="test-panel">Test Users</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="login" className="space-y-4" role="tabpanel" id="login-panel" aria-labelledby="login-tab">
            {/* OAuth Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleOAuthLogin('google')}
                disabled={loading}
                aria-label="Sign in with Google"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Signing in with Google...</span>
                  </>
                ) : (
                  <OptimizedImage 
                    src="https://www.google.com/favicon.ico" 
                    alt="" 
                    width={16}
                    height={16}
                    className="mr-2 h-4 w-4" 
                    priority
                    aria-hidden="true"
                  />
                )}
                {loading ? 'Signing in...' : 'Continue with Google'}
              </Button>
              
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleOAuthLogin('github')}
                disabled={loading}
                aria-label="Sign in with GitHub"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Signing in with GitHub...</span>
                  </>
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                )}
                {loading ? 'Signing in...' : 'Continue with GitHub'}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Email/Password Login */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    aria-describedby={error ? "login-error" : undefined}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading} aria-describedby={error ? "login-error" : undefined}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Signing in...</span>
                  </>
                ) : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4" role="tabpanel" id="register-panel" aria-labelledby="register-tab">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    autoComplete="given-name"
                    aria-describedby={error ? "register-error" : undefined}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    autoComplete="family-name"
                    aria-describedby={error ? "register-error" : undefined}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registerEmail">Email</Label>
                <Input
                  id="registerEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  aria-describedby={error ? "register-error" : undefined}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registerPassword">Password</Label>
                <div className="relative">
                  <Input
                    id="registerPassword"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    autoComplete="new-password"
                    aria-describedby="password-requirements register-error"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <p id="password-requirements" className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading} aria-describedby={error ? "register-error" : undefined}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span className="sr-only">Creating account...</span>
                  </>
                ) : null}
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
          
          {import.meta.env.DEV && (
            <TabsContent value="test" className="space-y-4" role="tabpanel" id="test-panel" aria-labelledby="test-tab">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">Test User Accounts</h3>
                <p className="text-sm text-muted-foreground">
                  Pre-configured accounts for development and testing
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Regular User</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">USER</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><strong>Email:</strong> test@aimlglossary.com</div>
                    <div><strong>Password:</strong> testpass123</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEmail('test@aimlglossary.com');
                      setPassword('testpass123');
                      // Switch to login tab
                      const loginTab = document.querySelector('[value="login"]') as HTMLElement;
                      loginTab?.click();
                    }}
                    disabled={loading}
                    aria-label="Use test regular user account"
                  >
                    Use This Account
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Admin User</span>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">ADMIN</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><strong>Email:</strong> admin@aimlglossary.com</div>
                    <div><strong>Password:</strong> adminpass123</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEmail('admin@aimlglossary.com');
                      setPassword('adminpass123');
                      // Switch to login tab
                      const loginTab = document.querySelector('[value="login"]') as HTMLElement;
                      loginTab?.click();
                    }}
                    disabled={loading}
                    aria-label="Use test admin user account"
                  >
                    Use This Account
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-center text-muted-foreground">
                💡 These accounts are only available in development mode
              </div>
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
          <p className="text-xs text-muted-foreground">
            Keyboard shortcuts: <span className="kbd">?</span> for help, <span className="kbd">Alt+G</span> Google, <span className="kbd">Alt+H</span> GitHub
          </p>
        </div>
      </Card>
    </div>
  );
}