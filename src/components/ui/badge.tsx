import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5 transition-colors whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/12 text-primary',
        neutral: 'border-border bg-muted/60 text-muted-foreground',
        success: 'border-success/25 bg-success/12 text-success',
        warning: 'border-warning/25 bg-warning/12 text-warning',
        destructive: 'border-destructive/30 bg-destructive/12 text-destructive',
        info: 'border-info/25 bg-info/12 text-info',
        outline: 'border-border bg-transparent text-foreground/80',
      },
      size: {
        default: '',
        sm: 'px-1.5 py-0 text-[10px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
