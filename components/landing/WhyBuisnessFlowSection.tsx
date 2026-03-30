"use client"

import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionWrapper } from "./shared/SectionWrapper"
import { SectionReveal } from "./shared/SectionReveal"
import { GlassCard } from "./shared/GlassCard"
import { GradientHeading } from "./shared/GradientHeading"

const withoutItems = [
  "Wait days for data team reports",
  "Learn SQL for every new question",
  "Export to Excel for basic charts",
  "Stale dashboards with outdated data",
  "Data locked in silos across teams",
]

const withItems = [
  "Get answers in seconds, not days",
  "Ask questions in plain English",
  "Auto-generated charts and tables",
  "Real-time insights, always fresh",
  "Shared workspaces for team collaboration",
]

export function WhyBuisnessFlowSection() {
  return (
    <SectionWrapper>
      <SectionReveal>
        <div className="text-center mb-12">
          <GradientHeading className="text-3xl md:text-4xl mb-4">
            Why teams choose Buisness Flow
          </GradientHeading>
          <p className="text-white/50 text-lg">Stop waiting. Start asking.</p>
        </div>
      </SectionReveal>

      <SectionReveal delay={0.15}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Without Buisness Flow */}
          <GlassCard hover={false} className="relative overflow-hidden">
            {/* Subtle red top accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white/60 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                Without Buisness Flow
              </h3>
            </div>

            <ul className="space-y-4">
              {withoutItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="w-4 h-4 text-red-400/80 mt-0.5 shrink-0" />
                  <span className="text-white/40 text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* With Buisness Flow */}
          <GlassCard hover={false} className="relative overflow-hidden">
            {/* Subtle cyan top accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                With Buisness Flow
              </h3>
            </div>

            <ul className="space-y-4">
              {withItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-white/80 text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </SectionReveal>
    </SectionWrapper>
  )
}
