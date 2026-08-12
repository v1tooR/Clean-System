import { Banknote, Clock3, CreditCard, QrCode, Landmark } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { PaymentMethod } from '@/types'

export type PaymentChoice = PaymentMethod | 'aberto'

interface Option {
  id: PaymentChoice
  label: string
  hint: string
  icon: LucideIcon
}

const options: Option[] = [
  { id: 'pix', label: 'Pix', hint: 'QR Code na hora', icon: QrCode },
  { id: 'debito', label: 'Débito', hint: 'Maquininha', icon: CreditCard },
  { id: 'credito', label: 'Crédito', hint: 'Maquininha', icon: CreditCard },
  { id: 'dinheiro', label: 'Dinheiro', hint: 'Espécie no caixa', icon: Banknote },
  { id: 'aberto', label: 'Deixar em aberto', hint: 'Cobrar na retirada', icon: Clock3 },
]

const companyOption: Option = {
  id: 'faturado',
  label: 'Faturar',
  hint: 'Entra no fechamento do cliente',
  icon: Landmark,
}

interface PaymentMethodSelectorProps {
  value: PaymentChoice | null
  onChange: (value: PaymentChoice) => void
  /** Clientes PJ com faturamento habilitado ganham a opção "Faturar". */
  allowBilling?: boolean
  className?: string
}

export function PaymentMethodSelector({
  value,
  onChange,
  allowBilling,
  className,
}: PaymentMethodSelectorProps) {
  const list = allowBilling ? [companyOption, ...options] : options

  return (
    <div className={cn('grid gap-2 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {list.map((option) => {
        const Icon = option.icon
        const active = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg border p-3 text-left shadow-xs transition-[transform,border-color,background-color,box-shadow] duration-150',
              active
                ? 'border-primary bg-primary/8 shadow-glow'
                : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card-elevated hover:shadow-md',
            )}
          >
            <span
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-md transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium">{option.label}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{option.hint}</span>
            </span>
            {active ? (
              <motion.span
                layoutId="payment-active"
                className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary/50"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
