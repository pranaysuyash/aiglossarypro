import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

interface AdSenseConfig {
  enabled: boolean;
  clientId: string;
  slots: {
    searchResults: string;
    termDetail: string;
    sidebar: string;
    homepage: string;
  };
}

export function useAdSense() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AdSenseConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if ads should be shown (only for free tier users)
  const shouldShowAds = !user?.lifetimeAccess && import.meta.env.VITE_ADSENSE_ENABLED === 'true';

  useEffect(() => {
    // Initialize AdSense configuration
    const initConfig = () => {
      const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
      const enabled = import.meta.env.VITE_ADSENSE_ENABLED === 'true';

      if (!enabled || !clientId) {
        setConfig(null);
        return;
      }

      setConfig({
        enabled,
        clientId,
        slots: {
          searchResults: import.meta.env.VITE_AD_SLOT_SEARCH_RESULTS || '',
          termDetail: import.meta.env.VITE_AD_SLOT_TERM_DETAIL || '',
          sidebar: import.meta.env.VITE_AD_SLOT_SIDEBAR || '',
          homepage: import.meta.env.VITE_AD_SLOT_HOMEPAGE || '',
        },
      });
    };

    initConfig();
  }, []);

  // Load AdSense script
  useEffect(() => {
    if (!config || !shouldShowAds || isLoaded) {return;}

    const loadAdSense = async () => {
      try {
        // Check if script is already loaded
        const existingScript = document.querySelector(`script[src*="googlesyndication.com"]`);

        if (existingScript) {
          setIsLoaded(true);
          return;
        }

        // Load AdSense script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.clientId}`;
        script.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        // Initialize adsbygoogle array
        window.adsbygoogle = window.adsbygoogle || [];
        setIsLoaded(true);
      } catch (error) {
        console.warn('Failed to load AdSense script:', error);
      }
    };

    loadAdSense();
  }, [config, shouldShowAds, isLoaded]);

  // Analytics tracking for ad events
  const trackAdEvent = (eventName: string, adSlot: string, additionalData?: any) => {
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'Advertising',
        event_label: adSlot,
        ...additionalData,
      });
    }

    if ((window as any).posthog) {
      (window as any).posthog.capture(`ad_${eventName}`, {
        ad_slot: adSlot,
        ...additionalData,
      });
    }
  };

  return {
    config,
    isLoaded,
    shouldShowAds,
    trackAdEvent,
  };
}

// Helper hook for specific ad placements
export function useAdPlacement(placement: keyof AdSenseConfig['slots']) {
  const { config, shouldShowAds, trackAdEvent } = useAdSense();

  const adSlot = config?.slots[placement];
  const canShowAd = shouldShowAds && !!adSlot;

  const trackImpression = () => {
    if (adSlot) {
      trackAdEvent('impression', adSlot, { placement });
    }
  };

  const trackClick = () => {
    if (adSlot) {
      trackAdEvent('click', adSlot, { placement });
    }
  };

  return {
    adSlot,
    canShowAd,
    trackImpression,
    trackClick,
  };
}
