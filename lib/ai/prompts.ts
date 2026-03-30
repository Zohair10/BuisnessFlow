export function buildQueryPlanPrompt(
  schema: string,
  question: string,
  connectionType: string
): string {
  const connectorLabel =
    connectionType === 'mongodb'
      ? 'MongoDB (aggregation pipeline)'
      : connectionType === 'csv' || connectionType === 'excel'
        ? 'tabular file (SQL via DuckDB)'
        : `${connectionType.toUpperCase()} (SQL)`

  return `You are an expert data analyst AI for Buisness Flow, a conversational analytics platform.

Your job is to translate a user's natural-language question into a structured QueryPlan object that will be compiled into an executable query for a ${connectorLabel} data source.

## SCHEMA CONTEXT
The following schema describes the available tables and columns:

${schema}

## RULES
1. Only reference tables and columns that exist in the schema above.
2. If the user asks about something that does not match any table or column, set the intent to "detail" with an empty entities array so the system can respond gracefully.
3. Never generate queries that modify data (no INSERT, UPDATE, DELETE, DROP, etc.).
4. Use the correct aggregation functions: sum, avg, count, min, max, distinct_count.
5. Apply appropriate GROUP BY when aggregations are used.
6. Apply ORDER BY with a sensible default direction based on the question.
7. Apply a reasonable LIMIT (default 100, max 1000) unless the user specifies otherwise.
8. For time-based questions, set the appropriate timeGrain (day, week, month, quarter, year).
9. Use descriptive aliases for computed fields (e.g., "total_revenue" instead of "sum_amount").
10. Handle relative time references (e.g., "this month", "last quarter") by generating appropriate filter conditions.

## OUTPUT FORMAT
Respond with ONLY a valid JSON object matching this TypeScript interface (no markdown, no explanation):

{
  "sourceType": "${connectionType}",
  "intent": "aggregate" | "filter" | "group" | "timeseries" | "ranking" | "detail",
  "entities": ["table_name"],
  "fields": [
    {
      "field": "column_name",
      "agg": "sum" | "avg" | "count" | "min" | "max" | "distinct_count",
      "alias": "descriptive_name"
    }
  ],
  "filters": [
    {
      "field": "column_name",
      "op": "=" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "between" | "contains",
      "value": <appropriate_value>
    }
  ],
  "groupBy": ["column_name"],
  "orderBy": [
    { "field": "column_or_alias", "direction": "asc" | "desc" }
  ],
  "limit": 100,
  "timeGrain": "day" | "week" | "month" | "quarter" | "year"
}

All fields except sourceType and intent are optional. Include only what is needed for the question.`
}

export function buildSummarizePrompt(
  dataShape: { rowCount: number; columns: string[] },
  question: string
): string {
  return `You are an analytics assistant. A user asked: "${question}"

The query returned ${dataShape.rowCount} row(s) with columns: ${dataShape.columns.join(', ')}.

Write a concise, insightful summary (1-3 sentences) that:
1. Directly answers the user's question using the data
2. Highlights the most important insight or trend
3. Uses natural, conversational language (no jargon)
4. Includes specific numbers from the data when relevant
5. Avoids saying "the data shows" or "based on the results" — just state the insight

Do not prefix with labels. Just provide the summary text.`
}

export const FORMAT_DECISION_RULES = {
  TEXT_MAX_ROWS: 1,
  TIMESERIES_MIN_POINTS: 3,
  PIE_MAX_BUCKETS: 8,
  TABLE_MIN_COLUMNS: 4,
  TABLE_MIN_ROWS: 10,
  DATE_COLUMN_PATTERNS: [
    /date/i,
    /time/i,
    /timestamp/i,
    /created_at/i,
    /updated_at/i,
    /month/i,
    /year/i,
    /week/i,
  ],
  PERCENTAGE_PATTERNS: [
    /percent/i,
    /ratio/i,
    /share/i,
    /proportion/i,
    /breakdown/i,
    /distribution/i,
  ],
  RANKING_PATTERNS: [
    /top/i,
    /bottom/i,
    /best/i,
    /worst/i,
    /highest/i,
    /lowest/i,
    /rank/i,
    /most/i,
    /least/i,
  ],
  TIMESERIES_PATTERNS: [
    /over time/i,
    /trend/i,
    /per (day|week|month|quarter|year)/i,
    /by (day|week|month|quarter|year)/i,
    /each (day|week|month|quarter|year)/i,
    /daily|weekly|monthly|yearly/i,
    /over the last/i,
    /historical/i,
  ],
} as const
