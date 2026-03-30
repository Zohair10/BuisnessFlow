export interface QuerySession {
  id: string
  workspaceId: string
  userId: string
  connectionId: string
  title: string | null
  createdAt: string
  updatedAt: string
  connectionName?: string
  messageCount?: number
}

export interface QueryMessage {
  id: string
  sessionId: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: MessageContent
  createdAt: string
}

export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'query'; question: string; queryRunId: string }
  | { type: 'response'; summary: string; responseKind: string; chartSubtype?: string; data: Record<string, unknown>[]; chartConfig?: Record<string, unknown>; compiledQuery?: string }
  | { type: 'error'; message: string }

export interface CreateSessionInput {
  connectionId: string
  title?: string
}

export interface SessionListItem {
  id: string
  title: string | null
  connectionName: string
  connectionType: string
  updatedAt: string
  messageCount: number
}
