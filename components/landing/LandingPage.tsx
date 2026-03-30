"use client"

import { Navbar } from "./Navbar"
import { HeroSection } from "./HeroSection"
import { TrustedBySection } from "./TrustedBySection"
import { HowItWorksSection } from "./HowItWorksSection"
import { CoreFeaturesSection } from "./CoreFeaturesSection"
import { VideoSection } from "./VideoSection"
import { ProductShowcaseSection } from "./ProductShowcaseSection"
import { WhyBuisnessFlowSection } from "./WhyBuisnessFlowSection"
import { TestimonialsSection } from "./TestimonialsSection"
import { PricingPreviewSection } from "./PricingPreviewSection"
import { FAQSection } from "./FAQSection"
import { FinalCTASection } from "./FinalCTASection"
import { Footer } from "./Footer"

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <TrustedBySection />
      <HowItWorksSection />
      <CoreFeaturesSection />
      <VideoSection />
      <ProductShowcaseSection />
      <WhyBuisnessFlowSection />
      <TestimonialsSection />
      <PricingPreviewSection />
      <FAQSection />
      <Footer />
    </main>
  )
}
