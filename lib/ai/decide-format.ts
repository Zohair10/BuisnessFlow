import Anthropic from '@anthropic-ai/sdk'
import { FORMAT_DECISION_RULES } from './prompts'
import type { FormattedResponse } from '@/types/query'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function hasDateColumn(columns: string[]): boolean {
  return columns.some((col) =>
    FORMAT_DECISION_RULES.DATE_COLUMN_PATTERNS.some((p) => p.test(col))
  )
}

function isTimeSeriesQuestion(question: string): boolean {
  return FORMAT_DECISION_RULES.TIMESERIES_PATTERNS.some((p) =>
    p.test(question)
  )
}

function isRankingQuestion(question: string): boolean {
  return FORMAT_DECISION_RULES.RANKING_PATTERNS.some((p) => p.test(question))
}

function isPercentageQuestion(question: string): boolean {
  return FORMAT_DECISION_RULES.PERCENTAGE_PATTERNS.some((p) =>
    p.test(question)
  )
}

function getColumnValues(
  data: Record<string, unknown>[],
  column: string
): unknown[] {
  return data.map((row) => row[column]).filter((v) => v !== null && v !== undefined)
}

function isDateLike(value: unknown): boolean {
  if (value instanceof Date) return true
  if (typeof value === 'string') {
    const isoPattern = /^\d{4}-\d{2}-\d{2}/
    const usPattern = /^\d{1,2}\/\d{1,2}\/\d{2,4}/
    return isoPattern.test(value) || usPattern.test(value)
  }
  return false
}

export function decideFormatHeuristic(
  data: Record<string, unknown>[],
  question: string
): Omit<FormattedResponse, 'summary'> {
  if (!data || data.length === 0) {
    return {
      kind: 'text',
      data: [],
    }
  }

  const columns = Object.keys(data[0])

  if (data.length === 1 && columns.length <= 2) {
    const values = columns.map((c) => data[0][c])
    const numericValues = values.filter(
      (v) => typeof v === 'number'
    )

    if (numericValues.length === 1 && columns.length <= 2) {
      return {
        kind: 'text',
        data,
      }
    }
  }

  const dateColumns = columns.filter((col) => {
    const vals = getColumnValues(data, col)
    return vals.length > 0 && vals.every(isDateLike)
  })

  if (
    dateColumns.length > 0 &&
    data.length >= FORMAT_DECISION_RULES.TIMESERIES_MIN_POINTS
  ) {
    const dateCol = dateColumns[0]
    const numericColumns = columns.filter((col) => {
      if (col === dateCol) return false
      const vals = getColumnValues(data, col)
      return vals.length > 0 && vals.some((v) => typeof v === 'number')
    })

    if (numericColumns.length > 0) {
      return {
        kind: 'chart',
        chartSubtype: 'line',
        data,
        chartConfig: {
          xKey: dateCol,
          yKey: numericColumns[0],
          title: extractChartTitle(question),
        },
      }
    }
  }

  if (isTimeSeriesQuestion(question) && dateColumns.length > 0) {
    const dateCol = dateColumns[0]
    const numericColumns = columns.filter((col) => {
      if (col === dateCol) return false
      const vals = getColumnValues(data, col)
      return vals.length > 0 && vals.some((v) => typeof v === 'number')
    })

    return {
      kind: 'chart',
      chartSubtype: 'line',
      data,
      chartConfig: {
        xKey: dateCol,
        yKey: numericColumns[0] || columns[1] || columns[0],
        title: extractChartTitle(question),
      },
    }
  }

  if (isRankingQuestion(question)) {
    const categoryColumns = columns.filter((col) => {
      const vals = getColumnValues(data, col)
      return vals.length > 0 && vals.every((v) => typeof v === 'string')
    })
    const numericColumns = columns.filter((col) => {
      const vals = getColumnValues(data, col)
      return vals.length > 0 && vals.some((v) => typeof v === 'number')
    })

    if (categoryColumns.length > 0 && numericColumns.length > 0) {
      return {
        kind: 'chart',
        chartSubtype: 'bar',
        data,
        chartConfig: {
          xKey: categoryColumns[0],
          yKey: numericColumns[0],
          title: extractChartTitle(question),
        },
      }
    }
  }

  if (isPercentageQuestion(question) || isBreakdownQuestion(question)) {
    const categoryColumns = columns.filter((col) => {
      const vals = getColumnValues(data, col)
      return vals.length > 0 && vals.every((v) => typeof v === 'string')
    })
    const numericColumns = columns.filter((col) => {
      const vals = getColumnValues(data, col)
      return vals.length > 0 && vals.some((v) => typeof v === 'number')
    })

    if (
      categoryColumns.length > 0 &&
      numericColumns.length > 0 &&
      data.length <= FORMAT_DECISION_RULES.PIE_MAX_BUCKETS
    ) {
      return {
        kind: 'chart',
        chartSubtype: 'pie',
        data,
        chartConfig: {
          xKey: categoryColumns[0],
          yKey: numericColumns[0],
          title: extractChartTitle(question),
        },
      }
    }
  }

  if (
    columns.length >= FORMAT_DECISION_RULES.TABLE_MIN_COLUMNS ||
    data.length >= FORMAT_DECISION_RULES.TABLE_MIN_ROWS
  ) {
    return {
      kind: 'table',
      data,
    }
  }

  const categoryColumns = columns.filter((col) => {
    const vals = getColumnValues(data, col)
    return vals.length > 0 && vals.every((v) => typeof v === 'string')
  })
  const numericColumns = columns.filter((col) => {
    const vals = getColumnValues(data, col)
    return vals.length > 0 && vals.some((v) => typeof v === 'number')
  })

  if (categoryColumns.length > 0 && numericColumns.length > 0 && data.length > 1) {
    return {
      kind: 'chart',
      chartSubtype: 'bar',
      data,
      chartConfig: {
        xKey: categoryColumns[0],
        yKey: numericColumns[0],
        title: extractChartTitle(question),
      },
    }
  }

  return {
    kind: 'table',
    data,
  }
}

function isBreakdownQuestion(question: string): boolean {
  return /breakdown|split|segment|compare|by category|by type|by status/i.test(
    question
  )
}

function extractChartTitle(question: string): string {
  let title = question.trim()
  title = title.replace(/[?!.]+$/, '')
  if (title.length > 60) {
    title = title.substring(0, 57) + '...'
  }
  return title
}

export async function decideFormatWithAI(
  data: Record<string, unknown>[],
  question: string
): Promise<Omit<FormattedResponse, 'summary'>> {
  if (!data || data.length === 0) {
    return { kind: 'text', data: [] }
  }

  const columns = Object.keys(data[0])
  const sampleRows = data.slice(0, 5)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Given this data question: "${question}"

Columns: ${columns.join(', ')}
Sample rows: ${JSON.stringify(sampleRows)}
Total rows: ${data.length}

Decide the best visualization format. Reply with ONLY a JSON object:
{"kind": "text" | "table" | "chart", "chartSubtype": "bar" | "line" | "pie", "xKey": "column_name", "yKey": "column_name", "title": "chart title"}

Rules:
- Single scalar value -> text
- Time-series data -> line chart
- Ranked/compared categories -> bar chart
- Part-of-whole with <=8 segments -> pie chart
- Wide/detailed data -> table
- Only include chartSubtype, xKey, yKey, title when kind is "chart"`,
        },
      ],
    })

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    )
    if (!textBlock) throw new Error('No text in response')

    let cleaned = textBlock.text.trim()
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
    cleaned = cleaned.trim()

    const parsed = JSON.parse(cleaned)

    if (!['text', 'table', 'chart'].includes(parsed.kind)) {
      throw new Error('Invalid kind')
    }

    const result: Omit<FormattedResponse, 'summary'> = {
      kind: parsed.kind,
      data,
    }

    if (parsed.kind === 'chart') {
      result.chartSubtype = parsed.chartSubtype || 'bar'
      result.chartConfig = {
        xKey: parsed.xKey || columns[0],
        yKey: parsed.yKey || columns[1] || columns[0],
        title: parsed.title || extractChartTitle(question),
      }
    }

    return result
  } catch {
    return decideFormatHeuristic(data, question)
  }
}
