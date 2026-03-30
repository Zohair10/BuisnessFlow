"use client"

import { SectionWrapper } from "@/components/landing/shared/SectionWrapper"
import { SectionReveal } from "@/components/landing/shared/SectionReveal"
import { GlowButton } from "@/components/landing/shared/GlowButton"
import { GradientHeading } from "@/components/landing/shared/GradientHeading"

export function FinalCTASection() {
  return (
    <SectionWrapper>
      <div className="relative">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative text-center flex flex-col items-center gap-6">
          <SectionReveal>
            <GradientHeading
              as="h2"
              className="text-3xl md:text-5xl mb-2"
            >
              Ready to unlock your data?
            </GradientHeading>
          </SectionReveal>
          <SectionReveal delay={0.1}>
            <p className="text-white/50 text-lg max-w-md mx-auto">
              Start asking questions in minutes. No credit card required.
            </p>
          </SectionReveal>
          <SectionReveal delay={0.2}>
            <GlowButton size="lg">Get Started Free</GlowButton>
          </SectionReveal>
          <SectionReveal delay={0.3}>
            <p className="text-sm text-white/40">
              Free forever plan available
            </p>
          </SectionReveal>
        </div>
      </div>
    </SectionWrapper>
  )
}
