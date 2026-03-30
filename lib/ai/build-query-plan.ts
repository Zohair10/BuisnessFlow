import Anthropic from '@anthropic-ai/sdk'
import { buildQueryPlanPrompt } from './prompts'
import type { QueryPlan } from '@/types/query'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_RETRIES = 2

function parseQueryPlan(raw: string): QueryPlan {
  let cleaned = raw.trim()

  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  cleaned = cleaned.trim()

  const parsed = JSON.parse(cleaned)

  if (!parsed.sourceType || !parsed.intent) {
    throw new Error('QueryPlan missing required fields: sourceType and intent')
  }

  const validIntents: QueryPlan['intent'][] = [
    'aggregate',
    'filter',
    'group',
    'timeseries',
    'ranking',
    'detail',
  ]
  if (!validIntents.includes(parsed.intent)) {
    parsed.intent = 'detail'
  }

  const validSourceTypes: QueryPlan['sourceType'][] = [
    'postgres',
    'mysql',
    'csv',
    'excel',
    'mongodb',
  ]
  if (!validSourceTypes.includes(parsed.sourceType)) {
    parsed.sourceType = 'postgres'
  }

  if (!Array.isArray(parsed.entities)) {
    parsed.entities = []
  }
  if (!Array.isArray(parsed.fields)) {
    parsed.fields = []
  }
  if (!Array.isArray(parsed.filters)) {
    parsed.filters = []
  }
  if (parsed.groupBy !== undefined && !Array.isArray(parsed.groupBy)) {
    parsed.groupBy = undefined
  }
  if (parsed.orderBy !== undefined && !Array.isArray(parsed.orderBy)) {
    parsed.orderBy = undefined
  }
  if (parsed.limit !== undefined && typeof parsed.limit !== 'number') {
    parsed.limit = 100
  }
  if (parsed.limit && parsed.limit > 1000) {
    parsed.limit = 1000
  }

  return parsed as QueryPlan
}

export async function buildQueryPlan(params: {
  question: string
  schema: string
  connectionType: string
  glossary?: string
}): Promise<QueryPlan> {
  const { question, schema, connectionType, glossary } = params

  const systemPrompt = buildQueryPlanPrompt(
    schema,
    question,
    connectionType
  )

  const enhancedSchema = glossary
    ? `${schema}\n\n## BUSINESS GLOSSARY\n${glossary}`
    : schema

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: enhancedSchema
              ? `User question: "${question}"\n\nAvailable schema:\n${enhancedSchema}`
              : `User question: "${question}"`,
          },
        ],
      })

      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      )

      if (!textBlock || !textBlock.text) {
        throw new Error('No text content in Claude response')
      }

      return parseQueryPlan(textBlock.text)
    } catch (error) {
      lastError = error as Error

      if (error instanceof SyntaxError) {
        if (attempt < MAX_RETRIES) {
          continue
        }
      }

      if (
        error instanceof Anthropic.APIError &&
        error.status &&
        error.status >= 500
      ) {
        if (attempt < MAX_RETRIES) {
          continue
        }
      }

      if (attempt >= MAX_RETRIES) {
        break
      }
    }
  }

  return {
    sourceType: (['postgres', 'mysql', 'csv', 'excel'].includes(connectionType)
      ? connectionType
      : 'postgres') as QueryPlan['sourceType'],
    intent: 'detail',
    entities: [],
    fields: [],
    filters: [],
  }
}
