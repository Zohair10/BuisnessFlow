"use client"

import { Play } from "lucide-react"
import { motion } from "framer-motion"
import { SectionWrapper } from "@/components/landing/shared/SectionWrapper"
import { SectionReveal } from "@/components/landing/shared/SectionReveal"
import { GradientHeading } from "@/components/landing/shared/GradientHeading"

export function VideoSection() {
  return (
    <SectionWrapper>
      <div className="text-center mb-12">
        <SectionReveal>
          <GradientHeading className="text-3xl md:text-4xl mb-4">
            See Buisness Flow in Action
          </GradientHeading>
        </SectionReveal>
        <SectionReveal delay={0.1}>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Watch a 2-minute walkthrough of how Buisness Flow transforms data
            analysis
          </p>
        </SectionReveal>
      </div>

      <SectionReveal delay={0.2}>
        <div className="relative max-w-5xl mx-auto">
          {/* Video container */}
          <div className="aspect-video rounded-2xl border border-white/10 ring-1 ring-primary/20 overflow-hidden bg-gradient-to-b from-white/[0.03] to-white/[0.01] flex items-center justify-center">
            {/* Play button */}
            <motion.button
              className="flex items-center justify-center w-20 h-20 rounded-full bg-primary shadow-[0_0_40px_rgba(0,238,255,0.3)] transition-transform duration-300 hover:scale-110 cursor-pointer"
              aria-label="Play video walkthrough"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play className="h-8 w-8 text-black fill-black ml-1" />
            </motion.button>
          </div>
        </div>
      </SectionReveal>
    </SectionWrapper>
  )
}
