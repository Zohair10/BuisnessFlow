"use client"

import { SectionWrapper } from "./shared/SectionWrapper"
import { SectionReveal } from "./shared/SectionReveal"
import { AnimatedCounter } from "./shared/AnimatedCounter"

const logos = ["Acme Corp", "TechFlow", "DataSync", "CloudBase", "NexGen", "Quantify"]

const stats = [
  { value: 2000, suffix: "+", label: "Teams worldwide" },
  { value: 10, suffix: "M+", label: "Queries answered" },
  { value: 99, suffix: ".9%", label: "Uptime SLA" },
]

export function TrustedBySection() {
  return (
    <SectionWrapper className="py-12 md:py-16">
      <SectionReveal>
        <p className="text-center text-sm text-white/30 uppercase tracking-widest mb-10">
          Trusted by data teams at forward-thinking companies
        </p>

        {/* Logo strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 mb-16">
          {logos.map((name) => (
            <div
              key={name}
              className="text-white/20 font-semibold text-lg tracking-wide hover:text-white/40 transition-colors duration-300 cursor-default"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gradient mb-1">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-sm text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </SectionReveal>
    </SectionWrapper>
  )
}
