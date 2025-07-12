import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface GoogleAdProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  lazy?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function GoogleAd({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
  lazy = true,
}: GoogleAdProps) {
  const { user } = useAuth();
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);

  // Don't show ads to premium users
  if (user?.lifetimeAccess) {
    return null;
  }

  // Don't show ads if AdSense is disabled
  const adsenseClientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  const adsenseEnabled = import.meta.env.VITE_ADSENSE_ENABLED === 'true';
  
  if (!adsenseEnabled || !adsenseClientId || !slot) {
    return null;
  }

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Load and initialize AdSense
  useEffect(() => {
    if (!isInView || adLoaded) return;

    const loadAdSense = async () => {
      try {
        // Load AdSense script if not already loaded
        if (!window.adsbygoogle) {
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;
          script.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });

          // Initialize adsbygoogle array
          window.adsbygoogle = window.adsbygoogle || [];
        }

        // Push ad configuration
        if (adRef.current && window.adsbygoogle) {
          (window.adsbygoogle as any[]).push({});
          setAdLoaded(true);
        }
      } catch (error) {
        console.warn('Failed to load AdSense:', error);
      }
    };

    loadAdSense();
  }, [isInView, adLoaded, adsenseClientId]);

  // Calculate ad dimensions based on format
  const getAdDimensions = () => {
    switch (format) {
      case 'rectangle':
        return { width: '300px', height: '250px' };
      case 'vertical':
        return { width: '160px', height: '600px' };
      case 'horizontal':
        return { width: '728px', height: '90px' };
      case 'fluid':
        return { width: '100%', height: 'auto' };
      default:
        return responsive ? { width: '100%', height: 'auto' } : { width: '320px', height: '50px' };
    }
  };

  const adDimensions = getAdDimensions();
  const adStyle = {
    display: 'block',
    ...adDimensions,
    ...style,
  };

  return (
    <div
      ref={adRef}
      className={`google-ad-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '20px 0',
        position: 'relative',
      }}
    >
      {/* Ad Label */}
      <div
        style={{
          fontSize: '10px',
          color: '#666',
          marginBottom: '4px',
          fontFamily: 'Arial, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Advertisement
      </div>

      {/* Ad Unit */}
      {isInView && (
        <ins
          className="adsbygoogle"
          style={adStyle}
          data-ad-client={adsenseClientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
          data-adtest={import.meta.env.DEV ? 'on' : 'off'} // Test mode in development
        />
      )}

      {/* Loading placeholder */}
      {!isInView && lazy && (
        <div
          style={{
            ...adStyle,
            backgroundColor: '#f5f5f5',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '12px',
          }}
        >
          Loading ad...
        </div>
      )}

      {/* Upgrade prompt for premium users */}
      {user?.lifetimeAccess && (
        <div
          style={{
            ...adStyle,
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '14px', color: '#28a745', fontWeight: 'bold', marginBottom: '4px' }}>
            🌟 Ad-Free Experience
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>
            You're enjoying premium ad-free browsing
          </div>
        </div>
      )}
    </div>
  );
}

export default GoogleAd;