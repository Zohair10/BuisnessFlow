"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionWrapper } from "@/components/landing/shared/SectionWrapper"
import { SectionReveal } from "@/components/landing/shared/SectionReveal"
import { GlassCard } from "@/components/landing/shared/GlassCard"
import { GradientHeading } from "@/components/landing/shared/GradientHeading"

const testimonials = [
  {
    quote:
      "Buisness Flow completely changed how our team interacts with data. We get insights in seconds that used to take our analytics team days.",
    name: "Sarah Chen",
    title: "VP of Operations, TechCorp",
    initials: "SC",
  },
  {
    quote:
      "The natural language interface is incredible. Our marketing team can now answer their own data questions without waiting on engineering.",
    name: "Marcus Johnson",
    title: "CMO, GrowthBase",
    initials: "MJ",
  },
  {
    quote:
      "We replaced three different BI tools with Buisness Flow. The ROI was immediate and the team adoption was seamless.",
    name: "Elena Rodriguez",
    title: "Head of Analytics, DataFirst",
    initials: "ER",
  },
  {
    quote:
      "The AI understands our business context perfectly. Every query returns exactly what we need in the right format.",
    name: "David Park",
    title: "Director of Strategy, CloudScale",
    initials: "DP",
  },
  {
    quote:
      "From CSV upload to actionable insights in under a minute. Buisness Flow is the tool we didn't know we needed.",
    name: "Priya Sharma",
    title: "Product Lead, NexGen",
    initials: "PS",
  },
  {
    quote:
      "Enterprise-grade security with consumer-grade simplicity. Our compliance team loves it as much as our analysts do.",
    name: "Thomas Wright",
    title: "CTO, Quantify",
    initials: "TW",
  },
]

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-4 h-4 text-yellow-400 fill-yellow-400"
        />
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <SectionWrapper>
      <div className="text-center mb-12">
        <SectionReveal>
          <GradientHeading className="text-3xl md:text-4xl mb-4">
            Loved by data teams everywhere
          </GradientHeading>
        </SectionReveal>
      </div>

      {/* Mobile: horizontal scroll. Desktop: 3-column grid. */}
      <div className="flex gap-6 overflow-x-auto md:grid md:grid-cols-3 md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
        {testimonials.map((testimonial, index) => (
          <SectionReveal key={testimonial.name} delay={index * 0.1}>
            <GlassCard className="flex flex-col justify-between min-w-[280px] md:min-w-0 h-full">
              <div>
                <StarRating />
                <p className="text-white/70 mt-4 mb-6 text-base leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-xs text-white/40">{testimonial.title}</p>
                </div>
              </div>
            </GlassCard>
          </SectionReveal>
        ))}
      </div>
    </SectionWrapper>
  )
}
