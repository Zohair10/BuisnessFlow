export interface QueryPlan {
  sourceType: 'postgres' | 'mysql' | 'csv' | 'excel' | 'mongodb'
  intent: 'aggregate' | 'filter' | 'group' | 'timeseries' | 'ranking' | 'detail'
  entities: string[]
  fields: Array<{
    field: string
    agg?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct_count'
    alias?: string
  }>
  filters: Array<{
    field: string
    op: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'between' | 'contains'
    value: unknown
  }>
  groupBy?: string[]
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>
  limit?: number
  timeGrain?: 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface FormattedResponse {
  kind: 'text' | 'table' | 'chart'
  chartSubtype?: 'bar' | 'line' | 'pie'
  summary: string
  chartConfig?: {
    xKey: string
    yKey: string
    title: string
    color?: string
  }
  data: Record<string, unknown>[]
}

export interface QueryRunResult {
  queryRunId: string
  sessionId: string
  compiledQuery?: string
  compiledPipeline?: Record<string, unknown>[]
  response: FormattedResponse
  meta: {
    rowCount: number
    durationMs: number
    cacheHit: boolean
    privacyMode: 'standard' | 'strict'
  }
}

export interface QueryRequest {
  workspaceId: string
  connectionId: string
  sessionId: string
  question: string
}

export interface QueryHistoryEntry {
  id: string
  question: string
  compiledQuery: string | null
  responseKind: string | null
  chartSubtype: string | null
  rowCount: number | null
  durationMs: number | null
  status: string
  createdAt: string
  connectionName: string
}
