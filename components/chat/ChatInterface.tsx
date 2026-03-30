'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Database,
  ChevronDown,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { SessionSidebar } from './SessionSidebar'
import { useChatStore } from '@/lib/store/chat-store'
import { cn } from '@/lib/utils'

const QUICK_TIPS = [
  'Show me total revenue by month this year',
  'What are the top 10 customers by order value?',
  'How many new users signed up last week?',
  'Compare sales across product categories',
]

export function ChatInterface() {
  const [inputValue, setInputValue] = useState('')
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    sessions,
    activeSessionId,
    messages,
    isLoading,
    isStreaming,
    activeConnectionId,
    connections,
    error,

    fetchSessions,
    fetchConnections,
    sendMessage,
    createSession,
    switchSession,
    deleteSession,
    retryLastQuery,
  } = useChatStore()

  useEffect(() => {
    fetchSessions()
    fetchConnections()
  }, [fetchSessions, fetchConnections])

  useEffect(() => {
    if (
      sessions.length > 0 &&
      !activeSessionId
    ) {
      const mostRecent = sessions[0]
      switchSession(mostRecent.id)
    }
  }, [sessions, activeSessionId, switchSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoading])

  const activeConnection = connections.find(
    (c) => c.id === activeConnectionId
  )

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    if (!activeSessionId) {
      const connId = activeConnectionId || connections[0]?.id
      if (!connId) return

      const session = await createSession(connId)
      if (!session) return

      setInputValue('')
      await useChatStore.getState().sendMessage(trimmed)
      return
    }

    setInputValue('')
    await sendMessage(trimmed)
  }, [inputValue, isLoading, activeSessionId, activeConnectionId, connections, createSession, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTipClick = (tip: string) => {
    setInputValue(tip)
    inputRef.current?.focus()
  }

  const handleNewChat = async () => {
    const connId = activeConnectionId || connections[0]?.id
    if (!connId) return
    await createSession(connId)
    inputRef.current?.focus()
  }

  const handleSelectSession = async (id: string) => {
    await switchSession(id)
  }

  const handleConnectionSelect = async (connectionId: string) => {
    useChatStore.setState({ activeConnectionId: connectionId })
    setShowConnectionDropdown(false)

    if (!activeSessionId || (activeSession && activeSession.connectionId !== connectionId)) {
      const existingSession = sessions.find(
        (s) => s.connectionId === connectionId
      )
      if (existingSession) {
        await switchSession(existingSession.id)
      } else {
        await createSession(connectionId)
      }
    }
  }

  const hasNoMessages =
    messages.length === 0 ||
    (messages.length === 1 &&
      messages[0].role === 'ASSISTANT' &&
      (messages[0].content as { type: string; text: string }).text ===
        '__TYPING__')

  return (
    <div className="flex h-full">
      {showSidebar && (
        <div className="w-72 flex-shrink-0">
          <SessionSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onCreateSession={handleNewChat}
            onDeleteSession={deleteSession}
            connectionName={activeConnection?.name}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3',
            'border-b border-border',
            'bg-background'
          )}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm lg:hidden"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {activeConnection && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowConnectionDropdown(!showConnectionDropdown)
                    }
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                      'border border-border hover:border-primary/30',
                      'bg-card transition-all'
                    )}
                  >
                    <Database className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {activeConnection.name}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                        getConnectionBadgeStyle(activeConnection.type)
                      )}
                    >
                      {activeConnection.type}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>

                  {showConnectionDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowConnectionDropdown(false)}
                      />
                      <div
                        className={cn(
                          'absolute top-full left-0 mt-1 w-64 z-50',
                          'rounded-lg border border-border',
                          'bg-card shadow-xl overflow-hidden'
                        )}
                      >
                        {connections
                          .filter((c) => c.status === 'ACTIVE')
                          .map((conn) => (
                            <button
                              key={conn.id}
                              onClick={() => handleConnectionSelect(conn.id)}
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-2.5',
                                'hover:bg-secondary transition-colors',
                                'text-left',
                                conn.id === activeConnectionId &&
                                  'bg-secondary'
                              )}
                            >
                              <Database
                                className={cn(
                                  'w-3.5 h-3.5',
                                  conn.id === activeConnectionId
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                )}
                              />
                              <span className="text-sm text-foreground">
                                {conn.name}
                              </span>
                              <span
                                className={cn(
                                  'ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold',
                                  getConnectionBadgeStyle(conn.type)
                                )}
                              >
                                {conn.type}
                              </span>
                            </button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {!activeConnection && connections.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  No connections configured
                </span>
              )}
            </div>
          </div>

          {activeSession?.title && (
            <span className="text-xs text-muted-foreground hidden md:block max-w-[200px] truncate">
              {activeSession.title}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {hasNoMessages && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome to Buisness Flow
                </h2>
                <p className="text-muted-foreground text-center max-w-md mb-8">
                  Ask questions about your data in plain English.
                  Get answers as text, tables, or charts.
                </p>

                {connections.length === 0 ? (
                  <a
                    href="/connections"
                    className={cn(
                      'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg',
                      'bg-primary text-background',
                      'font-medium text-sm hover:brightness-110 transition-all'
                    )}
                  >
                    <Database className="w-4 h-4" />
                    Connect a Database
                  </a>
                ) : (
                  <div className="w-full max-w-lg">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
                      Try asking
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {QUICK_TIPS.map((tip) => (
                        <button
                          key={tip}
                          onClick={() => handleTipClick(tip)}
                          className={cn(
                            'text-left px-4 py-3 rounded-lg text-sm',
                            'border border-border hover:border-primary/30',
                            'text-foreground/80 hover:text-foreground',
                            'bg-card hover:bg-secondary',
                            'transition-all'
                          )}
                        >
                          {tip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {messages
              .filter((m) => {
                const content = m.content as { type: string; text?: string }
                if (
                  m.role === 'ASSISTANT' &&
                  content.type === 'text' &&
                  content.text === '__TYPING__'
                ) {
                  return isLoading
                }
                return true
              })
              .map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onRetry={
                    message.role === 'ASSISTANT' &&
                    (message.content as { type: string }).type === 'error'
                      ? retryLastQuery
                      : undefined
                  }
                />
              ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <p className="text-xs text-destructive">{error}</p>
              <button
                onClick={() => useChatStore.setState({ error: null })}
                className="text-destructive hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-border bg-background px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeConnection
                      ? `Ask about your ${activeConnection.name} data...`
                      : 'Ask a data question...'
                  }
                  disabled={isLoading || connections.length === 0}
                  rows={1}
                  className={cn(
                    'w-full px-4 py-3 pr-12 rounded-xl resize-none',
                    'bg-card border border-border',
                    'text-foreground placeholder:text-muted-foreground/70',
                    'focus:outline-none focus:border-primary/50',
                    'transition-colors text-[15px] leading-relaxed',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'max-h-32 overflow-y-auto scrollbar-thin'
                  )}
                  style={{
                    height: 'auto',
                    minHeight: '48px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = `${Math.min(target.scrollHeight, 128)}px`
                  }}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  'flex-shrink-0 flex items-center justify-center',
                  'w-11 h-11 rounded-xl',
                  'transition-all',
                  inputValue.trim() && !isLoading
                    ? 'bg-primary text-background hover:brightness-110 active:scale-95'
                    : 'bg-secondary text-muted-foreground/70 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground/70 mt-2 text-center">
              Buisness Flow uses AI to translate your questions into queries.
              Press Enter to send, Shift+Enter for a new line.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function getConnectionBadgeStyle(
  type: string
): string {
  switch (type) {
    case 'POSTGRES':
      return 'bg-blue-500/20 text-blue-400'
    case 'MYSQL':
      return 'bg-orange-500/20 text-orange-400'
    case 'MONGODB':
      return 'bg-green-500/20 text-green-400'
    case 'CSV':
      return 'bg-purple-500/20 text-purple-400'
    case 'EXCEL':
      return 'bg-emerald-500/20 text-emerald-400'
    default:
      return 'bg-secondary text-muted-foreground'
  }
}
