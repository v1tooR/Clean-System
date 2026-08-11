import * as React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepDefinition {
  id: string
  label: string
  description?: string
}

interface StepperProps {
  steps: StepDefinition[]
  current: number
  /** Índice máximo já alcançado — permite voltar sem perder o progresso. */
  furthest: number
  onStepClick?: (index: number) => void
  className?: string
}

export function Stepper({ steps, current, furthest, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full items-center gap-1', className)}>
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        const reachable = index <= furthest

        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!reachable || !onStepClick}
              onClick={() => onStepClick?.(index)}
              className={cn(
                'group flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors',
                reachable && onStepClick && 'hover:bg-accent/60',
                !reachable && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'relative grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold transition-colors',
                  done && 'border-success bg-success/15 text-success',
                  active && 'border-primary bg-primary text-primary-foreground',
                  !done && !active && 'border-border bg-muted/50 text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
                {active ? (
                  <motion.span
                    layoutId="stepper-active-ring"
                    className="absolute -inset-1 rounded-full border border-primary/40"
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  />
                ) : null}
              </span>
              <span className="hidden min-w-0 flex-col md:flex">
                <span
                  className={cn(
                    'truncate text-[12px] font-medium leading-4 transition-colors',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </span>
            </button>
            {index < steps.length - 1 ? (
              <span className="h-px min-w-3 flex-1 bg-border md:min-w-4">
                <motion.span
                  className="block h-px bg-success/70"
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  style={{ transformOrigin: 'left' }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                />
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

/** Container animado para o conteúdo de cada etapa. */
export function StepPanel({
  stepKey,
  children,
  className,
}: {
  stepKey: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
