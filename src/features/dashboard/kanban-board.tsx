import * as React from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { AnimatePresence, motion } from 'framer-motion'
import { Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { KanbanCard } from './kanban-card'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/states'
import { Skeleton } from '@/components/ui/misc'
import { orderStatusMeta } from '@/components/shared/status-badge'
import { useOrderStatusChange } from '@/features/orders/order-status-menu'
import { kanbanColumns } from '@/store/selectors'
import { currency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

interface KanbanBoardProps {
  orders: Order[]
  loading?: boolean
  onOpenOrder: (order: Order) => void
}

function Column({
  id,
  label,
  hint,
  orders,
  onOpenOrder,
}: {
  id: OrderStatus
  label: string
  hint: string
  orders: Order[]
  onOpenOrder: (order: Order) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const meta = orderStatusMeta[id]
  const total = orders.reduce((acc, order) => acc + order.total, 0)

  return (
    <div className="flex min-w-[268px] flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className={cn('size-1.5 rounded-full', meta.dot)} />
          <p className="text-[13px] font-semibold">{label}</p>
          <span className="tabular rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {orders.length}
          </span>
        </div>
        <span className="tabular text-[11px] text-muted-foreground">{currency(total)}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[180px] flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors',
          isOver ? 'border-primary/60 bg-primary/5' : 'border-border/70 bg-card/30',
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <KanbanCard order={order} onOpen={onOpenOrder} />
            </motion.div>
          ))}
        </AnimatePresence>

        {orders.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-6 text-center">
            <Inbox className="size-4 text-muted-foreground/60" />
            <p className="text-[12px] text-muted-foreground">{hint}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function KanbanBoard({ orders, loading, onOpenOrder }: KanbanBoardProps) {
  const changeStatus = useOrderStatusChange()
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [pendingMove, setPendingMove] = React.useState<{ order: Order; status: OrderStatus } | null>(
    null,
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const grouped = React.useMemo(() => {
    const map: Record<string, Order[]> = {}
    kanbanColumns.forEach((column) => {
      map[column.id] = orders
        .filter((order) => order.status === column.id)
        .sort((a, b) => {
          if (a.priority !== b.priority) return a.priority ? -1 : 1
          return a.dueAt.localeCompare(b.dueAt)
        })
    })
    return map
  }, [orders])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const status = over.id as OrderStatus
    const order = orders.find((item) => item.id === active.id)
    if (!order || order.status === status) return

    // Entregar com pagamento pendente exige confirmação explícita.
    if (status === 'entregue' && order.paymentStatus === 'pendente') {
      setPendingMove({ order, status })
      return
    }

    changeStatus(order, status)
  }

  const activeOrder = orders.find((order) => order.id === activeId) ?? null

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {kanbanColumns.map((column) => (
          <div key={column.id} className="min-w-[268px] flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[104px] w-full rounded-lg" />
            <Skeleton className="h-[104px] w-full rounded-lg" />
            <Skeleton className="h-[104px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nenhum atendimento em andamento"
        description="Assim que uma OS for registrada, ela aparece aqui para acompanhamento da produção."
      />
    )
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {kanbanColumns.map((column) => (
            <Column
              key={column.id}
              id={column.id}
              label={column.label}
              hint={column.hint}
              orders={grouped[column.id] ?? []}
              onOpenOrder={onOpenOrder}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
          {activeOrder ? <KanbanCard order={activeOrder} onOpen={() => {}} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <ConfirmDialog
        open={!!pendingMove}
        onOpenChange={(value) => !value && setPendingMove(null)}
        title="Entregar com pagamento pendente?"
        description={
          pendingMove ? (
            <>
              A OS {pendingMove.order.code} de {pendingMove.order.customerName} ainda tem{' '}
              <strong className="text-foreground">{currency(pendingMove.order.total)}</strong> em
              aberto. Confirme apenas se o valor será cobrado depois.
            </>
          ) : null
        }
        confirmLabel="Entregar mesmo assim"
        onConfirm={() => {
          if (!pendingMove) return
          changeStatus(pendingMove.order, pendingMove.status)
          toast.warning('Entrega registrada com pendência financeira', {
            description: `OS ${pendingMove.order.code} segue como pagamento pendente.`,
          })
          setPendingMove(null)
        }}
      />
    </>
  )
}
