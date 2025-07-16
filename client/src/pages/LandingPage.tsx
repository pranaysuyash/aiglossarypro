import {
  ExitIntentPopup,
  FloatingPricingWidget,
  MediaLogos,
  TrustBadges,
} from '@/components/ab-tests';
import Footer from '@/components/Footer';
import InteractiveDemo from '@/components/interactive/InteractiveDemo';
import { ContactForm } from '@/components/landing/ContactForm';
import { ContentPreview } from '@/components/landing/ContentPreview';
import { FAQ } from '@/components/landing/FAQ';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { FounderStory } from '@/components/landing/FounderStory';
import { HeroSection } from '@/components/landing/HeroSection';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LearningPathsSection } from '@/components/landing/LearningPathsSection';
import { Pricing } from '@/components/landing/Pricing';
import { SocialProof } from '@/components/landing/SocialProof';
import { ValueProposition } from '@/components/landing/ValueProposition';
import { WhatYouGet } from '@/components/landing/WhatYouGet';
import { SuccessStoriesSection } from '@/components/SuccessStories';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* A/B Test Components */}
      <ExitIntentPopup />
      <FloatingPricingWidget />

      {/* Landing Header - separate from main app header */}
      <LandingHeader />

      {/* Hero Section */}
      <HeroSection />

      {/* Media Logos - Above fold variant */}
      {/* <MediaLogos placement="above_fold" /> */}

      {/* Trust Badges - Inline variant */}
      <TrustBadges placement="inline" variant="minimal" />

      {/* Value Proposition */}
      <ValueProposition />

      {/* Founder Story */}
      <FounderStory />

      {/* What You Get */}
      <WhatYouGet />

      {/* Content Preview */}
      <ContentPreview />

      {/* Learning Paths Section */}
      <LearningPathsSection />

      {/* Interactive Demo */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <InteractiveDemo />
        </div>
      </section>

      {/* Social Proof */}
      <SocialProof />

      {/* Success Stories */}
      <SuccessStoriesSection />

      {/* Media Logos - Below fold variant */}
      {/* <MediaLogos placement="below_fold" /> */}

      {/* Pricing */}
      <Pricing />

      {/* Trust Badges - Near CTA variant */}
      <TrustBadges placement="inline" variant="detailed" />

      {/* FAQ */}
      <FAQ />

      {/* Contact Form */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm />
        </div>
      </section>

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer with email subscription */}
      <Footer
        onSubscribe={async (email: string) => {
          try {
            // Extract UTM parameters from URL
            const urlParams = new URLSearchParams(window.location.search);
            const utmData = {
              utm_source: urlParams.get('utm_source') || undefined,
              utm_medium: urlParams.get('utm_medium') || undefined,
              utm_campaign: urlParams.get('utm_campaign') || undefined,
            };

            const response = await fetch('/api/newsletter/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email,
                ...utmData,
              }),
            });

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.message);
            }
          } catch (error: any) {
            console.error('Newsletter subscription error:', error);
            throw error; // Re-throw so Footer can handle the error display
          }
        }}
      />
    </div>
  );
}
