'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SQLPreviewProps {
  query?: string
  pipeline?: Record<string, unknown>[]
  isMongo?: boolean
}

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN',
  'LIKE', 'IS', 'NULL', 'AS', 'ON', 'JOIN', 'LEFT', 'RIGHT', 'INNER',
  'OUTER', 'CROSS', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'HAVING',
  'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'INSERT', 'UPDATE',
  'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW',
  'WITH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'COUNT', 'SUM',
  'AVG', 'MIN', 'MAX', 'TRUE', 'FALSE', 'CAST', 'COALESCE',
  'OVER', 'PARTITION', 'ROW_NUMBER', 'RANK', 'DENSE_RANK',
])

function highlightSQL(sql: string): React.ReactNode[] {
  const lines = sql.split('\n')

  return lines.map((line, lineIdx) => {
    const tokens = line.split(/(\s+|[(),;])/)
    const highlighted = tokens.map((token, tokenIdx) => {
      const upperToken = token.toUpperCase().trim()
      if (SQL_KEYWORDS.has(upperToken)) {
        return (
          <span key={tokenIdx} className="text-primary font-semibold">
            {token}
          </span>
        )
      }

      if (/^'.*'$/.test(token.trim())) {
        return (
          <span key={tokenIdx} className="text-chart-3">
            {token}
          </span>
        )
      }

      if (/^--/.test(token.trim())) {
        return (
          <span key={tokenIdx} className="text-muted-foreground/70 italic">
            {token}
          </span>
        )
      }

      if (/^\d+(\.\d+)?$/.test(token.trim())) {
        return (
          <span key={tokenIdx} className="text-[hsl(38,92%,55%)]">
            {token}
          </span>
        )
      }

      return <span key={tokenIdx}>{token}</span>
    })

    return (
      <div key={lineIdx}>
        {highlighted}
        {lineIdx < lines.length - 1 && '\n'}
      </div>
    )
  })
}

function highlightPipeline(pipeline: Record<string, unknown>[]): React.ReactNode {
  const json = JSON.stringify(pipeline, null, 2)

  const highlighted = json.split('\n').map((line, idx) => {
    const parts = line.replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      '<KEY>$1</KEY>'
    ).replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      '<STR>: $1</STR>'
    ).replace(
      /:\s*(\d+(?:\.\d+)?)/g,
      '<NUM>: $1</NUM>'
    ).replace(
      /:\s*(true|false|null)/g,
      '<BOOL>: $1</BOOL>'
    ).replace(
      /"(\$\w+)"/g,
      '<OP>"$1"</OP>'
    )

    const segments = parts.split(/(<\/?(?:KEY|STR|NUM|BOOL|OP)>)/)
    const rendered = segments.map((seg, segIdx) => {
      if (seg === '<KEY>' || seg === '</KEY>') return null
      if (seg === '<STR>' || seg === '</STR>') return null
      if (seg === '<NUM>' || seg === '</NUM>') return null
      if (seg === '<BOOL>' || seg === '</BOOL>') return null
      if (seg === '<OP>' || seg === '</OP>') return null

      if (segIdx > 0 && segments[segIdx - 1] === '<KEY>') {
        return <span key={segIdx} className="text-[hsl(38,92%,55%)]">{seg}</span>
      }
      if (segIdx > 0 && segments[segIdx - 1] === '<STR>') {
        return <span key={segIdx} className="text-chart-3">{seg}</span>
      }
      if (segIdx > 0 && segments[segIdx - 1] === '<NUM>') {
        return <span key={segIdx} className="text-chart-4">{seg}</span>
      }
      if (segIdx > 0 && segments[segIdx - 1] === '<BOOL>') {
        return <span key={segIdx} className="text-destructive">{seg}</span>
      }
      if (segIdx > 0 && segments[segIdx - 1] === '<OP>') {
        return <span key={segIdx} className="text-primary font-semibold">{seg}</span>
      }
      return <span key={segIdx}>{seg}</span>
    }).filter(Boolean)

    return (
      <div key={idx}>
        {rendered}
        {idx < json.split('\n').length - 1 && '\n'}
      </div>
    )
  })

  return <>{highlighted}</>
}

export function SQLPreview({ query, pipeline, isMongo }: SQLPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const content = isMongo
    ? pipeline
      ? JSON.stringify(pipeline, null, 2)
      : ''
    : query || ''

  if (!content) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm',
          'text-muted-foreground hover:text-foreground',
          'hover:bg-secondary transition-colors'
        )}
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
        <span className="font-medium">
          {isMongo ? 'Generated Pipeline' : 'Generated Query'}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-border">
          <div className="relative">
            <pre className="p-3 text-xs leading-relaxed overflow-x-auto scrollbar-thin font-mono text-foreground">
              {isMongo
                ? highlightPipeline(pipeline || [])
                : highlightSQL(query || '')}
            </pre>
            <button
              onClick={handleCopy}
              className={cn(
                'absolute top-2 right-2 p-1.5 rounded-md',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-border transition-colors'
              )}
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-chart-3" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
