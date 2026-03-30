"use client"

import { Database, MessageSquare, BarChart3 } from "lucide-react"
import { SectionWrapper } from "@/components/landing/shared/SectionWrapper"
import { SectionReveal } from "@/components/landing/shared/SectionReveal"
import { GlassCard } from "@/components/landing/shared/GlassCard"
import { GradientHeading } from "@/components/landing/shared/GradientHeading"
import { cn } from "@/lib/utils"

const steps = [
  {
    number: 1,
    icon: Database,
    title: "Connect Your Data",
    description:
      "Link your PostgreSQL, MySQL, or upload CSV/Excel files in seconds",
  },
  {
    number: 2,
    icon: MessageSquare,
    title: "Ask in Plain English",
    description:
      "Type your question naturally. No SQL, no complex queries needed",
  },
  {
    number: 3,
    icon: BarChart3,
    title: "Get Instant Insights",
    description:
      "Receive beautiful charts, tables, and AI-generated summaries instantly",
  },
] as const

export function HowItWorksSection() {
  return (
    <SectionWrapper id="how-it-works">
      <div className="text-center mb-12">
        <SectionReveal>
          <GradientHeading className="text-3xl md:text-4xl mb-4">
            From question to insight in seconds
          </GradientHeading>
        </SectionReveal>
        <SectionReveal delay={0.1}>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Three simple steps to unlock your data
          </p>
        </SectionReveal>
      </div>

      <div className="relative">
        {/* Connecting dotted line — visible on md+ */}
        <div
          className="hidden md:block absolute top-1/2 left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] -translate-y-1/2 border-t-2 border-dashed border-primary/25 pointer-events-none"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <SectionReveal key={step.number} delay={0.15 + i * 0.1}>
                <GlassCard className="relative flex flex-col items-center text-center p-8">
                  {/* Step number badge */}
                  <span
                    className={cn(
                      "absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center",
                      "rounded-full text-sm font-bold",
                      "bg-primary/20 text-primary border border-primary/30"
                    )}
                  >
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-5">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>

                  {/* Copy */}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-white/50 text-base leading-relaxed">
                    {step.description}
                  </p>
                </GlassCard>
              </SectionReveal>
            )
          })}
        </div>
      </div>
    </SectionWrapper>
  )
}
