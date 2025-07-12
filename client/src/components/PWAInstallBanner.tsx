import { AnimatePresence, motion } from 'framer-motion';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface PWAInstallBannerProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  showOnlyOnMobile?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallBanner({
  onInstall,
  onDismiss,
  showOnlyOnMobile = true,
}: PWAInstallBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installType, setInstallType] = useState<'prompt' | 'offline' | 'visits'>('visits');
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();

  // Check if PWA install conditions are met
  const checkInstallConditions = () => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return false;
    }

    // Check if previously dismissed
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (dismissedDate > weekAgo) {
        return false;
      }
    }

    // Check mobile visits
    const visits = parseInt(localStorage.getItem('mobile_visits') || '0');
    const isOfflineCapable = 'serviceWorker' in navigator;
    const isMobile = showOnlyOnMobile ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : true;

    return isMobile && isOfflineCapable && (visits >= 3 || deferredPrompt);
  };

  // Track mobile visits
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      const visits = parseInt(localStorage.getItem('mobile_visits') || '0') + 1;
      localStorage.setItem('mobile_visits', visits.toString());
      localStorage.setItem('last_visit', new Date().toISOString());
    }
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setInstallType('prompt');
      
      if (checkInstallConditions()) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for offline events to trigger PWA promotion
  useEffect(() => {
    const handleOffline = () => {
      if (checkInstallConditions()) {
        setInstallType('offline');
        setIsVisible(true);
      }
    };

    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check conditions on mount
  useEffect(() => {
    setTimeout(() => {
      if (checkInstallConditions()) {
        setIsVisible(true);
      }
    }, 3000); // Show after 3 seconds
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          toast({
            title: '🎉 App Installed!',
            description: 'AI Glossary Pro has been added to your home screen.',
            duration: 5000,
          });
          
          // Track successful install
          localStorage.setItem('pwa_installed', 'true');
          localStorage.setItem('pwa_install_date', new Date().toISOString());
          
          onInstall?.();
        }
        
        setDeferredPrompt(null);
        setIsVisible(false);
      } catch (error) {
        console.error('Error during PWA installation:', error);
        toast({
          title: 'Installation Failed',
          description: 'Please try again or install manually from your browser menu.',
          variant: 'destructive',
        });
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Manual installation instructions
      toast({
        title: 'Manual Installation',
        description: 'Please use your browser\'s "Add to Home Screen" option.',
        duration: 6000,
      });
      
      setIsVisible(false);
      onInstall?.();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', new Date().toISOString());
    setIsVisible(false);
    onDismiss?.();
  };

  const getBannerContent = () => {
    switch (installType) {
      case 'offline':
        return {
          icon: <WifiOff className="w-6 h-6 text-orange-500" />,
          title: 'Stay Connected Offline',
          description: 'Install AI Glossary to access your saved terms even without internet',
          benefits: ['📱 Read saved terms offline', '⚡ Instant app loading', '🔄 Auto-sync when online'],
        };
      case 'prompt':
        return {
          icon: <Download className="w-6 h-6 text-blue-500" />,
          title: 'Install AI Glossary Pro',
          description: 'Get the full app experience with offline access and faster loading',
          benefits: ['🚀 Instant loading', '📱 Home screen access', '🔄 Background sync'],
        };
      default:
        return {
          icon: <Smartphone className="w-6 h-6 text-green-500" />,
          title: 'Add to Home Screen',
          description: 'Install AI Glossary for quick access and offline reading',
          benefits: ['📚 Offline term access', '⚡ Lightning fast', '🔔 Smart notifications'],
        };
    }
  };

  const content = getBannerContent();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
        >
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {content.icon}
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                      {content.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                      {content.description}
                    </CardDescription>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Benefits */}
              <div className="space-y-1 mb-4">
                {content.benefits.map((benefit, index) => (
                  <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    {benefit}
                  </div>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {isInstalling ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Install App
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="border-gray-300 dark:border-gray-600"
                >
                  Later
                </Button>
              </div>
              
              {/* App Store Info */}
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Free • No app store needed • Works offline
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to detect PWA installation status
export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstalled();

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    // Listen for install prompt availability
    window.addEventListener('beforeinstallprompt', () => {
      setCanInstall(true);
    });

    return () => {
      window.removeEventListener('appinstalled', checkInstalled);
      window.removeEventListener('beforeinstallprompt', checkInstalled);
    };
  }, []);

  return { isInstalled, canInstall };
}

export default PWAInstallBanner;