"use client"

import { GlowButton } from "./shared/GlowButton"
import { Button } from "@/components/ui/button"
import { Sparkles, Play, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState, useEffect } from "react"

const rotatingWords = ["Anything", "Revenue", "Trends", "Metrics", "Growth", "Insights", "Reports"]

function TypewriterWord() {
  const [wordIndex, setWordIndex] = useState(0)
  const [displayed, setDisplayed] = useState("")
  const [phase, setPhase] = useState<"typing" | "holding" | "erasing" | "paused">("typing")

  useEffect(() => {
    const word = rotatingWords[wordIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (phase === "typing") {
      if (displayed.length < word.length) {
        timeout = setTimeout(() => {
          setDisplayed(word.slice(0, displayed.length + 1))
        }, 100)
      } else {
        timeout = setTimeout(() => setPhase("holding"), 2200)
      }
    } else if (phase === "holding") {
      timeout = setTimeout(() => setPhase("erasing"), 0)
    } else if (phase === "erasing") {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(displayed.slice(0, -1))
        }, 65)
      } else {
        timeout = setTimeout(() => setPhase("paused"), 0)
      }
    } else if (phase === "paused") {
      timeout = setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length)
        setPhase("typing")
      }, 600)
    }

    return () => clearTimeout(timeout)
  }, [displayed, phase, wordIndex])

  // Measure the longest word to prevent layout shift
  const maxWidth = Math.max(...rotatingWords.map((w) => w.length))

  return (
    <span
      className="text-gradient inline-block"
      style={{ minWidth: `${maxWidth}ch` }}
      aria-label={rotatingWords[wordIndex]}
    >
      {displayed}
      <span className="animate-pulse text-primary">|</span>
    </span>
  )
}

const chartData = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5800 },
  { month: "Mar", revenue: 4900 },
  { month: "Apr", revenue: 7200 },
  { month: "May", revenue: 6100 },
  { month: "Jun", revenue: 8400 },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-[85px] overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-mesh-gradient pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Badge */}

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.2] tracking-tight mb-6"
            >
              <span className="block">
                <span className="text-gradient-white">Ask Your Data </span>
                <TypewriterWord />
              </span>
              <span className="block mt-2 text-gradient-white">Get Answer Instantly</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={itemVariants} className="text-lg text-white/60 max-w-lg mx-auto lg:mx-0 mb-8">
              Connect your database, ask questions in plain English, and get beautiful charts, tables, and insights — in seconds. No SQL required.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-8">
              <GlowButton asChild>
                <a href="/signup">
                  Start Free <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </GlowButton>
              <Button variant="outline" size="lg" className="rounded-full px-8 border-white/20 text-white/80 hover:bg-white/5 hover:text-white cursor-pointer">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust micro-proof */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {["S", "M", "A", "R"].map((letter, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/40">
                Trusted by <span className="text-white/70 font-semibold">2,000+</span> data teams
              </p>
            </motion.div>
          </motion.div>

          {/* Right: Chat visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block"
          >
            <div className="relative animate-float">
              {/* Glow behind card */}
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />

              {/* Chat card */}
              <div className="relative glass-strong rounded-2xl p-6 space-y-4">
                {/* User message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                    U
                  </div>
                  <div className="glass rounded-xl rounded-tl-none px-4 py-3 text-sm text-white/80">
                    Show me revenue by month for the last 6 months
                  </div>
                </div>

                {/* AI response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="glass rounded-xl rounded-tl-none px-4 py-3 flex-1">
                    <p className="text-sm text-white/70 mb-3">Here&apos;s your revenue trend:</p>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={24}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(15,20,30,0.9)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "8px",
                              color: "#fff",
                              fontSize: 12,
                            }}
                          />
                          <Bar dataKey="revenue" fill="hsl(192, 100%, 50%)" radius={[4, 4, 0, 0]} opacity={0.9} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
