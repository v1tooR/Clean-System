import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, LayoutDashboard, Plus, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, paymentMethodLabels } from '@/components/shared/status-badge'
import { useUIStore } from '@/store/ui-store'
import { useDataStore } from '@/store/data-store'
import { currency, dueLabel } from '@/lib/format'
import type { NewOrderFlow } from '../use-new-order'

export function StepDone({ flow }: { flow: NewOrderFlow }) {
  const navigate = useNavigate()
  const openOrder = useUIStore((state) => state.openOrder)
  const orders = useDataStore((state) => state.orders)
  const order = orders.find((item) => item.id === flow.createdOrder?.id) ?? flow.createdOrder

  if (!order) return null

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="grid size-16 place-items-center rounded-full bg-success/15 text-success"
      >
        <Check className="size-8" strokeWidth={3} />
      </motion.span>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.25 }}
        className="mt-4 space-y-1"
      >
        <h2 className="text-lg font-semibold tracking-tight">Atendimento registrado</h2>
        <p className="text-[13px] text-muted-foreground">
          A OS {order.code} entrou na fila de produção e já aparece no dashboard.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.25 }}
        className="mt-6 w-full max-w-md rounded-lg border border-border bg-card p-4 text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="tabular text-[15px] font-semibold">OS {order.code}</p>
            <p className="text-[12px] text-muted-foreground">{order.customerName}</p>
          </div>
          <StatusBadge kind="order" status={order.status} />
        </div>

        <dl className="mt-4 space-y-2 text-[13px]">
          <Row label="Peças" value={`${order.items.reduce((a, b) => a + b.quantity, 0)}`} />
          <Row
            label="Pagamento"
            value={
              <span className="flex items-center gap-1.5">
                {order.paymentMethod ? paymentMethodLabels[order.paymentMethod] : '—'}
                <StatusBadge kind="payment" status={order.paymentStatus} size="sm" showIcon={false} />
              </span>
            }
          />
          <Row label="Nota fiscal" value={<StatusBadge kind="invoice" status={order.invoiceStatus} size="sm" />} />
          <Row label="Previsão" value={dueLabel(order.dueAt)} />
          <Row
            label="Retirada"
            value={
              <Badge variant="neutral" className="tabular">
                {order.pickupCode}
              </Badge>
            }
          />
        </dl>

        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-[13px] font-medium">Total</span>
          <span className="tabular text-[22px] font-semibold tracking-tight">
            {currency(order.total)}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.24 }}
        className="mt-6 flex flex-wrap justify-center gap-2"
      >
        <Button className="gap-2" onClick={() => flow.reset()}>
          <Plus className="size-4" />
          Novo atendimento
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            navigate('/atendimentos')
            openOrder(order.id)
          }}
        >
          <Receipt className="size-4" />
          Ver OS
          <ArrowRight className="size-3.5" />
        </Button>
        <Button variant="ghost" className="gap-2" onClick={() => navigate('/')}>
          <LayoutDashboard className="size-4" />
          Ir para o dashboard
        </Button>
      </motion.div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}
