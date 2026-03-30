'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InsightCardProps {
  summary: string
  data?: Record<string, unknown>[]
}

export function InsightCard({ summary, data }: InsightCardProps) {
  const [copied, setCopied] = useState(false)

  const primaryValue = extractPrimaryValue(data)

  const handleCopy = async () => {
    const text = primaryValue
      ? `${primaryValue.label}: ${primaryValue.value}\n\n${summary}`
      : summary
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="animate-fade-in">
      <div
        className={cn(
          'relative rounded-xl border border-border overflow-hidden',
          'bg-card'
        )}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-chart-3 to-chart-4" />

        <div className="p-5 pl-6">
          {primaryValue && (
            <div className="mb-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                {primaryValue.label}
              </p>
              <p className="text-3xl font-bold text-foreground">
                {primaryValue.value}
              </p>
            </div>
          )}

          <p className="text-[15px] leading-relaxed text-foreground">
            {summary}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-secondary transition-all'
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-chart-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function extractPrimaryValue(
  data?: Record<string, unknown>[]
): { label: string; value: string } | null {
  if (!data || data.length === 0) return null

  const row = data[0]
  const entries = Object.entries(row)

  if (entries.length === 0) return null

  if (entries.length === 1) {
    const [key, val] = entries[0]
    return {
      label: formatLabel(key),
      value: formatDisplayValue(val),
    }
  }

  const numericEntry = entries.find(([, v]) => typeof v === 'number')
  if (numericEntry && data.length === 1) {
    const [key, val] = numericEntry
    return {
      label: formatLabel(key),
      value: formatDisplayValue(val),
    }
  }

  return null
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString()
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return String(value)
}
