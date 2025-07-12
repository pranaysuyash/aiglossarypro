import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, Loader2, Shield, Smartphone, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface MobileCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productUrl: string;
  price: string;
  productName: string;
}

export function MobileCheckout({
  isOpen,
  onClose,
  onSuccess,
  productUrl,
  price,
  productName,
}: MobileCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'loading' | 'iframe' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();
  const { user, refreshAuth } = useAuth();

  // Detect if user is on mobile device
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setCheckoutStep('iframe');
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setCheckoutStep('error');
    setErrorMessage('Failed to load checkout. Please try again.');
  };

  // Listen for postMessage from Gumroad
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security: Only accept messages from Gumroad
      if (!event.origin.includes('gumroad.com')) {
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case 'gumroad:purchase_complete':
          setCheckoutStep('success');
          
          // Refresh user authentication to get updated pro status
          try {
            await refreshAuth();
            
            toast({
              title: '🎉 Purchase Successful!',
              description: 'Welcome to AI Glossary Pro! Your account has been upgraded.',
              duration: 6000,
            });

            // Close overlay after showing success
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 2000);
          } catch (error) {
            console.error('Failed to refresh auth after purchase:', error);
          }
          break;

        case 'gumroad:purchase_failed':
          setCheckoutStep('error');
          setErrorMessage(data?.error || 'Purchase failed. Please try again.');
          break;

        case 'gumroad:overlay_closed':
          // User closed the Gumroad overlay without completing purchase
          onClose();
          break;

        default:
          console.log('Unknown message from Gumroad:', event.data);
      }
    };

    if (isOpen) {
      window.addEventListener('message', handleMessage);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, onClose, onSuccess, refreshAuth, toast]);

  // Build Gumroad URL with mobile optimization
  const buildGumroadUrl = () => {
    const baseUrl = productUrl;
    const params = new URLSearchParams({
      // Enable overlay mode for mobile
      overlay: 'true',
      // Pass user info if available
      ...(user?.email && { email: user.email }),
      ...(user?.displayName && { name: user.displayName }),
      // Mobile-specific parameters
      mobile: 'true',
      // Enable Apple Pay / Google Pay
      payment_methods: 'apple_pay,google_pay,card',
    });

    return `${baseUrl}?${params.toString()}`;
  };

  const gumroadUrl = buildGumroadUrl();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-green-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Secure Checkout
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Powered by Gumroad
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Mobile Payment Options Badge */}
          {isMobile() && (
            <div className="px-4 pb-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                <Smartphone className="w-4 h-4 mr-2" />
                Apple Pay & Google Pay Available
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pt-20 h-full">
          {checkoutStep === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Loading Secure Checkout
              </h3>
              <p className="text-gray-300 mb-4">
                Setting up your {productName} purchase...
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1 text-green-400" />
                  256-bit SSL
                </div>
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-1 text-blue-400" />
                  Secure Payment
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'iframe' && (
            <iframe
              ref={iframeRef}
              src={gumroadUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="Gumroad Checkout"
              allow="payment"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
            />
          )}

          {checkoutStep === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  ✓
                </motion.div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Welcome to AI Glossary Pro!
              </h3>
              <p className="text-gray-300 mb-6">
                Your purchase was successful. You now have unlimited access to all content.
              </p>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-white text-sm">
                  🚀 Unlimited term access<br />
                  📚 All premium features<br />
                  💬 Priority support
                </p>
              </div>
            </motion.div>
          )}

          {checkoutStep === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <Card className="max-w-md w-full bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">
                    Checkout Error
                  </CardTitle>
                  <CardDescription>
                    {errorMessage}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => {
                      setCheckoutStep('loading');
                      setIsLoading(true);
                      // Reload iframe
                      if (iframeRef.current) {
                        iframeRef.current.src = gumroadUrl;
                      }
                    }}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full"
                  >
                    Close
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Fallback: Load iframe initially */}
        {checkoutStep === 'loading' && (
          <iframe
            ref={iframeRef}
            src={gumroadUrl}
            className="hidden"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Gumroad Checkout (Loading)"
            allow="payment"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default MobileCheckout;