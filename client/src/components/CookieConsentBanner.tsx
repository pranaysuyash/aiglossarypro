import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { BaseComponentProps } from "@/types/common-props";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Cookie, 
  Settings, 
  Shield, 
  BarChart, 
  Palette, 
  X, 
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";

interface CookieConsentBannerProps extends BaseComponentProps {
  onConsentChange?: (consent: CookieConsent) => void;
}

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
  timestamp: number;
}

const COOKIE_CONSENT_KEY = 'ai-glossary-cookie-consent';
const COOKIE_CONSENT_VERSION = '1.0';

export default function CookieConsentBanner({ 
  className, 
  onConsentChange 
}: CookieConsentBannerProps = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    preferences: false,
    marketing: false,
    timestamp: Date.now()
  });

  // Check if user has already given consent
  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent);
        // Check if the version matches (for future updates)
        if (parsed.version === COOKIE_CONSENT_VERSION) {
          setConsent(parsed.consent);
          // Don't show banner if consent already given
          return;
        }
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
      }
    }
    
    // Show banner after a short delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const saveConsent = (newConsent: CookieConsent) => {
    const consentData = {
      version: COOKIE_CONSENT_VERSION,
      consent: newConsent,
      timestamp: Date.now()
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setConsent(newConsent);
    setIsVisible(false);
    
    // Notify parent component
    if (onConsentChange) {
      onConsentChange(newConsent);
    }

    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
      detail: newConsent 
    }));
  };

  const handleAcceptAll = () => {
    const newConsent: CookieConsent = {
      essential: true,
      analytics: true,
      preferences: true,
      marketing: false, // We don't use marketing cookies
      timestamp: Date.now()
    };
    saveConsent(newConsent);
  };

  const handleAcceptEssential = () => {
    const newConsent: CookieConsent = {
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false,
      timestamp: Date.now()
    };
    saveConsent(newConsent);
  };

  const handleSavePreferences = () => {
    saveConsent({
      ...consent,
      timestamp: Date.now()
    });
  };

  const updateConsent = (type: keyof CookieConsent, value: boolean) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    setConsent(prev => ({
      ...prev,
      [type]: value
    }));
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg",
      className
    )}>
      <div className="container mx-auto max-w-6xl">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Cookie className="h-6 w-6 text-amber-600" />
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Cookie Settings
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    GDPR Compliant
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We use cookies to enhance your experience, analyze site usage, and remember your preferences. 
                  You can customize your cookie preferences below.
                </p>

                {/* Cookie Categories */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-green-600" />
                      <div>
                        <h3 className="font-medium text-sm">Essential Cookies</h3>
                        <p className="text-xs text-gray-500">Required for basic functionality</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={true} disabled />
                      <span className="text-xs text-gray-500">Always On</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart className="h-4 w-4 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-sm">Analytics Cookies</h3>
                        <p className="text-xs text-gray-500">Help us improve our service</p>
                      </div>
                    </div>
                    <Switch 
                      checked={consent.analytics} 
                      onCheckedChange={(checked) => updateConsent('analytics', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Palette className="h-4 w-4 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-sm">Preference Cookies</h3>
                        <p className="text-xs text-gray-500">Remember your settings</p>
                      </div>
                    </div>
                    <Switch 
                      checked={consent.preferences} 
                      onCheckedChange={(checked) => updateConsent('preferences', checked)}
                    />
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs p-0 h-auto text-blue-600 hover:text-blue-700 hover:bg-transparent"
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {showDetails ? 'Hide' : 'Show'} detailed information
                    {showDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                  </Button>
                  
                  {showDetails && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Essential Cookies
                          </h4>
                          <p className="text-blue-700 dark:text-blue-300">
                            Authentication, security, and basic functionality. These cannot be disabled.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Analytics Cookies
                          </h4>
                          <p className="text-blue-700 dark:text-blue-300">
                            Anonymous usage statistics via Google Analytics 4 and PostHog to improve our service and understand user behavior.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Preference Cookies
                          </h4>
                          <p className="text-blue-700 dark:text-blue-300">
                            Theme, language, and display preferences for a better experience.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Data Processing
                          </h4>
                          <p className="text-blue-700 dark:text-blue-300">
                            Data is processed in accordance with our Privacy Policy and GDPR requirements.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleAcceptAll}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      Accept All
                    </Button>
                    <Button
                      onClick={handleAcceptEssential}
                      variant="outline"
                      size="sm"
                    >
                      Essential Only
                    </Button>
                    <Button
                      onClick={handleSavePreferences}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Save Preferences
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                      Privacy Policy
                    </Link>
                    <Separator orientation="vertical" className="h-3" />
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                      Terms of Service
                    </Link>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close cookie banner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Hook to get current cookie consent
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const loadConsent = () => {
      const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (savedConsent) {
        try {
          const parsed = JSON.parse(savedConsent);
          setConsent(parsed.consent);
        } catch (error) {
          console.error('Error parsing cookie consent:', error);
        }
      }
    };

    loadConsent();

    // Listen for consent updates
    const handleConsentUpdate = (event: CustomEvent) => {
      setConsent(event.detail);
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate as EventListener);
    };
  }, []);

  return consent;
}

// Utility function to check if a specific cookie type is allowed
export function isCookieAllowed(type: keyof CookieConsent): boolean {
  try {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) return false;
    
    const parsed = JSON.parse(savedConsent);
    return parsed.consent?.[type] ?? false;
  } catch (error) {
    console.error('Error checking cookie consent:', error);
    return false;
  }
}