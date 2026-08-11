import * as React from 'react'
import { toast } from 'sonner'
import { ArrowRight, Ban, ChevronDown, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { orderStatusMeta } from '@/components/shared/status-badge'
import { useDataStore } from '@/store/data-store'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

const flow: OrderStatus[] = ['recebido', 'em-processo', 'pronto', 'entregue']

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const index = flow.indexOf(status)
  if (index === -1 || index === flow.length - 1) return null
  return flow[index + 1]
}

export function useOrderStatusChange() {
  const setOrderStatus = useDataStore((state) => state.setOrderStatus)

  return React.useCallback(
    (order: Order, status: OrderStatus) => {
      const previous = order.status
      setOrderStatus(order.id, status)
      toast.success(`OS ${order.code} · ${orderStatusMeta[status].label}`, {
        description:
          status === 'pronto'
            ? `Avise o cliente — código de retirada ${order.pickupCode}.`
            : status === 'entregue'
              ? 'Atendimento concluído e removido da fila.'
              : `Movido de ${orderStatusMeta[previous].label.toLowerCase()}.`,
        action: {
          label: 'Desfazer',
          onClick: () => {
            setOrderStatus(order.id, previous)
            toast.info(`OS ${order.code} voltou para ${orderStatusMeta[previous].label}`)
          },
        },
      })
    },
    [setOrderStatus],
  )
}

interface OrderStatusMenuProps {
  order: Order
  variant?: 'button' | 'icon'
  align?: 'start' | 'end'
  className?: string
}

/** Alternativa ao drag-and-drop: alterar situação por menu, em qualquer lugar. */
export function OrderStatusMenu({
  order,
  variant = 'button',
  align = 'end',
  className,
}: OrderStatusMenuProps) {
  const changeStatus = useOrderStatusChange()
  const cancelOrder = useDataStore((state) => state.cancelOrder)
  const [confirmCancel, setConfirmCancel] = React.useState(false)
  const advance = nextStatus(order.status)

  return (
    <>
      <div className={cn('flex items-center gap-1.5', className)}>
        {variant === 'button' && advance && order.status !== 'cancelado' ? (
          <Button size="sm" className="gap-1.5" onClick={() => changeStatus(order, advance)}>
            {orderStatusMeta[advance].label}
            <ArrowRight className="size-3.5" />
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {variant === 'button' ? (
              <Button variant="outline" size="sm" className="gap-1.5">
                Situação
                <ChevronDown className="size-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Ações do atendimento"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={align}
            className="w-52"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuLabel>Mover para</DropdownMenuLabel>
            {flow.map((status) => {
              const meta = orderStatusMeta[status]
              const Icon = meta.icon
              return (
                <DropdownMenuItem
                  key={status}
                  disabled={order.status === status}
                  onSelect={() => changeStatus(order, status)}
                >
                  <Icon />
                  {meta.label}
                  {order.status === status ? (
                    <span className="ml-auto text-[11px] text-muted-foreground">atual</span>
                  ) : null}
                </DropdownMenuItem>
              )
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              disabled={order.status === 'cancelado'}
              onSelect={() => setConfirmCancel(true)}
            >
              <Ban />
              Cancelar atendimento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        destructive
        icon={Ban}
        title={`Cancelar a OS ${order.code}?`}
        description={
          <>
            O atendimento sai da fila de produção e as pendências financeiras são canceladas. Esta
            ação fica registrada no histórico da OS.
          </>
        }
        confirmLabel="Cancelar OS"
        cancelLabel="Voltar"
        onConfirm={() => {
          cancelOrder(order.id, 'Cancelado pelo atendente no balcão')
          toast.success(`OS ${order.code} cancelada`)
        }}
      />
    </>
  )
}
