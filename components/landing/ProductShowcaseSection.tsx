"use client"

import { useState } from "react"
import { MessageSquare, BarChart3, Table, TrendingDown } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"
import { SectionWrapper } from "./shared/SectionWrapper"
import { SectionReveal } from "./shared/SectionReveal"
import { GradientHeading } from "./shared/GradientHeading"

const revenueData = [
  { quarter: "Q1", revenue: 42000 },
  { quarter: "Q2", revenue: 58000 },
  { quarter: "Q3", revenue: 49000 },
  { quarter: "Q4", revenue: 67000 },
]

const topProducts = [
  { product: "Widget Pro", sales: 1240 },
  { product: "DataSync", sales: 980 },
  { product: "CloudKit", sales: 870 },
  { product: "Analytics+", sales: 720 },
  { product: "FlowBase", sales: 650 },
]

const churnData = [
  { month: "Jan", rate: 4.2 },
  { month: "Feb", rate: 3.8 },
  { month: "Mar", rate: 3.5 },
  { month: "Apr", rate: 3.1 },
  { month: "May", rate: 2.8 },
  { month: "Jun", rate: 2.4 },
]

const queries = [
  {
    label: "Show me revenue by quarter",
    icon: BarChart3,
    type: "chart" as const,
  },
  {
    label: "Top 5 products by sales",
    icon: Table,
    type: "table" as const,
  },
  {
    label: "Customer churn rate trend",
    icon: TrendingDown,
    type: "line" as const,
  },
  {
    label: "Active users this month",
    icon: MessageSquare,
    type: "text" as const,
  },
] as const

const tooltipStyle = {
  background: "rgba(15,20,30,0.9)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: 12,
}

function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={revenueData} barSize={36}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="quarter"
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="revenue" fill="hsl(192, 100%, 50%)" radius={[6, 6, 0, 0]} opacity={0.9} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ProductsTable() {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto] gap-x-6 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/40 border-b border-white/10">
        <span>Product</span>
        <span>Sales</span>
      </div>
      {/* Rows */}
      {topProducts.map((row, i) => (
        <div
          key={row.product}
          className={cn(
            "grid grid-cols-[1fr_auto] gap-x-6 px-4 py-3 rounded-lg text-sm transition-colors",
            "hover:bg-white/[0.04]",
            i === 0 && "bg-primary/[0.06]"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {i + 1}
            </span>
            <span className="text-white/90 font-medium">{row.product}</span>
          </div>
          <span className="text-white/70 tabular-nums font-medium">{row.sales.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function ChurnChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={churnData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="month"
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 5]}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="hsl(192, 100%, 50%)"
          strokeWidth={3}
          dot={{ fill: "hsl(192, 100%, 50%)", r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "hsl(192, 100%, 50%)", stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function TextInsight() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-primary" />
      </div>
      <div>
        <p className="text-4xl font-bold text-white tracking-tight">12,847</p>
        <p className="text-white/50 text-sm mt-1">Active users this month</p>
      </div>
      <p className="text-white/40 text-xs">
        Up <span className="text-emerald-400 font-semibold">+18.3%</span> from last month
      </p>
    </div>
  )
}

export function ProductShowcaseSection() {
  const [activeQuery, setActiveQuery] = useState(0)

  return (
    <SectionWrapper>
      <SectionReveal>
        <div className="text-center mb-12">
          <GradientHeading className="text-3xl md:text-4xl mb-4">
            From conversation to visualization
          </GradientHeading>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            See how Buisness Flow turns natural questions into beautiful data answers
          </p>
        </div>
      </SectionReveal>

      <SectionReveal delay={0.15}>
        <div className="grid lg:grid-cols-[340px_1fr] gap-8 items-stretch">
          {/* Left: Query List */}
          <div className="space-y-2">
            {queries.map((q, i) => {
              const Icon = q.icon
              const isActive = i === activeQuery
              return (
                <button
                  key={q.label}
                  onClick={() => setActiveQuery(i)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-medium transition-all duration-200 border",
                    isActive
                      ? "bg-primary/10 border-primary/30 text-white shadow-lg shadow-primary/5"
                      : "bg-transparent border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-white/30"
                    )}
                  />
                  <span>{q.label}</span>
                </button>
              )
            })}

            {/* Decorative prompt hint */}
            <div className="mt-6 pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-white/25 px-4">
                Click a query to preview the result
              </p>
            </div>
          </div>

          {/* Right: Result Visualization */}
          <div
            className={cn(
              "glass-strong rounded-2xl p-6 md:p-8 min-h-[420px] flex flex-col",
              "bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12]",
              "transition-all duration-500 ease-out"
            )}
          >
            {/* Query echo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-sm text-white/50 italic">
                &ldquo;{queries[activeQuery].label}&rdquo;
              </p>
            </div>

            {/* Chart area */}
            <div className="flex-1 min-h-0">
              {activeQuery === 0 && <RevenueChart />}
              {activeQuery === 1 && <ProductsTable />}
              {activeQuery === 2 && <ChurnChart />}
              {activeQuery === 3 && <TextInsight />}
            </div>
          </div>
        </div>
      </SectionReveal>
    </SectionWrapper>
  )
}
