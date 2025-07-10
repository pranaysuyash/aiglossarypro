import { ArrowRight, BookOpen, Code, Users } from 'lucide-react';
import { useEffect } from 'react';
import { BACKGROUND_COMPONENTS, BackgroundTester } from '@/components/landing/backgrounds';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useBackgroundABTest } from '@/hooks/useBackgroundABTest';
import { useCountryPricing } from '@/hooks/useCountryPricing';
import { useABTestTracking } from '@/services/abTestingService';
import { useGA4 } from '@/types/analytics';

export function HeroSection() {
  const pricing = useCountryPricing();
  const { currentVariant, trackInteraction, isClient, setVariant } = useBackgroundABTest();
  const { trackPageView, trackConversion, trackEngagement } = useABTestTracking(currentVariant);
  const { trackSectionView, trackCTAClick, trackLandingPageFunnel } = useGA4();

  // Get the background component for current variant
  const BackgroundComponent = BACKGROUND_COMPONENTS[currentVariant];

  // Track page view when component mounts
  useEffect(() => {
    if (isClient) {
      trackPageView({
        page: 'landing_hero',
        pricing: pricing.localPrice,
        country: pricing.countryName,
      });

      // Track hero section view
      trackSectionView('hero', 1);

      // Track landing page funnel - page view
      trackLandingPageFunnel('page_view');

      // Track scroll depth
      let maxScroll = 0;
      const handleScroll = () => {
        const scrollPercentage =
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
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
  }, [
    isClient,
    trackSectionView,
    trackEngagement,
    pricing.countryName,
    pricing.localPrice, // Track landing page funnel - page view
    trackLandingPageFunnel,
    trackPageView,
  ]);

  const handleCTAClick = () => {
    trackInteraction('cta_click');

    // Track conversion with A/B testing service
    trackConversion('hero_cta_click', {
      button_text: 'Start for Free',
      position: 'hero_main',
    });

    // Track with GA4
    trackCTAClick('Start for Free', 'hero_main', 'hero');

    // Track funnel progression
    trackLandingPageFunnel('cta_click');

    // Track analytics (legacy)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'hero_cta_click', {
        event_category: 'conversion',
        event_label: 'hero_button',
        custom_map: {
          background_variant: currentVariant,
        },
      });
    }

    // Redirect to free signup
    window.location.href = '/login';
  };

  const handleSecondaryClick = () => {
    trackInteraction('secondary_cta_click');

    // Track conversion with A/B testing service
    trackConversion('see_whats_inside_click', {
      button_text: "See What's Inside",
      position: 'hero_secondary',
    });

    // Track with GA4
    trackCTAClick("See What's Inside", 'hero_secondary', 'hero');

    // Track hero engagement for funnel
    trackLandingPageFunnel('hero_engagement');

    document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Render background component if available and client-side */}
      {isClient && BackgroundComponent && (
        <BackgroundComponent className="absolute inset-0" opacity={0.4} />
      )}

      {/* Content overlay */}
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        {/* Social proof badge */}
        <Badge
          variant="secondary"
          className="mb-6 px-4 py-2 text-sm sm:text-base font-medium bg-white/10 text-white hover:bg-white/20 mx-auto"
        >
          <Users className="w-4 h-4 mr-2" />
          Join 1,000+ AI/ML professionals
        </Badge>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6 leading-tight sm:leading-tight md:leading-tight lg:leading-tight drop-shadow-lg">
          Master AI & Machine Learning
        </h1>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl md:text-3xl text-gray-200 mb-8 max-w-4xl mx-auto leading-relaxed px-4 sm:px-0 drop-shadow">
          The most comprehensive AI/ML reference with{' '}
          <span className="text-purple-300 font-semibold">10,000+ terms</span>, code examples, and
          real-world applications.
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
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold rounded-xl shadow-2xl transition-all transform hover:scale-105 hover:shadow-purple-500/25 w-full sm:w-auto min-h-[56px] sm:min-h-[60px] touch-manipulation focus:ring-4 focus:ring-purple-500/50 focus:outline-none"
            onClick={handleCTAClick}
            aria-label="Start your free AI/ML learning journey"
          >
            <span className="flex items-center justify-center gap-2">
              <span>Start for Free</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            </span>
          </Button>

          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            No credit card required • Instant access
          </p>

          <div className="pt-4 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white/80 bg-white/10 text-white hover:bg-white hover:text-purple-900 px-6 sm:px-8 py-3 sm:py-4 font-semibold transition-all duration-300 shadow-lg backdrop-blur-sm w-full sm:w-auto min-h-[48px] sm:min-h-[52px] touch-manipulation focus:ring-4 focus:ring-white/50 focus:outline-none"
              onClick={handleSecondaryClick}
            >
              See What's Inside
            </Button>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-8 text-gray-300 text-sm sm:text-base px-4 sm:px-0">
          <p className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1">
              <span className="text-green-400">✅</span> 50 terms daily free
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <span className="text-green-400">✅</span> No credit card required
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <span className="text-green-400">✅</span> Premium access available
            </span>
          </p>
        </div>
      </div>

      {/* Development background tester */}
      <BackgroundTester onVariantChange={setVariant} />
    </section>
  );
}
