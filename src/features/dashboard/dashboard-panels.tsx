import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Truck, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ListSkeleton } from '@/components/shared/states'
import { Timeline } from '@/components/shared/timeline'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { currency, customerShort, dueLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order, TimelineEvent } from '@/types'

function Panel({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col rounded-lg border border-border bg-card shadow-xs', className)}>
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
        {action}
      </header>
      <div className="flex-1 p-3">{children}</div>
    </section>
  )
}

function OrderRow({ order, onOpen, right }: { order: Order; onOpen: () => void; right: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-primary/7"
    >
      <span className="tabular w-11 shrink-0 text-[12px] font-semibold text-muted-foreground">
        {order.code}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px]">
        {customerShort(order.customerName, order.customerKind)}
      </span>
      {right}
    </button>
  )
}

/* -------------------------------------------------------------------------- */

export function AttentionPanel({ loading }: { loading?: boolean }) {
  const orders = useDataStore((state) => state.orders)
  const invoices = useDataStore((state) => state.invoices)
  const openOrder = useUIStore((state) => state.openOrder)
  const navigate = useNavigate()

  const now = new Date()
  const late = orders.filter(
    (order) =>
      new Date(order.dueAt) < now && (order.status === 'recebido' || order.status === 'em-processo'),
  )
  const invoiceErrors = invoices.filter((invoice) => invoice.status === 'erro')

  const items = [
    {
      id: 'late',
      icon: Clock,
      tone: 'text-destructive bg-destructive/12',
      label: `${late.length} ${late.length === 1 ? 'OS atrasada' : 'OS atrasadas'}`,
      hint: 'Prazo de entrega vencido e ainda em produção',
      count: late.length,
      onClick: () => navigate('/atendimentos?atraso=1'),
    },
    {
      id: 'invoice',
      icon: AlertTriangle,
      tone: 'text-warning bg-warning/12',
      label: `${invoiceErrors.length} ${invoiceErrors.length === 1 ? 'nota rejeitada' : 'notas rejeitadas'}`,
      hint: 'NFS-e que precisam ser reenviadas',
      count: invoiceErrors.length,
      onClick: () => navigate('/notas-fiscais?status=erro'),
    },
  ].filter((item) => item.count > 0)

  return (
    <Panel title="Precisa de atenção" hint="Itens que travam a operação">
      {loading ? (
        <ListSkeleton rows={2} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <CheckCircle2 className="size-5 text-success" />
          <p className="text-[13px] font-medium">Nada pendente</p>
          <p className="text-[12px] text-muted-foreground">
            Nenhum atraso ou nota rejeitada no momento.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={item.onClick}
                  className="group flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-primary/7"
                >
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', item.tone)}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">{item.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {item.hint}
                    </span>
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

export function DeliveriesPanel({ loading }: { loading?: boolean }) {
  const orders = useDataStore((state) => state.orders)
  const openOrder = useUIStore((state) => state.openOrder)
  const navigate = useNavigate()

  const ready = orders
    .filter((order) => order.status === 'pronto')
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, 6)

  return (
    <Panel
      title="Aguardando retirada"
      hint="Peças prontas no balcão"
      action={
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-[12px]"
          onClick={() => navigate('/atendimentos?status=pronto')}
        >
          Ver todas
          <ArrowRight className="size-3" />
        </Button>
      }
    >
      {loading ? (
        <ListSkeleton rows={3} />
      ) : ready.length === 0 ? (
        <EmptyState compact icon={Truck} title="Nada aguardando retirada" />
      ) : (
        <ul className="space-y-0.5">
          {ready.map((order) => (
            <li key={order.id}>
              <OrderRow
                order={order}
                onOpen={() => openOrder(order.id)}
                right={
                  <>
                    <Badge variant="neutral" size="sm" className="tabular hidden sm:inline-flex">
                      {order.pickupCode}
                    </Badge>
                    <span className="tabular w-20 shrink-0 text-right text-[12px] text-muted-foreground">
                      {dueLabel(order.dueAt)}
                    </span>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function PendingPaymentsPanel({ loading }: { loading?: boolean }) {
  const orders = useDataStore((state) => state.orders)
  const openOrder = useUIStore((state) => state.openOrder)
  const navigate = useNavigate()

  const pending = orders
    .filter((order) => order.paymentStatus === 'pendente' && order.status !== 'cancelado')
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  const total = orders
    .filter((order) => order.paymentStatus === 'pendente' && order.status !== 'cancelado')
    .reduce((acc, order) => acc + order.total, 0)

  return (
    <Panel
      title="Pagamentos pendentes"
      hint={`${currency(total)} a receber`}
      action={
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-[12px]"
          onClick={() => navigate('/pagamentos?status=pendente')}
        >
          Ver todos
          <ArrowRight className="size-3" />
        </Button>
      }
    >
      {loading ? (
        <ListSkeleton rows={3} />
      ) : pending.length === 0 ? (
        <EmptyState compact icon={Wallet} title="Nenhuma pendência financeira" />
      ) : (
        <ul className="space-y-0.5">
          {pending.map((order) => (
            <li key={order.id}>
              <OrderRow
                order={order}
                onOpen={() => openOrder(order.id)}
                right={
                  <>
                    {order.customerKind === 'PJ' ? (
                      <Badge variant="info" size="sm" className="hidden sm:inline-flex">
                        Faturado
                      </Badge>
                    ) : null}
                    <span className="tabular w-20 shrink-0 text-right text-[13px] font-medium">
                      {currency(order.total)}
                    </span>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function ActivityPanel({ loading }: { loading?: boolean }) {
  const orders = useDataStore((state) => state.orders)

  const events: TimelineEvent[] = React.useMemo(() => {
    return orders
      .flatMap((order) =>
        order.timeline.map((item) => ({ ...item, title: `${item.title}`, orderCode: order.code })),
      )
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8)
  }, [orders])

  return (
    <Panel title="Atividade recente" hint="Últimos eventos da operação">
      {loading ? <ListSkeleton rows={4} /> : <Timeline events={events} />}
    </Panel>
  )
}
