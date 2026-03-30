'use client'

import { RefreshCw } from 'lucide-react'
import { ResponseRenderer } from './ResponseRenderer'
import { cn } from '@/lib/utils'
import type { QueryMessage, MessageContent } from '@/types/session'

interface MessageBubbleProps {
  message: QueryMessage
  onRetry?: () => void
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
      <div
        className="w-2 h-2 rounded-full bg-primary animate-pulse-soft"
        style={{ animationDelay: '0.3s' }}
      />
      <div
        className="w-2 h-2 rounded-full bg-primary animate-pulse-soft"
        style={{ animationDelay: '0.6s' }}
      />
    </div>
  )
}

function isErrorContent(
  content: MessageContent
): content is Extract<MessageContent, { type: 'error' }> {
  return content.type === 'error'
}

function isResponseContent(
  content: MessageContent
): content is Extract<MessageContent, { type: 'response' }> {
  return content.type === 'response'
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === 'USER'
  const isAssistant = message.role === 'ASSISTANT'

  const content = message.content as MessageContent

  const isTyping =
    isAssistant &&
    content.type === 'text' &&
    content.text === '__TYPING__'

  if (isTyping) {
    return (
      <div className="flex justify-start animate-fade-in">
        <div
          className={cn(
            'max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3',
            'bg-card border border-border'
          )}
        >
          <TypingIndicator />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-background rounded-tr-sm'
            : 'bg-card border border-border rounded-tl-sm text-foreground'
        )}
      >
        {isUser && (
          <div>
            <p className="text-[15px] leading-relaxed font-medium">
              {content.type === 'text'
                ? content.text
                : content.type === 'query'
                  ? content.question
                  : String(content)}
            </p>
            <p
              className={cn(
                'text-[10px] mt-1.5 text-right opacity-60'
              )}
            >
              {formatTime(message.createdAt)}
            </p>
          </div>
        )}

        {isAssistant && isErrorContent(content) && (
          <div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-destructive text-xs font-bold">
                  !
                </span>
              </div>
              <div>
                <p className="text-sm text-destructive font-medium">
                  Error
                </p>
                <p className="text-sm text-foreground mt-1">
                  {content.message}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className={cn(
                      'mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs',
                      'text-primary border border-primary/30',
                      'hover:bg-primary/10 transition-all'
                    )}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] mt-2 text-muted-foreground">
              {formatTime(message.createdAt)}
            </p>
          </div>
        )}

        {isAssistant && isResponseContent(content) && (
          <div>
            <ResponseRenderer
              summary={content.summary}
              responseKind={content.responseKind as 'text' | 'table' | 'chart'}
              chartSubtype={content.chartSubtype as 'bar' | 'line' | 'pie' | undefined}
              data={content.data}
              chartConfig={content.chartConfig as {
                xKey: string
                yKey: string
                title: string
                color?: string
              } | undefined}
              compiledQuery={content.compiledQuery}
              isMongo={false}
            />
            <p className="text-[10px] mt-2 text-muted-foreground">
              {formatTime(message.createdAt)}
            </p>
          </div>
        )}

        {isAssistant &&
          content.type === 'text' &&
          content.text !== '__TYPING__' && (
            <div>
              <p className="text-[15px] leading-relaxed">{content.text}</p>
              <p className="text-[10px] mt-1.5 text-muted-foreground">
                {formatTime(message.createdAt)}
              </p>
            </div>
          )}
      </div>
    </div>
  )
}
