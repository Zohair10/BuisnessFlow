import Anthropic from '@anthropic-ai/sdk'
import { buildSummarizePrompt } from './prompts'
import { filterForLLM } from '@/lib/security/redact'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_ROWS_FOR_SUMMARY = 100

function formatDataPreview(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return 'No data returned.'

  const columns = Object.keys(data[0])
  const rows = data.slice(0, 10)

  let preview = `Columns: ${columns.join(', ')}\n`
  preview += `Total rows: ${data.length}\n\n`
  preview += 'Sample data:\n'

  for (const row of rows) {
    const values = columns.map((col) => {
      const val = row[col]
      if (val === null || val === undefined) return 'null'
      if (typeof val === 'number') {
        return Number.isInteger(val) ? String(val) : val.toFixed(2)
      }
      return String(val)
    })
    preview += values.join(' | ') + '\n'
  }

  if (data.length > 1) {
    const numericColumns = columns.filter((col) => {
      const vals = data.map((r) => r[col]).filter((v) => v !== null && v !== undefined)
      return vals.length > 0 && vals.every((v) => typeof v === 'number')
    })

    if (numericColumns.length > 0) {
      preview += '\nAggregates:\n'
      for (const col of numericColumns) {
        const vals = data
          .map((r) => r[col] as number)
          .filter((v) => v !== null && v !== undefined)
        if (vals.length === 0) continue

        const sum = vals.reduce((a, b) => a + b, 0)
        const avg = sum / vals.length
        const min = Math.min(...vals)
        const max = Math.max(...vals)

        preview += `  ${col}: sum=${formatNum(sum)}, avg=${formatNum(avg)}, min=${formatNum(min)}, max=${formatNum(max)}\n`
      }
    }
  }

  return preview
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString()
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export async function summarizeResult(params: {
  data: Record<string, unknown>[]
  question: string
  responseKind: string
  chartConfig?: Record<string, unknown>
  privacyMode?: 'standard' | 'strict'
}): Promise<string> {
  const { data, question, responseKind, chartConfig, privacyMode } = params

  if (!data || data.length === 0) {
    return 'The query returned no results. Try adjusting your question or filters.'
  }

  if (privacyMode === 'strict') {
    return generateStrictSummary(data, question, responseKind, chartConfig)
  }

  const safeData = filterForLLM(data, MAX_ROWS_FOR_SUMMARY)
  const columns = Object.keys(safeData[0])
  const dataShape = { rowCount: data.length, columns }
  const systemPrompt = buildSummarizePrompt(dataShape, question)

  try {
    const dataPreview = formatDataPreview(safeData)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Question: "${question}"
Response format: ${responseKind}
${chartConfig ? `Chart: ${JSON.stringify(chartConfig)}` : ''}

${dataPreview}`,
        },
      ],
    })

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    )

    if (textBlock && textBlock.text) {
      return textBlock.text.trim()
    }
  } catch (error) {
    console.error('Summarization failed, falling back to heuristic:', error)
  }

  return generateHeuristicSummary(data, question, responseKind)
}

function generateStrictSummary(
  data: Record<string, unknown>[],
  question: string,
  responseKind: string,
  chartConfig?: Record<string, unknown>
): string {
  const columns = Object.keys(data[0])
  const row = data[0]

  if (responseKind === 'text' && data.length === 1) {
    const numericCol = columns.find((c) => typeof row[c] === 'number')
    if (numericCol) {
      const val = row[numericCol] as number
      return `The answer is ${formatNum(val)}${
        numericCol !== columns[0] ? ` (${numericCol})` : ''
      }.`
    }
    return `Result: ${columns.map((c) => String(row[c])).join(', ')}.`
  }

  if (responseKind === 'chart' && chartConfig) {
    const title = (chartConfig.title as string) || 'Data analysis'
    return `${title}: ${data.length} data points across ${
      columns.length
    } dimensions.`
  }

  return `Query returned ${data.length} result${data.length === 1 ? '' : 's'} with ${columns.length} column${columns.length === 1 ? '' : 's'}.`
}

function generateHeuristicSummary(
  data: Record<string, unknown>[],
  question: string,
  responseKind: string
): string {
  const columns = Object.keys(data[0])
  const row = data[0]

  if (data.length === 1 && columns.length <= 2) {
    const numericCol = columns.find((c) => typeof row[c] === 'number')
    if (numericCol) {
      const val = row[numericCol] as number
      const label = columns.find((c) => c !== numericCol)
      if (label && row[label]) {
        return `${row[label]}: ${formatNum(val)}.`
      }
      return `The result is ${formatNum(val)}.`
    }
    return columns.map((c) => String(row[c])).join(', ') + '.'
  }

  if (responseKind === 'chart') {
    const numericColumns = columns.filter((c) =>
      data.some((r) => typeof r[c] === 'number')
    )
    if (numericColumns.length > 0) {
      const firstNum = numericColumns[0]
      const values = data
        .map((r) => r[firstNum] as number)
        .filter((v) => v !== null && v !== undefined)
      const total = values.reduce((a, b) => a + b, 0)
      const max = Math.max(...values)
      const min = Math.min(...values)

      const categoryColumns = columns.filter(
        (c) => c !== firstNum && data.every((r) => typeof r[c] === 'string')
      )
      if (categoryColumns.length > 0 && data.length > 1) {
        const maxIdx = values.indexOf(max)
        const topCategory = data[maxIdx]?.[categoryColumns[0]]
        return `Across ${data.length} categories, ${topCategory} has the highest value at ${formatNum(max)}. Total across all: ${formatNum(total)}.`
      }

      return `The data ranges from ${formatNum(min)} to ${formatNum(max)} across ${data.length} data points. Total: ${formatNum(total)}.`
    }
  }

  if (data.length > 1) {
    return `The query returned ${data.length} results with columns: ${columns.join(', ')}.`
  }

  return `Result: ${columns.map((c) => `${c}: ${row[c]}`).join(', ')}.`
}
