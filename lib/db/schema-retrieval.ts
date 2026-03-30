import type { SchemaInfo } from '@/types/connection'

export function formatSchemaForPrompt(schema: SchemaInfo): string {
  const lines: string[] = []

  for (const table of schema.tables) {
    const tableName = table.schema ? `${table.schema}.${table.name}` : table.name
    lines.push(`### Table: ${tableName}`)
    if (table.rowCount !== undefined) {
      lines.push(`Rows: ~${table.rowCount.toLocaleString()}`)
    }
    lines.push('Columns:')

    for (const column of table.columns) {
      const nullable = column.nullable ? '' : ' NOT NULL'
      const desc = column.description ? ` -- ${column.description}` : ''
      lines.push(`  - ${column.name} (${column.type})${nullable}${desc}`)
    }

    lines.push('')
  }

  if (schema.relationships && schema.relationships.length > 0) {
    lines.push('### Relationships:')
    for (const rel of schema.relationships) {
      lines.push(
        `  - ${rel.from.table}.${rel.from.column} -> ${rel.to.table}.${rel.to.column} (${rel.type})`
      )
    }
  }

  return lines.join('\n')
}

export function selectRelevantSchema(
  schema: SchemaInfo,
  question: string,
  maxTables: number = 5
): SchemaInfo {
  const questionLower = question.toLowerCase()
  const words = questionLower
    .split(/\s+/)
    .filter((w) => w.length > 2)

  const scored = schema.tables.map((table) => {
    let score = 0

    const tableNameLower = table.name.toLowerCase()
    if (questionLower.includes(tableNameLower)) {
      score += 10
    }

    for (const word of words) {
      if (tableNameLower.includes(word)) {
        score += 5
      }
    }

    for (const column of table.columns) {
      const colNameLower = column.name.toLowerCase()
      if (questionLower.includes(colNameLower)) {
        score += 3
      }
      for (const word of words) {
        if (colNameLower.includes(word)) {
          score += 1
        }
      }
      if (column.description) {
        const descLower = column.description.toLowerCase()
        for (const word of words) {
          if (descLower.includes(word)) {
            score += 1
          }
        }
      }
    }

    return { table, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const selectedTables = scored.slice(0, maxTables).map((s) => s.table)

  const selectedNames = new Set(selectedTables.map((t) => t.name))

  const relevantRelationships = (schema.relationships || []).filter(
    (rel) => selectedNames.has(rel.from.table) && selectedNames.has(rel.to.table)
  )

  return {
    tables: selectedTables,
    relationships:
      relevantRelationships.length > 0 ? relevantRelationships : schema.relationships,
  }
}

export function buildSchemaContext(
  schema: SchemaInfo | null,
  question: string,
  glossary?: string | null
): string {
  if (!schema || !schema.tables || schema.tables.length === 0) {
    return 'No schema information available. The system will attempt to answer based on general knowledge.'
  }

  const relevantSchema = selectRelevantSchema(schema, question)
  let context = formatSchemaForPrompt(relevantSchema)

  if (glossary) {
    context += `\n\n### Business Glossary:\n${glossary}`
  }

  return context
}
