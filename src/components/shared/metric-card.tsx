import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/misc'

interface MetricCardProps {
  label: string
  value: string
  icon: LucideIcon
  hint?: string
  trend?: { value: number; label: string }
  tone?: 'default' | 'success' | 'warning' | 'info' | 'destructive'
  loading?: boolean
  onClick?: () => void
  footer?: React.ReactNode
}

const toneStyles = {
  default: 'text-primary bg-primary/12',
  success: 'text-success bg-success/12',
  warning: 'text-warning bg-warning/12',
  info: 'text-info bg-info/12',
  destructive: 'text-destructive bg-destructive/12',
} as const

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  tone = 'default',
  loading,
  onClick,
  footer,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="size-8 rounded-md" />
        </div>
        <Skeleton className="mt-4 h-7 w-32" />
        <Skeleton className="mt-3 h-3 w-24" />
      </div>
    )
  }

  const TrendIcon = !trend ? ArrowRight : trend.value > 0 ? ArrowUpRight : trend.value < 0 ? ArrowDownRight : ArrowRight
  const trendTone =
    !trend || trend.value === 0
      ? 'text-muted-foreground'
      : trend.value > 0
        ? 'text-success'
        : 'text-destructive'

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg border border-border bg-card p-4 text-left shadow-xs transition-[transform,border-color,background-color,box-shadow] duration-200',
        onClick && 'hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card-elevated hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/60',
      )}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-sky/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', toneStyles[tone])}>
          <Icon className="size-4" />
        </span>
      </div>

      <motion.p
        key={value}
        initial={{ opacity: 1, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="tabular mt-3 text-[26px] font-semibold leading-none tracking-tight"
      >
        {value}
      </motion.p>

      <div className="mt-3 flex items-center gap-2 text-[12px]">
        {trend ? (
          <span className={cn('inline-flex items-center gap-0.5 font-medium', trendTone)}>
            <TrendIcon className="size-3.5" />
            {trend.value > 0 ? '+' : ''}
            {trend.value}%
          </span>
        ) : null}
        <span className="truncate text-muted-foreground">{trend?.label ?? hint}</span>
      </div>

      {footer}
    </Wrapper>
  )
}
