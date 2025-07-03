import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Code, Users } from "lucide-react";
import { useCountryPricing } from '@/hooks/useCountryPricing';

export function HeroSection() {
  const pricing = useCountryPricing();

  return (
    <section className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        {/* Social proof badge */}
        <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-white/10 text-white hover:bg-white/20">
          <Users className="w-4 h-4 mr-2" />
          Join 1,000+ AI/ML professionals
        </Badge>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          Master AI & Machine Learning
        </h1>
        
        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
          The most comprehensive AI/ML reference with <span className="text-purple-300 font-semibold">10,000+ terms</span>, 
          code examples, and real-world applications.
        </p>
        
        {/* Value props */}
        <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-300" />
            <span>10,000+ Definitions</span>
          </div>
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-purple-300" />
            <span>Code Examples</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-purple-300" />
            <span>Real Applications</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <Button 
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-xl transition-all transform hover:scale-105"
            onClick={() => {
              // Track analytics
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'hero_cta_click', {
                  event_category: 'conversion',
                  event_label: 'hero_button',
                  value: pricing.localPrice,
                });
              }
              
              // Redirect to trial signup instead of direct payment
              window.location.href = '/login';
            }}
          >
            Start Your 7-Day Free Trial
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          
          <p className="text-gray-400 text-sm">
            No credit card required • Instant access • Then ${pricing.localPrice} one-time for lifetime access
          </p>
          
          <div className="pt-4">
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-purple-900 px-8 py-3 font-medium transition-all duration-200 shadow-lg"
              onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See What's Inside
            </Button>
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-8 text-gray-400 text-sm">
          <p>✅ 7-day free trial • ✅ No credit card required • ✅ Lifetime updates</p>
        </div>
      </div>
    </section>
  );
}