import * as React from 'react'
import { Building2, CheckCircle2, FileText, Landmark, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard } from '@/components/shared/metric-card'
import { EmptyState, ListSkeleton } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/status-badge'
import { usePageHeader } from '@/components/layout/header-slot'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { openCycles, type OpenCycle } from '@/store/selectors'
import { useSimulatedLoading } from '@/hooks'
import { downloadFile, toCSV } from '@/services/fiscal.service'
import { currency, dateShort, dateTime } from '@/lib/format'
import { sum } from '@/lib/utils'

export function BillingPage() {
  const customers = useDataStore((state) => state.customers)
  const orders = useDataStore((state) => state.orders)
  const cycles = useDataStore((state) => state.billingCycles)
  const closeBillingCycle = useDataStore((state) => state.closeBillingCycle)
  const markCycleAsPaid = useDataStore((state) => state.markCycleAsPaid)
  const openOrder = useUIStore((state) => state.openOrder)
  const openCustomer = useUIStore((state) => state.openCustomer)
  const loading = useSimulatedLoading(430)

  const [preview, setPreview] = React.useState<OpenCycle | null>(null)
  const [closing, setClosing] = React.useState(false)

  const open = React.useMemo(() => openCycles(customers, orders), [customers, orders])
  const totalOpen = sum(open.map((cycle) => cycle.total))
  const companies = customers.filter((customer) => customer.kind === 'PJ' && customer.active).length
  const closedTotal = sum(
    cycles.filter((cycle) => cycle.status !== 'pago').map((cycle) => cycle.total),
  )

  usePageHeader(
    { title: 'Faturamento', description: 'Fechamentos de clientes empresariais' },
    [],
  )

  function confirmClose() {
    if (!preview) return
    setClosing(true)
    const record = closeBillingCycle({
      customerId: preview.customer.id,
      customerName:
        preview.customer.kind === 'PJ' ? preview.customer.tradeName : preview.customer.name,
      periodStart: preview.periodStart,
      periodEnd: preview.periodEnd,
      orderIds: preview.orders.map((order) => order.id),
      ordersCount: preview.orders.length,
      amount: preview.amount,
      discount: preview.discount,
      total: preview.total,
      status: 'fechado',
      closedAt: new Date().toISOString(),
      dueAt: new Date().toISOString(),
    })

    toast.success('Fechamento gerado', {
      description: `${record.ordersCount} atendimentos · ${currency(record.total)}`,
      action: {
        label: 'Exportar',
        onClick: () => exportCycleOrders(preview),
      },
    })
    setClosing(false)
    setPreview(null)
  }

  function exportCycleOrders(cycle: OpenCycle) {
    const csv = toCSV(
      cycle.orders.map((order) => ({
        OS: order.code,
        Data: dateShort(order.createdAt),
        Pecas: order.items.reduce((acc, item) => acc + item.quantity, 0),
        Subtotal: order.subtotal.toFixed(2).replace('.', ','),
        Desconto: order.discount.toFixed(2).replace('.', ','),
        Total: order.total.toFixed(2).replace('.', ','),
      })),
    )
    downloadFile(
      `fechamento-${cycle.customer.kind === 'PJ' ? cycle.customer.tradeName : cycle.customer.name}.csv`
        .toLowerCase()
        .replace(/\s+/g, '-'),
      csv,
      'text/csv;charset=utf-8',
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          loading={loading}
          label="Empresas ativas"
          value={String(companies)}
          icon={Building2}
          tone="info"
          hint="Clientes com faturamento habilitado"
        />
        <MetricCard
          loading={loading}
          label="Acumulado em aberto"
          value={currency(totalOpen)}
          icon={Landmark}
          tone="warning"
          hint={`${open.length} ciclos aguardando fechamento`}
        />
        <MetricCard
          loading={loading}
          label="Fechado a receber"
          value={currency(closedTotal)}
          icon={FileText}
          hint="Fechamentos gerados e não pagos"
        />
      </div>

      <Tabs defaultValue="abertos">
        <TabsList>
          <TabsTrigger value="abertos">Em aberto ({open.length})</TabsTrigger>
          <TabsTrigger value="fechados">Fechamentos ({cycles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="abertos">
          {loading ? (
            <ListSkeleton rows={3} />
          ) : open.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="Nenhum acúmulo em aberto"
              description="Assim que uma empresa com faturamento habilitado registrar atendimentos, o ciclo aparece aqui."
            />
          ) : (
            <div className="space-y-3">
              {open.map((cycle) => {
                const company = cycle.customer
                if (company.kind !== 'PJ') return null

                return (
                  <section
                    key={company.id}
                    className="overflow-hidden rounded-lg border border-border bg-card"
                  >
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openCustomer(company.id)}
                        className="flex min-w-0 items-center gap-3 text-left"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-info/12 text-info">
                          <Building2 className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold">
                            {company.tradeName}
                          </span>
                          <span className="tabular block truncate text-[11px] text-muted-foreground">
                            {company.cnpj} · ciclo {company.billing.cycle} · vence dia{' '}
                            {company.billing.dueDay}
                          </span>
                        </span>
                      </button>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="tabular text-[17px] font-semibold">
                            {currency(cycle.total)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {cycle.orders.length} atendimentos
                          </p>
                        </div>
                        <Button size="sm" onClick={() => setPreview(cycle)}>
                          Gerar fechamento
                        </Button>
                      </div>
                    </header>

                    <ul className="divide-y divide-border/70">
                      {cycle.orders.slice(0, 4).map((order) => (
                        <li key={order.id}>
                          <button
                            type="button"
                            onClick={() => openOrder(order.id)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/40"
                          >
                            <span className="tabular w-12 text-[12px] font-semibold text-muted-foreground">
                              {order.code}
                            </span>
                            <span className="tabular w-24 text-[12px] text-muted-foreground">
                              {dateShort(order.createdAt)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
                              {order.items.reduce((acc, item) => acc + item.quantity, 0)} peças ·{' '}
                              {order.items[0]?.serviceName}
                            </span>
                            <span className="tabular text-[13px]">{currency(order.total)}</span>
                          </button>
                        </li>
                      ))}
                      {cycle.orders.length > 4 ? (
                        <li className="px-4 py-2 text-[12px] text-muted-foreground">
                          + {cycle.orders.length - 4} atendimentos no período
                        </li>
                      ) : null}
                    </ul>
                  </section>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fechados">
          {loading ? (
            <ListSkeleton rows={3} />
          ) : cycles.length === 0 ? (
            <EmptyState icon={FileText} title="Nenhum fechamento gerado" />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <ul className="divide-y divide-border/70">
                {cycles.map((cycle) => (
                  <li key={cycle.id} className="flex flex-wrap items-center gap-3 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{cycle.customerName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {dateShort(cycle.periodStart)} — {dateShort(cycle.periodEnd)} ·{' '}
                        {cycle.ordersCount} atendimentos
                        {cycle.closedAt ? ` · fechado em ${dateTime(cycle.closedAt)}` : ''}
                      </p>
                    </div>
                    <StatusBadge kind="billing" status={cycle.status} size="sm" />
                    <span className="tabular w-28 text-right text-[14px] font-semibold">
                      {currency(cycle.total)}
                    </span>
                    {cycle.status === 'fechado' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          markCycleAsPaid(cycle.id)
                          toast.success('Fechamento baixado', {
                            description: `${cycle.customerName} · ${currency(cycle.total)}`,
                          })
                        }}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Marcar como pago
                      </Button>
                    ) : (
                      <Badge variant="success" size="sm">
                        Quitado
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Resumo consolidado antes da confirmação */}
      <Dialog open={!!preview} onOpenChange={(value) => !value && setPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerar fechamento</DialogTitle>
            <DialogDescription>
              Confira o consolidado antes de fechar o período do cliente.
            </DialogDescription>
          </DialogHeader>

          {preview ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-[13px] font-semibold">
                  {preview.customer.kind === 'PJ' ? preview.customer.tradeName : preview.customer.name}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  Período de {dateShort(preview.periodStart)} a {dateShort(preview.periodEnd)}
                </p>

                <Separator className="my-3" />

                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atendimentos</span>
                    <span className="tabular">{preview.orders.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peças</span>
                    <span className="tabular">
                      {preview.orders.reduce(
                        (acc, order) =>
                          acc + order.items.reduce((sum, item) => sum + item.quantity, 0),
                        0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular">{currency(preview.amount)}</span>
                  </div>
                  {preview.discount > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desconto contratual</span>
                      <span className="tabular text-success">− {currency(preview.discount)}</span>
                    </div>
                  ) : null}
                </div>

                <Separator className="my-3" />

                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-medium">Total do fechamento</span>
                  <span className="tabular text-[24px] font-semibold tracking-tight">
                    {currency(preview.total)}
                  </span>
                </div>
              </div>

              <p className="text-[12px] text-muted-foreground">
                Ao confirmar, os atendimentos deixam a lista de acúmulo e passam a integrar este
                fechamento. A cobrança pode ser enviada à empresa com o CSV consolidado.
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => preview && exportCycleOrders(preview)}
            >
              <Receipt className="size-4" />
              Exportar CSV
            </Button>
            <Button onClick={confirmClose} loading={closing}>
              Confirmar fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
