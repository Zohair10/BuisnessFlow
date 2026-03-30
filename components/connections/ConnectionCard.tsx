'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'
import {
  Database,
  Server,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Pencil,
  Loader2,
  Wifi,
  WifiOff,
  AlertTriangle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type ConnectionType = 'POSTGRES' | 'MYSQL' | 'MONGODB' | 'CSV' | 'EXCEL'
type ConnectionStatus = 'ACTIVE' | 'ERROR' | 'DISABLED'

interface ConnectionCardProps {
  id: string
  name: string
  type: ConnectionType
  status: ConnectionStatus
  fileSizeBytes?: number | null
  lastTestedAt?: string | null
  onDelete: (id: string) => Promise<void>
  onTest: (id: string) => Promise<void>
  onEdit: (id: string) => void
}

const TYPE_CONFIG: Record<
  ConnectionType,
  { label: string; icon: React.ElementType; color: string }
> = {
  POSTGRES: {
    label: 'PostgreSQL',
    icon: Database,
    color: 'text-blue-400',
  },
  MYSQL: {
    label: 'MySQL',
    icon: Database,
    color: 'text-orange-400',
  },
  MONGODB: {
    label: 'MongoDB',
    icon: Server,
    color: 'text-emerald-400',
  },
  CSV: {
    label: 'CSV',
    icon: FileSpreadsheet,
    color: 'text-cyan-400',
  },
  EXCEL: {
    label: 'Excel',
    icon: FileSpreadsheet,
    color: 'text-green-400',
  },
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; dotColor: string; badgeVariant: 'default' | 'secondary' | 'destructive' }
> = {
  ACTIVE: {
    label: 'Active',
    dotColor: 'bg-emerald-400',
    badgeVariant: 'default',
  },
  ERROR: {
    label: 'Error',
    dotColor: 'bg-red-400',
    badgeVariant: 'destructive',
  },
  DISABLED: {
    label: 'Disabled',
    dotColor: 'bg-yellow-400',
    badgeVariant: 'secondary',
  },
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

export function ConnectionCard({
  id,
  name,
  type,
  status,
  fileSizeBytes,
  lastTestedAt,
  onDelete,
  onTest,
  onEdit,
}: ConnectionCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)

  const typeConfig = TYPE_CONFIG[type]
  const statusConfig = STATUS_CONFIG[status]
  const Icon = typeConfig.icon

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    try {
      await onTest(id)
    } finally {
      setIsTesting(false)
    }
  }

  const isFileConnection = type === 'CSV' || type === 'EXCEL'

  return (
    <Card className="group relative transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary',
                typeConfig.color
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate">{name}</h3>
                <div
                  className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    statusConfig.dotColor
                  )}
                  title={statusConfig.label}
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                  {typeConfig.label}
                </Badge>
                {isFileConnection && fileSizeBytes != null && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(fileSizeBytes)}
                  </span>
                )}
              </div>

              {lastTestedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last tested{' '}
                  {formatDistanceToNow(new Date(lastTestedAt), { addSuffix: true })}
                </p>
              )}

              {status === 'ERROR' && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Connection error detected
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleTest}
              disabled={isTesting}
              title="Test connection"
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : status === 'ACTIVE' ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(id)}
              title="Edit connection"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={isDeleting}
                  title="Delete connection"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Connection</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &ldquo;{name}&rdquo;? This will also
                    remove all associated query history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
