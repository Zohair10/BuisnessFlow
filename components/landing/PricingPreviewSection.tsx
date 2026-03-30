"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SectionWrapper } from "@/components/landing/shared/SectionWrapper"
import { SectionReveal } from "@/components/landing/shared/SectionReveal"
import { GlassCard } from "@/components/landing/shared/GlassCard"
import { GlowButton } from "@/components/landing/shared/GlowButton"
import { GradientHeading } from "@/components/landing/shared/GradientHeading"

interface PricingTier {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For individuals exploring data",
    features: [
      "1 data connection",
      "100 queries/month",
      "Basic charts & tables",
      "CSV/Excel upload",
      "Community support",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For teams that need more power",
    features: [
      "10 data connections",
      "Unlimited queries",
      "All chart types",
      "Team collaboration",
      "Export to CSV/PNG",
      "Priority support",
      "Query history & reruns",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations at scale",
    features: [
      "Unlimited connections",
      "Custom query limits",
      "SSO & SCIM",
      "Dedicated support",
      "Audit logs",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
  },
]

function PricingCard({ tier, index }: { tier: PricingTier; index: number }) {
  return (
    <SectionReveal delay={index * 0.15}>
      <GlassCard
        hover
        className={cn(
          "flex flex-col h-full relative",
          tier.highlighted && "ring-2 ring-primary/50 md:scale-105 md:z-10"
        )}
      >
        {tier.highlighted && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
              Most Popular
            </span>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-1">{tier.name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold">{tier.price}</span>
            {tier.period && (
              <span className="text-white/40 text-sm">{tier.period}</span>
            )}
          </div>
          <p className="text-base text-white/50 mt-2">{tier.description}</p>
        </div>

        <ul className="space-y-3 mb-8 flex-1">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-base">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-white/70">{feature}</span>
            </li>
          ))}
        </ul>

        {tier.highlighted ? (
          <GlowButton className="w-full">{tier.cta}</GlowButton>
        ) : (
          <Button
            variant="outline"
            className="w-full rounded-full"
          >
            {tier.cta}
          </Button>
        )}
      </GlassCard>
    </SectionReveal>
  )
}

export function PricingPreviewSection() {
  return (
    <SectionWrapper id="pricing">
      <div className="text-center mb-12">
        <SectionReveal>
          <GradientHeading className="text-3xl md:text-4xl mb-4">
            Simple, transparent pricing
          </GradientHeading>
          <p className="text-white/50 text-lg">
            Start free, scale as you grow
          </p>
        </SectionReveal>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {tiers.map((tier, index) => (
          <PricingCard key={tier.name} tier={tier} index={index} />
        ))}
      </div>
    </SectionWrapper>
  )
}
