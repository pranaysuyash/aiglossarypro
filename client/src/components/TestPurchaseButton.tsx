import { AlertCircle, CheckCircle, Loader2, TestTube, Zap } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';

interface TestPurchaseButtonProps {
  onPurchaseComplete?: () => void;
  className?: string;
}

interface TestPurchaseResult {
  success: boolean;
  message: string;
  user?: {
    email: string;
    subscriptionTier: string;
    lifetimeAccess: boolean;
    purchaseDate: string;
  };
  testData?: {
    orderId: string;
    amount: string;
    environment: string;
  };
}

export function TestPurchaseButton({
  onPurchaseComplete,
  className = '',
}: TestPurchaseButtonProps) {
  const [email, setEmail] = useState('dev@example.com'); // Pre-fill with dev user email
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [result, setResult] = useState<TestPurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleTestPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsPurchasing(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/gumroad/test-purchase', { email: email.trim() });

      if (response.data.success) {
        setResult({
          success: true,
          message: response.data.message,
          user: response.data.user,
          testData: response.data.testData,
        });

        // Call onPurchaseComplete callback if provided
        if (onPurchaseComplete) {
          onPurchaseComplete();
        }

        // Refresh the page after a short delay to update the user session
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setResult({
          success: false,
          message: response.data.error || 'Test purchase failed',
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to complete test purchase';
      setError(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  };

  const resetForm = () => {
    setEmail('dev@example.com');
    setResult(null);
    setError(null);
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <div className={`${className}`}>
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100 flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          Test Purchase (Dev Mode)
        </Button>
      </div>
    );
  }

  return (
    <Card className={`max-w-md w-full ${className} border-yellow-300 bg-yellow-50`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <TestTube className="h-6 w-6 text-yellow-600" />
        </div>
        <CardTitle className="text-xl text-yellow-800">Test Purchase (Development)</CardTitle>
        <CardDescription className="text-yellow-700">
          Simulate a Gumroad purchase to test lifetime access functionality without payment.
        </CardDescription>
        <Badge variant="outline" className="mx-auto border-yellow-400 text-yellow-700">
          Development Mode Only
        </Badge>
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
                {result.testData && (
                  <div className="space-y-1 text-sm border-t pt-2">
                    <p className="font-medium text-yellow-700">Test Data:</p>
                    <div className="flex justify-between">
                      <span>Order ID:</span>
                      <span className="font-mono text-xs">{result.testData.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">{result.testData.amount}</span>
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

        {/* Test Purchase Form */}
        {!result?.success && (
          <form onSubmit={handleTestPurchase} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-yellow-800">
                Email Address for Test Purchase
              </label>
              <Input
                id="email"
                type="email"
                placeholder="dev@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPurchasing}
                required
                className="border-yellow-300 focus:border-yellow-500"
              />
              <p className="text-xs text-yellow-600">
                This email will be granted lifetime access for testing.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isPurchasing || !email.trim()}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Test Purchase...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Complete Test Purchase
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isPurchasing}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Help Text */}
        <div className="space-y-2 text-xs text-yellow-600 pt-2 border-t border-yellow-200">
          <p>
            <strong>How this works:</strong>
          </p>
          <ul className="space-y-1 list-disc list-inside ml-2">
            <li>Creates a fake Gumroad order ID</li>
            <li>Grants lifetime access to the specified email</li>
            <li>Records the purchase in the database</li>
            <li>Updates user session automatically</li>
          </ul>
          <p className="mt-2 font-medium text-yellow-700">⚠️ This only works in development mode</p>
        </div>
      </CardContent>
    </Card>
  );
}
