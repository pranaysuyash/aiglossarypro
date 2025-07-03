import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { ValueProposition } from "@/components/landing/ValueProposition";
import { WhatYouGet } from "@/components/landing/WhatYouGet";
import { ContentPreview } from "@/components/landing/ContentPreview";
import { SocialProof } from "@/components/landing/SocialProof";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { ContactForm } from "@/components/landing/ContactForm";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Landing Header - separate from main app header */}
      <LandingHeader />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Value Proposition */}
      <ValueProposition />
      
      {/* What You Get */}
      <WhatYouGet />
      
      {/* Content Preview */}
      <ContentPreview />
      
      {/* Social Proof */}
      <SocialProof />
      
      {/* Pricing */}
      <Pricing />
      
      {/* FAQ */}
      <FAQ />
      
      {/* Contact Form */}
      <section className="py-16 bg-gray-50">
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
              utm_campaign: urlParams.get('utm_campaign') || undefined
            };

            const response = await fetch('/api/newsletter/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email,
                ...utmData
              })
            });

            const result = await response.json();
            if (!result.success) {
              throw new Error(result.message);
            }
          } catch (error) {
            console.error('Newsletter subscription error:', error);
            throw error; // Re-throw so Footer can handle the error display
          }
        }}
      />
    </div>
  );
}
