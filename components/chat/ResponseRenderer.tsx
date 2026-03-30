'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  BarChart3,
  Table2,
  FileText,
  Copy,
  Check,
  Download,
} from 'lucide-react'
import { TableRenderer } from './TableRenderer'
import { InsightCard } from './InsightCard'
import { SQLPreview } from './SQLPreview'
import { cn } from '@/lib/utils'

const ChartRenderer = dynamic(
  () => import('./ChartRenderer').then((mod) => mod.ChartRenderer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] rounded-lg border border-border bg-card flex items-center justify-center">
        <div className="animate-pulse-soft text-sm text-muted-foreground">Loading chart...</div>
      </div>
    ),
  }
)

type ResponseKind = 'text' | 'table' | 'chart'
type ChartSubtype = 'bar' | 'line' | 'pie'

interface ResponseRendererProps {
  summary: string
  responseKind: ResponseKind
  chartSubtype?: ChartSubtype
  data: Record<string, unknown>[]
  chartConfig?: {
    xKey: string
    yKey: string
    title: string
    color?: string
  }
  compiledQuery?: string
  compiledPipeline?: Record<string, unknown>[]
  isMongo?: boolean
}

const FORMAT_TABS: Array<{
  id: ResponseKind
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'chart', label: 'Chart', icon: BarChart3 },
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'text', label: 'Text', icon: FileText },
]

export function ResponseRenderer({
  summary,
  responseKind,
  chartSubtype,
  data,
  chartConfig,
  compiledQuery,
  compiledPipeline,
  isMongo,
}: ResponseRendererProps) {
  const [activeTab, setActiveTab] = useState<ResponseKind>(responseKind)
  const [copied, setCopied] = useState(false)

  const hasChartData =
    data.length > 0 &&
    chartConfig &&
    Object.keys(data[0] || {}).length >= 2

  const handleCopy = async () => {
    let text = summary
    if (data.length > 0) {
      const columns = Object.keys(data[0])
      const header = columns.join('\t')
      const rows = data
        .slice(0, 100)
        .map((row) => columns.map((c) => String(row[c] ?? '')).join('\t'))
        .join('\n')
      text = `${summary}\n\n${header}\n${rows}`
    }
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportCSV = () => {
    if (!data || data.length === 0) return

    const columns = Object.keys(data[0])
    const csvRows = [columns.join(',')]

    for (const row of data) {
      const values = columns.map((col) => {
        const val = String(row[col] ?? '')
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      })
      csvRows.push(values.join(','))
    }

    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'query-results.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <p className="text-[15px] leading-relaxed text-foreground">
        {summary}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-background border border-border">
          {FORMAT_TABS.map((tab) => {
            const Icon = tab.icon
            const disabled =
              tab.id === 'chart' && !hasChartData

            return (
              <button
                key={tab.id}
                onClick={() => !disabled && setActiveTab(tab.id)}
                disabled={disabled}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
                  'transition-all',
                  activeTab === tab.id
                    ? 'bg-border text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  disabled && 'opacity-30 cursor-not-allowed'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-secondary transition-all'
            )}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-3 h-3 text-chart-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
          {data.length > 0 && (
            <button
              onClick={handleExportCSV}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-secondary transition-all'
              )}
              title="Download CSV"
            >
              <Download className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div>
        {activeTab === 'chart' && hasChartData && (
          <ChartRenderer
            subtype={chartSubtype || 'bar'}
            data={data}
            chartConfig={chartConfig!}
          />
        )}

        {activeTab === 'table' && <TableRenderer data={data} />}

        {activeTab === 'text' && (
          <InsightCard summary={summary} data={data} />
        )}
      </div>

      {(compiledQuery || compiledPipeline) && (
        <SQLPreview
          query={compiledQuery}
          pipeline={compiledPipeline}
          isMongo={isMongo}
        />
      )}
    </div>
  )
}
