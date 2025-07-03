import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Code, Users } from "lucide-react";
import { useCountryPricing } from '@/hooks/useCountryPricing';
import { useBackgroundABTest } from '@/hooks/useBackgroundABTest';
import { BACKGROUND_COMPONENTS, BackgroundTester } from '@/components/landing/backgrounds';
import { useABTestTracking } from '@/services/abTestingService';

export function HeroSection() {
  const pricing = useCountryPricing();
  const { currentVariant, trackInteraction, isClient, setVariant } = useBackgroundABTest();
  const { trackPageView, trackConversion, trackEngagement } = useABTestTracking(currentVariant);

  // Get the background component for current variant
  const BackgroundComponent = BACKGROUND_COMPONENTS[currentVariant];

  // Track page view when component mounts
  useEffect(() => {
    if (isClient) {
      trackPageView({
        page: 'landing_hero',
        pricing: pricing.localPrice,
        country: pricing.country
      });

      // Track scroll depth
      let maxScroll = 0;
      const handleScroll = () => {
        const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercentage > maxScroll) {
          maxScroll = scrollPercentage;
          
          // Track significant scroll milestones
          if (maxScroll >= 25 && maxScroll < 26) {
            trackEngagement('scroll_depth', 25);
          } else if (maxScroll >= 50 && maxScroll < 51) {
            trackEngagement('scroll_depth', 50);
          } else if (maxScroll >= 75 && maxScroll < 76) {
            trackEngagement('scroll_depth', 75);
          } else if (maxScroll >= 90) {
            trackEngagement('scroll_depth', 90);
          }
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isClient, currentVariant]);

  const handleCTAClick = () => {
    trackInteraction('cta_click');
    
    // Track conversion with A/B testing service
    trackConversion('hero_cta_click', {
      value: pricing.localPrice,
      button_text: 'Start Your 7-Day Free Trial',
      position: 'hero_main'
    });
    
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'hero_cta_click', {
        event_category: 'conversion',
        event_label: 'hero_button',
        value: pricing.localPrice,
        custom_map: {
          background_variant: currentVariant
        }
      });
    }
    
    // Redirect to trial signup instead of direct payment
    window.location.href = '/login';
  };

  const handleSecondaryClick = () => {
    trackInteraction('secondary_cta_click');
    
    // Track conversion with A/B testing service
    trackConversion('see_whats_inside_click', {
      button_text: 'See What\'s Inside',
      position: 'hero_secondary'
    });
    
    document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Render background component if available and client-side */}
      {isClient && BackgroundComponent && (
        <BackgroundComponent 
          className="absolute inset-0"
          opacity={0.4}
        />
      )}
      
      {/* Content overlay */}
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        {/* Social proof badge */}
        <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm sm:text-base font-medium bg-white/10 text-white hover:bg-white/20 mx-auto">
          <Users className="w-4 h-4 mr-2" />
          Join 1,000+ AI/ML professionals
        </Badge>

        {/* Main headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 leading-tight sm:leading-tight md:leading-tight lg:leading-tight">
          Master AI & Machine Learning
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0">
          The most comprehensive AI/ML reference with <span className="text-purple-300 font-semibold">10,000+ terms</span>, 
          code examples, and real-world applications.
        </p>
        
        {/* Value props */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 mb-10 text-sm sm:text-base text-gray-300 px-4 sm:px-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 min-h-[44px]">
            <BookOpen className="w-5 h-5 sm:w-4 sm:h-4 text-purple-300" />
            <span>10,000+ Definitions</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2 min-h-[44px]">
            <Code className="w-5 h-5 sm:w-4 sm:h-4 text-purple-300" />
            <span>Code Examples</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2 min-h-[44px]">
            <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4 text-purple-300" />
            <span>Real Applications</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 px-4 sm:px-0">
          <Button 
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-4 sm:py-4 text-base sm:text-lg font-semibold rounded-lg shadow-xl transition-all transform hover:scale-105 w-full sm:w-auto min-h-[48px] sm:min-h-[52px] touch-manipulation"
            onClick={handleCTAClick}
          >
            <span className="flex items-center justify-center gap-2">
              <span>Start Your 7-Day Free Trial</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </span>
          </Button>
          
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            No credit card required • Instant access • Then ${pricing.localPrice} one-time for lifetime access
          </p>
          
          <div className="pt-4">
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-purple-900 px-6 sm:px-8 py-3 sm:py-3 font-medium transition-all duration-200 shadow-lg w-full sm:w-auto min-h-[48px] sm:min-h-[52px] touch-manipulation"
              onClick={handleSecondaryClick}
            >
              See What's Inside
            </Button>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-8 text-gray-400 text-sm sm:text-base px-4 sm:px-0">
          <p className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <span>✅ 7-day free trial</span>
            <span className="hidden sm:inline">•</span>
            <span>✅ No credit card required</span>
            <span className="hidden sm:inline">•</span>
            <span>✅ Lifetime updates</span>
          </p>
        </div>
      </div>
      
      {/* Development background tester */}
      <BackgroundTester onVariantChange={setVariant} />
    </section>
  );
}