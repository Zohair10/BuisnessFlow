'use client'

import { useState, useMemo } from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableRendererProps {
  data: Record<string, unknown>[]
  maxRowsPerPage?: number
}

type SortDirection = 'asc' | 'desc' | null

function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return

  const columns = Object.keys(data[0])
  const csvRows: string[] = []

  csvRows.push(columns.map(escapeCSV).join(','))

  for (const row of data) {
    const values = columns.map((col) => escapeCSV(String(row[col] ?? '')))
    csvRows.push(values.join(','))
  }

  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function TableRenderer({ data, maxRowsPerPage = 50 }: TableRendererProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const columns = useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0])
  }, [data])

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal)
      const bStr = String(bVal)
      const cmp = aStr.localeCompare(bStr)
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [data, sortColumn, sortDirection])

  const totalPages = Math.ceil(sortedData.length / maxRowsPerPage)
  const pageData = sortedData.slice(
    currentPage * maxRowsPerPage,
    (currentPage + 1) * maxRowsPerPage
  )

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(0)
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 opacity-40" />
    if (sortDirection === 'asc') return <ArrowUp className="w-3 h-3 text-primary" />
    if (sortDirection === 'desc') return <ArrowDown className="w-3 h-3 text-primary" />
    return <ArrowUpDown className="w-3 h-3 opacity-40" />
  }

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toLocaleString()
      return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
    }
    if (value instanceof Date) return value.toLocaleDateString()
    return String(value)
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data to display
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">
          {data.length} row{data.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => exportToCSV(data, 'query-results.csv')}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs',
            'text-muted-foreground hover:text-foreground',
            'border border-border hover:border-primary',
            'transition-all'
          )}
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((column) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className={cn(
                      'px-4 py-2.5 text-left text-xs font-semibold',
                      'text-muted-foreground uppercase tracking-wider',
                      'hover:text-foreground cursor-pointer select-none',
                      'transition-colors whitespace-nowrap'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {column.replace(/_/g, ' ')}
                      {getSortIcon(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={cn(
                    'border-b border-border last:border-b-0',
                    'hover:bg-secondary transition-colors',
                    rowIdx % 2 === 1 && 'bg-background'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="px-4 py-2.5 text-foreground whitespace-nowrap max-w-[300px] truncate"
                      title={formatCellValue(row[column])}
                    >
                      {formatCellValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className={cn(
                'p-1.5 rounded-md',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-secondary transition-all',
                'disabled:opacity-30 disabled:cursor-not-allowed'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
              }
              disabled={currentPage >= totalPages - 1}
              className={cn(
                'p-1.5 rounded-md',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-secondary transition-all',
                'disabled:opacity-30 disabled:cursor-not-allowed'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
