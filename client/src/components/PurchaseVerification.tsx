import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

interface PurchaseVerificationProps {
  onVerified?: () => void;
  className?: string;
}

interface VerificationResult {
  success: boolean;
  message: string;
  user?: {
    email: string;
    subscriptionTier: string;
    lifetimeAccess: boolean;
    purchaseDate: string;
  };
}

export function PurchaseVerification({ onVerified, className = '' }: PurchaseVerificationProps) {
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/gumroad/verify-purchase', { email: email.trim() });

      if (response.data?.success) {
        setResult({
          success: true,
          message: response.data.message || 'Verification successful',
          user: response.data.user,
        });

        // Call onVerified callback if provided
        if (onVerified) {
          onVerified();
        }

        // Refresh the page after a short delay to update the user session
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: response.data?.error || 'Verification failed',
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to verify purchase';
      setError(errorMessage);

      if (err.response?.status === 404) {
        setResult({
          success: false,
          message: 'No purchase found for this email address',
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setResult(null);
    setError(null);
  };

  return (
    <Card className={`max-w-md w-full ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Verify Your Purchase</CardTitle>
        <CardDescription>
          Enter the email address you used for your Gumroad purchase to verify your lifetime access.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Result */}
        {result?.success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-medium">{result.message}</p>
                {result.user && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{result.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Access Level:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {result.user.subscriptionTier}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Purchase Date:</span>
                      <span className="font-medium">
                        {new Date(result.user.purchaseDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-green-600 mt-2">
                  Redirecting you to the glossary with full access...
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Result */}
        {result && !result.success && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-medium">{result.message}</p>
              <p className="text-sm mt-1">
                Please check your email address or contact support if you believe this is an error.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Verification Form */}
        {!result?.success && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isVerifying}
                required
              />
              <p className="text-xs text-gray-500">
                This should be the same email you used when purchasing on Gumroad.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isVerifying || !email.trim()} className="flex-1">
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Purchase'
                )}
              </Button>

              {(result || error) && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={isVerifying}>
                  Try Again
                </Button>
              )}
            </div>
          </form>
        )}

        {/* Help Text */}
        <div className="space-y-2 text-xs text-gray-500 pt-2 border-t">
          <p>
            <strong>Can't find your purchase?</strong>
          </p>
          <ul className="space-y-1 list-disc list-inside ml-2">
            <li>Check your email for the Gumroad receipt</li>
            <li>Make sure you're using the same email address</li>
            <li>Wait a few minutes if you just completed the purchase</li>
          </ul>
          <p className="mt-2">Need help? Contact support with your Gumroad order ID.</p>
        </div>
      </CardContent>
    </Card>
  );
}
