import * as React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepDefinition {
  id: string
  label: string
  description?: string
  group?: string
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
  const activeStep = steps[current]
  const progress = steps.length > 0 ? Math.round(((current + 1) / steps.length) * 100) : 100

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-start justify-between gap-4 px-1">
        <div className="min-w-0" aria-live="polite">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            Agora: {activeStep.group ?? 'Atendimento'}
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
              {activeStep.label}
            </h2>
            {activeStep.description ? (
              <p className="text-[12px] text-muted-foreground">{activeStep.description}</p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="tabular text-[11px] font-medium text-foreground">
            Etapa {current + 1} de {steps.length}
          </p>
          <p className="tabular text-[10px] text-muted-foreground">{progress}% do fluxo</p>
        </div>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Progresso do atendimento"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <motion.span
          className="block h-full rounded-full bg-gradient-to-r from-brand-deep to-primary"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      <ol className="no-scrollbar mt-3 flex w-full items-center overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const done = index < current
          const active = index === current
          const reachable = index <= furthest
          const visited = reachable && !done && !active

          return (
            <li key={step.id} className="flex shrink-0 items-center">
              <button
                type="button"
                disabled={!reachable || !onStepClick}
                onClick={() => onStepClick?.(index)}
                aria-current={active ? 'step' : undefined}
                aria-label={`${step.label}: ${active ? 'etapa atual' : done ? 'concluida' : visited ? 'visitada' : 'a fazer'}`}
                className={cn(
                  'group flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-2 py-2 text-left transition-[background-color,color,box-shadow]',
                  active && 'bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)]',
                  reachable && !active && onStepClick && 'hover:bg-primary/7',
                  !reachable && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'relative grid size-8 shrink-0 place-items-center rounded-full border text-[11px] font-semibold transition-colors',
                    done && 'border-success/40 bg-success/12 text-success',
                    active && 'border-primary bg-primary text-primary-foreground shadow-sm',
                    visited && 'border-primary/35 bg-primary/5 text-primary',
                    !reachable && 'border-border bg-muted/50 text-muted-foreground/70',
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
                  {active ? (
                    <motion.span
                      layoutId="stepper-active-ring"
                      className="absolute -inset-1 rounded-full border border-primary/35"
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    />
                  ) : null}
                </span>
                <span
                  className={cn(
                    'hidden whitespace-nowrap text-[11px] font-medium leading-4 transition-colors sm:block',
                    active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span className="mx-0.5 h-px w-2 shrink-0 bg-border sm:w-3">
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
    </div>
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
