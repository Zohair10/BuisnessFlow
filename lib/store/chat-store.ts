import { create } from 'zustand'
import type {
  QuerySession,
  QueryMessage,
  MessageContent,
} from '@/types/session'
import type { DataConnection } from '@/types/connection'
import type { QueryRunResult } from '@/types/query'

interface ChatState {
  sessions: QuerySession[]
  activeSessionId: string | null
  messages: QueryMessage[]
  isLoading: boolean
  isStreaming: boolean
  activeConnectionId: string | null
  connections: DataConnection[]
  error: string | null

  setSessions: (sessions: QuerySession[]) => void
  setActiveSessionId: (id: string | null) => void
  setMessages: (messages: QueryMessage[]) => void
  addMessage: (message: QueryMessage) => void
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void
  setActiveConnectionId: (id: string | null) => void
  setConnections: (connections: DataConnection[]) => void
  setError: (error: string | null) => void

  fetchSessions: () => Promise<void>
  fetchMessages: (sessionId: string) => Promise<void>
  sendMessage: (question: string) => Promise<void>
  createSession: (connectionId: string, title?: string) => Promise<QuerySession | null>
  switchSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  retryLastQuery: () => Promise<void>
  fetchConnections: () => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  activeConnectionId: null,
  connections: [],
  error: null,

  setSessions: (sessions) => set({ sessions }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setActiveConnectionId: (id) => set({ activeConnectionId: id }),
  setConnections: (connections) => set({ connections }),
  setError: (error) => set({ error }),

  fetchSessions: async () => {
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const data = await res.json()
      set({ sessions: data.sessions || [] })
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      set({ error: 'Failed to load sessions' })
    }
  },

  fetchMessages: async (sessionId) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      const data = await res.json()
      set({
        messages: data.messages || [],
        activeSessionId: sessionId,
      })
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      set({ error: 'Failed to load messages' })
    }
  },

  sendMessage: async (question) => {
    const state = get()
    const sessionId = state.activeSessionId
    const connectionId = state.activeConnectionId

    if (!sessionId || !connectionId) {
      set({ error: 'No active session or connection' })
      return
    }

    const userMessage: QueryMessage = {
      id: `temp_${Date.now()}_user`,
      sessionId,
      role: 'USER',
      content: { type: 'text', text: question },
      createdAt: new Date().toISOString(),
    }

    const typingMessage: QueryMessage = {
      id: `temp_${Date.now()}_typing`,
      sessionId,
      role: 'ASSISTANT',
      content: { type: 'text', text: '__TYPING__' },
      createdAt: new Date().toISOString(),
    }

    set((s) => ({
      messages: [...s.messages, userMessage, typingMessage],
      isLoading: true,
      isStreaming: true,
      error: null,
    }))

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          connectionId,
          question,
          workspaceId: '',
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Query failed')
      }

      const result: QueryRunResult = await res.json()

      set((s) => {
        const filtered = s.messages.filter(
          (m) => m.id !== typingMessage.id && m.id !== userMessage.id
        )

        const confirmedUserMsg: QueryMessage = {
          id: result.queryRunId
            ? `msg_${result.queryRunId}_user`
            : `msg_${Date.now()}_user`,
          sessionId,
          role: 'USER',
          content: { type: 'query', question, queryRunId: result.queryRunId },
          createdAt: new Date().toISOString(),
        }

        const assistantMessage: QueryMessage = {
          id: result.queryRunId
            ? `msg_${result.queryRunId}_asst`
            : `msg_${Date.now()}_asst`,
          sessionId,
          role: 'ASSISTANT',
          content: {
            type: 'response',
            summary: result.response.summary,
            responseKind: result.response.kind,
            chartSubtype: result.response.chartSubtype,
            data: result.response.data,
            chartConfig: result.response.chartConfig,
            compiledQuery: result.compiledQuery,
          } as MessageContent,
          createdAt: new Date().toISOString(),
        }

        return {
          messages: [...filtered, confirmedUserMsg, assistantMessage],
          isLoading: false,
          isStreaming: false,
        }
      })
    } catch (error) {
      const errorMessage: QueryMessage = {
        id: `temp_${Date.now()}_error`,
        sessionId,
        role: 'ASSISTANT',
        content: {
          type: 'error',
          message:
            error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        createdAt: new Date().toISOString(),
      }

      set((s) => {
        const filtered = s.messages.filter(
          (m) => m.id !== typingMessage.id
        )
        return {
          messages: [...filtered, errorMessage],
          isLoading: false,
          isStreaming: false,
          error: error instanceof Error ? error.message : 'Query failed',
        }
      })
    }
  },

  createSession: async (connectionId, title) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, title }),
      })

      if (!res.ok) throw new Error('Failed to create session')
      const data = await res.json()

      const session: QuerySession = data.session

      set((s) => ({
        sessions: [session, ...s.sessions],
        activeSessionId: session.id,
        messages: [],
        activeConnectionId: connectionId,
      }))

      return session
    } catch (error) {
      console.error('Failed to create session:', error)
      set({ error: 'Failed to create session' })
      return null
    }
  },

  switchSession: async (sessionId) => {
    set({ activeSessionId: sessionId, messages: [], isLoading: true })

    try {
      const res = await fetch(`/api/sessions/${sessionId}`)
      if (!res.ok) throw new Error('Failed to load session')
      const data = await res.json()

      set({
        messages: data.messages || [],
        activeConnectionId: data.session?.connectionId || null,
        isLoading: false,
      })
    } catch (error) {
      console.error('Failed to switch session:', error)
      set({ isLoading: false, error: 'Failed to load session' })
    }
  },

  deleteSession: async (sessionId) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete session')

      set((s) => {
        const remaining = s.sessions.filter((sess) => sess.id !== sessionId)
        const isActive = s.activeSessionId === sessionId
        return {
          sessions: remaining,
          activeSessionId: isActive
            ? remaining[0]?.id || null
            : s.activeSessionId,
          messages: isActive ? [] : s.messages,
          activeConnectionId: isActive ? null : s.activeConnectionId,
        }
      })
    } catch (error) {
      console.error('Failed to delete session:', error)
      set({ error: 'Failed to delete session' })
    }
  },

  retryLastQuery: async () => {
    const { messages } = get()
    const userMessages = messages.filter((m) => m.role === 'USER')
    const lastUserMessage = userMessages[userMessages.length - 1]

    if (!lastUserMessage) return

    let question: string | null = null
    if (
      lastUserMessage.content.type === 'text'
    ) {
      question = lastUserMessage.content.text
    } else if (lastUserMessage.content.type === 'query') {
      question = lastUserMessage.content.question
    }

    if (!question) return

    set((s) => ({
      messages: s.messages.slice(0, -1),
    }))

    await get().sendMessage(question)
  },

  fetchConnections: async () => {
    try {
      const res = await fetch('/api/connections')
      if (!res.ok) throw new Error('Failed to fetch connections')
      const data = await res.json()
      set({ connections: data.connections || [] })
    } catch (error) {
      console.error('Failed to fetch connections:', error)
      set({ error: 'Failed to load connections' })
    }
  },
}))
