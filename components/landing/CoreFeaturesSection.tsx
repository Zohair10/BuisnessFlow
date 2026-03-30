"use client"

import {
  MessageSquareText,
  BarChart3,
  Database,
  Users,
  Shield,
} from "lucide-react"
import { SectionWrapper } from "@/components/landing/shared/SectionWrapper"
import { SectionReveal } from "@/components/landing/shared/SectionReveal"
import { GlassCard } from "@/components/landing/shared/GlassCard"
import { GradientHeading } from "@/components/landing/shared/GradientHeading"

const features = [
  {
    icon: MessageSquareText,
    title: "Natural Language Queries",
    description:
      "Ask questions about your data in plain English. Our AI understands context and intent.",
  },
  {
    icon: BarChart3,
    title: "AI-Powered Visualizations",
    description:
      "Automatically generates the perfect chart type — bar, line, or pie — for every answer.",
  },
  {
    icon: Database,
    title: "Multi-Database Support",
    description:
      "Connect PostgreSQL, MySQL, CSV, and Excel. One tool for all your data sources.",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    description:
      "Collaborate with your team in shared workspaces with role-based access control.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "AES-256 encryption, read-only access, and audit logging. Your data stays safe.",
  },
] as const

export function CoreFeaturesSection() {
  return (
    <SectionWrapper id="features">
      <div className="text-center mb-16">
        <SectionReveal>
          <GradientHeading className="text-3xl md:text-4xl mb-4">
            Everything you need to unlock your data
          </GradientHeading>
        </SectionReveal>
        <SectionReveal delay={0.1}>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Powerful features designed for teams that want instant answers
          </p>
        </SectionReveal>
      </div>

      {/* Row 1: 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {features.slice(0, 3).map((feature, i) => {
          const Icon = feature.icon
          return (
            <SectionReveal key={feature.title} delay={0.15 + i * 0.08}>
              <GlassCard className="p-8 h-full">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-5">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/50 text-base leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </SectionReveal>
          )
        })}
      </div>

      {/* Row 2: 2 cards centered */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[calc(66.666%+12px)] mx-auto">
        {features.slice(3).map((feature, i) => {
          const Icon = feature.icon
          return (
            <SectionReveal key={feature.title} delay={0.15 + (i + 3) * 0.08}>
              <GlassCard className="p-8 h-full">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-5">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/50 text-base leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </SectionReveal>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
