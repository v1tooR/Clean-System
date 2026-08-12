import * as React from 'react'
import { format } from 'date-fns'
import { CalendarDays, Check, ChevronDown, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { periodLabels, rangeFromPreset } from '@/store/selectors'
import { dateShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DateRange, PeriodPreset } from '@/types'

/* ------------------------------- Container -------------------------------- */

export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* --------------------------- Seletor de período --------------------------- */

const presets: PeriodPreset[] = ['hoje', '7d', '30d', 'mes']

interface PeriodFilterProps {
  preset: PeriodPreset
  range: DateRange
  onChange: (preset: PeriodPreset, range: DateRange) => void
  align?: 'start' | 'end'
}

export function PeriodFilter({ preset, range, onChange, align = 'start' }: PeriodFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [customFrom, setCustomFrom] = React.useState(format(range.from, 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = React.useState(format(range.to, 'yyyy-MM-dd'))
  const customFromId = React.useId()
  const customToId = React.useId()
  const customInvalid = !customFrom || !customTo || customFrom > customTo

  const label =
    preset === 'custom'
      ? `${dateShort(range.from)} — ${dateShort(range.to)}`
      : periodLabels[preset]

  function applyCustom() {
    const from = new Date(`${customFrom}T00:00:00`)
    const to = new Date(`${customTo}T23:59:59`)
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return
    onChange('custom', { from, to })
    setOpen(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setCustomFrom(format(range.from, 'yyyy-MM-dd'))
      setCustomTo(format(range.to, 'yyyy-MM-dd'))
    }
    setOpen(nextOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-normal">
          <CalendarDays className="size-3.5 text-muted-foreground" />
          <span className="max-w-[190px] truncate">{label}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[360px] max-w-[calc(100vw-1rem)] p-2.5">
        <div className="space-y-0.5">
          {presets.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onChange(item, rangeFromPreset(item))
                setOpen(false)
              }}
              className={cn(
                'flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2.5 text-[13px] transition-colors hover:bg-accent',
                preset === item && 'bg-accent/60 font-medium',
              )}
            >
              {periodLabels[item]}
              {preset === item ? <Check className="size-3.5 text-primary" /> : null}
            </button>
          ))}
        </div>

        <Separator className="my-2" />

        <div className="space-y-2 px-1 pb-1">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Período personalizado
          </Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="min-w-0 space-y-1">
              <Label htmlFor={customFromId} className="text-[10px] text-muted-foreground">
                De
              </Label>
              <Input
                id={customFromId}
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="min-w-0 px-2 text-[12px]"
              />
            </div>
            <div className="min-w-0 space-y-1">
              <Label htmlFor={customToId} className="text-[10px] text-muted-foreground">
                At&eacute;
              </Label>
              <Input
                id={customToId}
                type="date"
                value={customTo}
                min={customFrom}
                onChange={(event) => setCustomTo(event.target.value)}
                className="min-w-0 px-2 text-[12px]"
              />
            </div>
          </div>
          {customFrom && customTo && customFrom > customTo ? (
            <p className="rounded-md bg-warning/10 px-3 py-2 text-[12px] font-medium text-warning" role="alert">
              A data inicial deve ser anterior à data final.
            </p>
          ) : null}
          <Button size="sm" className="w-full" onClick={applyCustom} disabled={customInvalid}>
            Aplicar período
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------ Multi-seleção ----------------------------- */

export interface FilterOption {
  value: string
  label: string
  hint?: string
}

interface FilterSelectProps {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
  icon?: React.ReactNode
}

export function FilterSelect({ label, options, selected, onChange, icon }: FilterSelectProps) {
  const [open, setOpen] = React.useState(false)

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2 font-normal', selected.length > 0 && 'border-primary/40 bg-primary/8')}
        >
          {icon ?? <Filter className="size-3.5 text-muted-foreground" />}
          {label}
          {selected.length > 0 ? (
            <Badge variant="default" size="sm" className="ml-0.5 px-1.5">
              {selected.length}
            </Badge>
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-2">
        <div className="space-y-0.5">
          {options.map((option) => {
            const checked = selected.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-accent"
              >
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-items-center rounded-[5px] border transition-colors',
                    checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                  )}
                >
                  {checked ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className="flex-1 truncate">{option.label}</span>
                {option.hint ? (
                  <span className="tabular text-[11px] text-muted-foreground">{option.hint}</span>
                ) : null}
              </button>
            )
          })}
        </div>
        {selected.length > 0 ? (
          <>
            <Separator className="my-2" />
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange([])}>
              Limpar seleção
            </Button>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

/* ----------------------------- Chips ativos ------------------------------ */

export interface ActiveFilterChip {
  id: string
  label: string
  onRemove: () => void
}

export function ActiveFilters({
  chips,
  onClearAll,
}: {
  chips: ActiveFilterChip[]
  onClearAll: () => void
}) {
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border bg-muted/50 py-2 pl-3 pr-2 text-[12px] text-muted-foreground transition-colors hover:border-destructive/40 hover:text-foreground"
        >
          {chip.label}
          <X className="size-3 transition-colors group-hover:text-destructive" />
        </button>
      ))}
      <Button variant="ghost" size="sm" className="px-3 text-[12px]" onClick={onClearAll}>
        Limpar tudo
      </Button>
    </div>
  )
}
