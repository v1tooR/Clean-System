import * as React from 'react'
import { motion } from 'framer-motion'
import { AlertOctagon, RefreshCw, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/misc'
import { cn } from '@/lib/utils'

/* -------------------------------- Vazio ---------------------------------- */

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/80 bg-card/40 px-6 text-center',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-full bg-muted/60 text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </motion.div>
  )
}

/* --------------------------------- Erro ---------------------------------- */

export function ErrorState({
  title = 'Não foi possível carregar',
  description = 'Ocorreu uma falha ao buscar as informações. Tente novamente em instantes.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-full bg-destructive/12 text-destructive">
        <AlertOctagon className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mx-auto max-w-sm text-[13px] text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw className="size-3.5" />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}

/* ------------------------------- Carregando ------------------------------- */

export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-4 border-b border-border px-3 py-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border/70">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-3 py-3.5">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn('h-3.5 flex-1', colIndex === 0 && 'max-w-[64px]')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-4 h-7 w-28" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg border border-border p-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
        </div>
      ))}
    </div>
  )
}
