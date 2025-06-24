import { HeroSection } from "@/components/landing/HeroSection";
import { ValueProposition } from "@/components/landing/ValueProposition";
import { WhatYouGet } from "@/components/landing/WhatYouGet";
import { ContentPreview } from "@/components/landing/ContentPreview";
import { SocialProof } from "@/components/landing/SocialProof";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
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
      
      {/* Final CTA */}
      <FinalCTA />
    </div>
  );
}
