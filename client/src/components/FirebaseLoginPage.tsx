import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { signInWithProvider, signInWithEmail, createAccount } from '@/lib/firebase';
import { api } from '@/lib/api';

export default function FirebaseLoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      setError(null);

      // Sign in with Firebase
      const { idToken } = await signInWithProvider(provider);

      // Exchange Firebase token for JWT
      const response = await api.post('/api/auth/firebase/login', { idToken });

      if (response.success) {
        // Store token in localStorage for API calls
        localStorage.setItem('authToken', response.data.token);
        
        toast({
          title: 'Welcome back!',
          description: `Signed in as ${response.data.user.email}`,
        });

        // Redirect to dashboard or home
        navigate(response.data.user.isAdmin ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Sign in with Firebase
      const { idToken } = await signInWithEmail(email, password);

      // Exchange Firebase token for JWT
      const response = await api.post('/api/auth/firebase/login', { idToken });

      if (response.success) {
        localStorage.setItem('authToken', response.data.token);
        
        toast({
          title: 'Welcome back!',
          description: `Signed in as ${response.data.user.email}`,
        });

        navigate(response.data.user.isAdmin ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Create account in backend (which creates Firebase user)
      const response = await api.post('/api/auth/firebase/register', {
        email,
        password,
        firstName,
        lastName
      });

      if (response.success) {
        toast({
          title: 'Account created!',
          description: 'Please sign in with your new account.',
        });

        // Switch to login tab
        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
        loginTab?.click();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
            <TabsTrigger value="test">Test Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleOAuthLogin('google')}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <img 
                    src="https://www.google.com/favicon.ico" 
                    alt="Google" 
                    className="mr-2 h-4 w-4" 
                  />
                )}
                Continue with Google
              </Button>
              
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleOAuthLogin('github')}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                )}
                Continue with GitHub
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
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registerEmail">Email</Label>
                <Input
                  id="registerEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registerPassword">Password</Label>
                <Input
                  id="registerPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Account
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="test" className="space-y-4">
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
                >
                  Use This Account
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-center text-muted-foreground">
              💡 These accounts are only available in development mode
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </Card>
    </div>
  );
}