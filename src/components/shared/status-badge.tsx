import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileX2,
  Loader2,
  PackageCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BillingStatus, InvoiceStatus, OrderStatus, PaymentMethod, PaymentStatus } from '@/types'

type Variant = NonNullable<BadgeProps['variant']>

interface StatusMeta {
  label: string
  variant: Variant
  icon: LucideIcon
  /** Cor sólida usada em pontos, barras e colunas do Kanban */
  dot: string
}

export const orderStatusMeta: Record<OrderStatus, StatusMeta> = {
  recebido: { label: 'Recebido', variant: 'info', icon: PackageCheck, dot: 'bg-info' },
  'em-processo': { label: 'Em processo', variant: 'warning', icon: Sparkles, dot: 'bg-warning' },
  pronto: { label: 'Pronto', variant: 'default', icon: Clock, dot: 'bg-primary' },
  entregue: { label: 'Entregue', variant: 'success', icon: Truck, dot: 'bg-success' },
  cancelado: { label: 'Cancelado', variant: 'neutral', icon: Ban, dot: 'bg-muted-foreground' },
}

export const paymentStatusMeta: Record<PaymentStatus, StatusMeta> = {
  pago: { label: 'Pago', variant: 'success', icon: CheckCircle2, dot: 'bg-success' },
  pendente: { label: 'Pendente', variant: 'warning', icon: Clock, dot: 'bg-warning' },
  cancelado: { label: 'Cancelado', variant: 'neutral', icon: Ban, dot: 'bg-muted-foreground' },
}

export const invoiceStatusMeta: Record<InvoiceStatus, StatusMeta> = {
  'nao-emitida': { label: 'Não emitida', variant: 'neutral', icon: FileX2, dot: 'bg-muted-foreground' },
  processando: { label: 'Processando', variant: 'info', icon: Loader2, dot: 'bg-info' },
  autorizada: { label: 'Autorizada', variant: 'success', icon: FileCheck2, dot: 'bg-success' },
  erro: { label: 'Erro', variant: 'destructive', icon: AlertTriangle, dot: 'bg-destructive' },
  cancelada: { label: 'Cancelada', variant: 'neutral', icon: Ban, dot: 'bg-muted-foreground' },
}

export const billingStatusMeta: Record<BillingStatus, StatusMeta> = {
  aberto: { label: 'Em aberto', variant: 'info', icon: Clock, dot: 'bg-info' },
  fechado: { label: 'Fechado', variant: 'warning', icon: FileCheck2, dot: 'bg-warning' },
  pago: { label: 'Pago', variant: 'success', icon: CheckCircle2, dot: 'bg-success' },
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  dinheiro: 'Dinheiro',
  faturado: 'Faturado',
}

type StatusBadgeProps = {
  className?: string
  showIcon?: boolean
  size?: BadgeProps['size']
} & (
  | { kind: 'order'; status: OrderStatus }
  | { kind: 'payment'; status: PaymentStatus }
  | { kind: 'invoice'; status: InvoiceStatus }
  | { kind: 'billing'; status: BillingStatus }
)

function metaFor(props: StatusBadgeProps): StatusMeta {
  switch (props.kind) {
    case 'order':
      return orderStatusMeta[props.status]
    case 'payment':
      return paymentStatusMeta[props.status]
    case 'invoice':
      return invoiceStatusMeta[props.status]
    case 'billing':
      return billingStatusMeta[props.status]
  }
}

export function StatusBadge(props: StatusBadgeProps) {
  const meta = metaFor(props)
  const Icon = meta.icon
  const spinning = props.kind === 'invoice' && props.status === 'processando'

  return (
    <Badge variant={meta.variant} size={props.size} className={cn('gap-1.5', props.className)}>
      {props.showIcon === false ? null : (
        <Icon className={cn('size-3', spinning && 'animate-spin')} />
      )}
      {meta.label}
    </Badge>
  )
}

export function StatusDot({ className }: { className?: string }) {
  return <span className={cn('inline-block size-1.5 rounded-full', className)} />
}
