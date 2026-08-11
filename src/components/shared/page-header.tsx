import * as React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  to?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Crumb[]
  actions?: React.ReactNode
  meta?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Trilha de navegação" className="flex items-center gap-1 text-[12px]">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <ChevronRight className="size-3 text-muted-foreground/60" /> : null}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="rounded text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground/80">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-[22px]">{title}</h1>
          {description ? (
            <p className="text-[13px] text-muted-foreground">{description}</p>
          ) : null}
          {meta}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
