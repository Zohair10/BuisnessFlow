'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuerySession } from '@/types/session'

interface SessionSidebarProps {
  sessions: QuerySession[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onCreateSession: () => void
  onDeleteSession: (id: string) => void
  connectionName?: string
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function truncateTitle(title: string, maxLen: number = 40): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 3) + '...'
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  connectionName,
}: SessionSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const q = searchQuery.toLowerCase()
    return sessions.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.connectionName?.toLowerCase().includes(q)
    )
  }, [sessions, searchQuery])

  const groupedSessions = useMemo(() => {
    const today = new Date()
    const todayStr = today.toDateString()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    const groups: Record<string, QuerySession[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    }

    for (const session of filteredSessions) {
      const sessionDate = new Date(session.updatedAt).toDateString()
      if (sessionDate === todayStr) {
        groups.Today.push(session)
      } else if (sessionDate === yesterdayStr) {
        groups.Yesterday.push(session)
      } else {
        groups.Earlier.push(session)
      }
    }

    return Object.entries(groups).filter(([, items]) => items.length > 0)
  }, [filteredSessions])

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-3 border-b border-sidebar-border">
        <button
          onClick={onCreateSession}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg',
            'bg-primary text-background',
            'font-medium text-sm hover:brightness-110',
            'transition-all active:scale-[0.98]'
          )}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className={cn(
              'w-full pl-8 pr-3 py-2 rounded-lg text-xs',
              'bg-background border border-border',
              'text-foreground placeholder:text-muted-foreground/70',
              'focus:outline-none focus:border-primary/50',
              'transition-colors'
            )}
          />
        </div>
      </div>

      {connectionName && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background">
            <Database className="w-3 h-3 text-primary" />
            <span className="text-xs text-muted-foreground truncate">
              {connectionName}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
        {filteredSessions.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 mx-auto text-border mb-2" />
            <p className="text-xs text-muted-foreground">
              {searchQuery ? 'No matching sessions' : 'No sessions yet'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Start a new chat to begin
            </p>
          </div>
        )}

        {groupedSessions.map(([groupLabel, items]) => (
          <div key={groupLabel} className="mb-3">
            <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {groupLabel}
            </p>
            {items.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                onMouseEnter={() => setHoveredId(session.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  'group relative flex items-start gap-2 px-2.5 py-2 rounded-lg cursor-pointer',
                  'transition-all',
                  activeSessionId === session.id
                    ? 'bg-secondary border border-primary/20'
                    : 'hover:bg-sidebar-accent border border-transparent'
                )}
              >
                <MessageSquare
                  className={cn(
                    'w-3.5 h-3.5 flex-shrink-0 mt-0.5',
                    activeSessionId === session.id
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-xs font-medium truncate',
                      activeSessionId === session.id
                        ? 'text-foreground'
                        : 'text-foreground/80'
                    )}
                  >
                    {session.title
                      ? truncateTitle(session.title)
                      : 'New conversation'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {formatRelativeTime(session.updatedAt)}
                  </p>
                </div>

                {(hoveredId === session.id ||
                  activeSessionId === session.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(session.id)
                    }}
                    className={cn(
                      'p-1 rounded opacity-0 group-hover:opacity-100',
                      'text-muted-foreground hover:text-destructive',
                      'transition-all'
                    )}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
