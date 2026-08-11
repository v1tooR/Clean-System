import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/shared/metric-card'
import { KanbanBoard } from './kanban-board'
import {
  ActivityPanel,
  AttentionPanel,
  DeliveriesPanel,
  PendingPaymentsPanel,
} from './dashboard-panels'
import { usePageHeader } from '@/components/layout/header-slot'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { dashboardMetrics, kanbanOrders } from '@/store/selectors'
import { useSimulatedLoading } from '@/hooks'
import { currency, dateLong, number } from '@/lib/format'

function trendPercent(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function DashboardPage() {
  const orders = useDataStore((state) => state.orders)
  const openOrder = useUIStore((state) => state.openOrder)
  const navigate = useNavigate()
  const loading = useSimulatedLoading(500)

  const metrics = React.useMemo(() => dashboardMetrics(orders), [orders])
  const board = React.useMemo(() => kanbanOrders(orders), [orders])

  usePageHeader(
    {
      title: 'Dashboard',
      description: 'Visão geral da operação de hoje',
      actions: (
        <Button className="gap-2" onClick={() => navigate('/atendimentos/novo')}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Novo atendimento</span>
        </Button>
      ),
    },
    [],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13px] text-muted-foreground first-letter:uppercase">
          {dateLong(new Date())}
        </p>
        <p className="text-[12px] text-muted-foreground">
          {number(metrics.ordersInProcess)} atendimentos em aberto ·{' '}
          {number(metrics.readyForPickup)} aguardando retirada
        </p>
      </div>

      {/* Indicadores */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          loading={loading}
          label="Atendimentos hoje"
          value={number(metrics.ordersToday)}
          icon={Receipt}
          trend={{
            value: trendPercent(metrics.ordersToday, metrics.ordersYesterday),
            label: `${number(metrics.ordersYesterday)} ontem`,
          }}
          onClick={() => navigate('/atendimentos')}
        />
        <MetricCard
          loading={loading}
          label="Peças em processo"
          value={number(metrics.piecesInProcess)}
          icon={Package}
          tone="warning"
          hint={`${number(metrics.ordersInProcess)} OS na produção`}
        />
        <MetricCard
          loading={loading}
          label="Recebido hoje"
          value={currency(metrics.receivedToday)}
          icon={TrendingUp}
          tone="success"
          trend={{
            value: trendPercent(metrics.receivedToday, metrics.receivedYesterday),
            label: `${currency(metrics.receivedYesterday)} ontem`,
          }}
          onClick={() => navigate('/pagamentos')}
        />
        <MetricCard
          loading={loading}
          label="A receber"
          value={currency(metrics.receivable)}
          icon={Wallet}
          tone={metrics.receivable > 0 ? 'destructive' : 'success'}
          hint={`${number(metrics.receivableCount)} atendimentos em aberto`}
          onClick={() => navigate('/pagamentos?status=pendente')}
        />
      </div>

      {/* Kanban operacional */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">Fluxo da operação</h2>
            <p className="text-[12px] text-muted-foreground">
              Arraste um cartão entre as colunas ou use o menu de ações para mudar a situação.
            </p>
          </div>
        </div>

        <KanbanBoard
          orders={board}
          loading={loading}
          onOpenOrder={(order) => openOrder(order.id)}
        />
      </section>

      {/* Painéis de apoio */}
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <AttentionPanel loading={loading} />
        <DeliveriesPanel loading={loading} />
        <PendingPaymentsPanel loading={loading} />
        <div className="lg:col-span-2 xl:col-span-3">
          <ActivityPanel loading={loading} />
        </div>
      </div>
    </div>
  )
}
