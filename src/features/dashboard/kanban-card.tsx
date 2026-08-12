import * as React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { AlertTriangle, GripVertical, Package, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { OrderStatusMenu } from '@/features/orders/order-status-menu'
import { currency, customerShort, dueLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order } from '@/types'

interface KanbanCardProps {
  order: Order
  onOpen: (order: Order) => void
  overlay?: boolean
}

export function KanbanCard({ order, onOpen, overlay }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { status: order.status },
  })

  const pieces = order.items.reduce((acc, item) => acc + item.quantity, 0)
  const late = new Date(order.dueAt) < new Date() && order.status !== 'entregue'

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      className={cn(
        'group relative rounded-lg border border-border bg-card p-3 shadow-xs transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md',
        isDragging && 'opacity-40',
        overlay && 'rotate-1 border-primary/50 shadow-lg',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          aria-label={`Arrastar OS ${order.code}`}
          className="mt-0.5 hidden cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 transition-colors hover:bg-primary/10 hover:text-primary active:cursor-grabbing md:block"
        >
          <GripVertical className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onOpen(order)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-1.5">
            <span className="tabular text-[13px] font-semibold">OS {order.code}</span>
            {order.priority ? <Star className="size-3 fill-warning text-warning" /> : null}
            {late ? <AlertTriangle className="size-3 text-destructive" /> : null}
          </div>
          <p className="truncate text-[12px] text-muted-foreground">
            {customerShort(order.customerName, order.customerKind)}
          </p>
        </button>

        <OrderStatusMenu order={order} variant="icon" />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 pl-0 md:pl-5">
        <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
          <Package className="size-3.5" />
          {pieces} {pieces === 1 ? 'peça' : 'peças'}
        </span>
        <span className="tabular text-[13px] font-medium">{currency(order.total)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 pl-0 md:pl-5">
        <StatusBadge kind="payment" status={order.paymentStatus} size="sm" showIcon={false} />
        {order.status !== 'entregue' ? (
          <Badge variant={late ? 'destructive' : 'neutral'} size="sm">
            {dueLabel(order.dueAt)}
          </Badge>
        ) : (
          <span className="text-[11px] text-muted-foreground">{order.pickupCode}</span>
        )}
      </div>
    </div>
  )
}
