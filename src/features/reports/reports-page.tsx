import * as React from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Package, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MetricCard } from '@/components/shared/metric-card'
import { PeriodFilter } from '@/components/shared/filter-bar'
import { EmptyState } from '@/components/shared/states'
import { Skeleton } from '@/components/ui/misc'
import { paymentMethodLabels } from '@/components/shared/status-badge'
import { usePageHeader } from '@/components/layout/header-slot'
import { useDataStore } from '@/store/data-store'
import {
  inRange,
  rangeFromPreset,
  revenueByDay,
  revenueByMethod,
  topGarments,
  topServices,
} from '@/store/selectors'
import { useSimulatedLoading } from '@/hooks'
import { downloadFile, toCSV } from '@/services/fiscal.service'
import { currency, dateShort, number, percent } from '@/lib/format'
import { sum } from '@/lib/utils'
import type { DateRange, PeriodPreset } from '@/types'

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

function ChartCard({
  title,
  hint,
  children,
  action,
  loading,
}: {
  title: string
  hint?: string
  children: React.ReactNode
  action?: React.ReactNode
  loading?: boolean
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold">{title}</h2>
          {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
        {action}
      </header>
      <div className="p-4">{loading ? <Skeleton className="h-[240px] w-full" /> : children}</div>
    </section>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="tabular flex items-center gap-2 text-[12px]">
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {typeof entry.value === 'number' && entry.name !== 'Atendimentos'
              ? currency(entry.value)
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  )
}

export function ReportsPage() {
  const orders = useDataStore((state) => state.orders)
  const loading = useSimulatedLoading(520)

  const [preset, setPreset] = React.useState<PeriodPreset>('30d')
  const [range, setRange] = React.useState<DateRange>(() => rangeFromPreset('30d'))

  const scoped = React.useMemo(
    () => orders.filter((order) => inRange(order.createdAt, range) && order.status !== 'cancelado'),
    [orders, range],
  )

  const revenue = sum(scoped.map((order) => order.total))
  const received = sum(scoped.filter((o) => o.paymentStatus === 'pago').map((o) => o.total))
  const pending = sum(scoped.filter((o) => o.paymentStatus === 'pendente').map((o) => o.total))
  const pieces = sum(
    scoped.map((order) => order.items.reduce((acc, item) => acc + item.quantity, 0)),
  )
  const ticket = scoped.length > 0 ? revenue / scoped.length : 0

  const daily = React.useMemo(() => revenueByDay(orders, range), [orders, range])
  const byMethod = React.useMemo(() => revenueByMethod(orders, range), [orders, range])
  const garmentsRanking = React.useMemo(() => topGarments(orders, range), [orders, range])
  const servicesRanking = React.useMemo(() => topServices(orders, range), [orders, range])

  const dailyChart = daily.map((entry) => ({
    ...entry,
    label: format(entry.date, 'dd/MM', { locale: ptBR }),
  }))

  usePageHeader(
    {
      title: 'Relatórios',
      description: 'Indicadores do período selecionado',
      actions: (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Enviar para a contadora</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => {
                const csv = toCSV(
                  scoped.map((order) => ({
                    OS: order.code,
                    Data: dateShort(order.createdAt),
                    Cliente: order.customerName,
                    Tipo: order.customerKind,
                    Pecas: order.items.reduce((acc, item) => acc + item.quantity, 0),
                    Subtotal: order.subtotal.toFixed(2).replace('.', ','),
                    Desconto: order.discount.toFixed(2).replace('.', ','),
                    Total: order.total.toFixed(2).replace('.', ','),
                    Pagamento: order.paymentMethod ?? '',
                    Situacao: order.paymentStatus,
                    NFSe: order.invoiceStatus,
                  })),
                )
                downloadFile('relatorio-atendimentos.csv', csv, 'text/csv;charset=utf-8')
                toast.success('Relatório exportado', {
                  description: 'relatorio-atendimentos.csv com os atendimentos do período.',
                })
              }}
            >
              Atendimentos (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                const csv = toCSV(
                  daily.map((entry) => ({
                    Data: dateShort(entry.date),
                    Faturamento: entry.faturamento.toFixed(2).replace('.', ','),
                    Recebido: entry.recebido.toFixed(2).replace('.', ','),
                    Atendimentos: entry.atendimentos,
                  })),
                )
                downloadFile('relatorio-faturamento.csv', csv, 'text/csv;charset=utf-8')
                toast.success('Relatório exportado', {
                  description: 'relatorio-faturamento.csv com o resumo diário.',
                })
              }}
            >
              Faturamento diário (CSV)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    [scoped, daily],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PeriodFilter
          preset={preset}
          range={range}
          onChange={(nextPreset, nextRange) => {
            setPreset(nextPreset)
            setRange(nextRange)
          }}
        />
        <p className="text-[12px] text-muted-foreground">
          {dateShort(range.from)} — {dateShort(range.to)} · {scoped.length} atendimentos
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          loading={loading}
          label="Faturamento"
          value={currency(revenue)}
          icon={TrendingUp}
          hint={`Ticket médio de ${currency(ticket)}`}
        />
        <MetricCard
          loading={loading}
          label="Recebido"
          value={currency(received)}
          icon={Wallet}
          tone="success"
          hint={revenue > 0 ? `${percent((received / revenue) * 100)} do faturamento` : 'Sem receita'}
        />
        <MetricCard
          loading={loading}
          label="Em aberto"
          value={currency(pending)}
          icon={Receipt}
          tone={pending > 0 ? 'warning' : 'success'}
          hint="Inclui clientes faturados"
        />
        <MetricCard
          loading={loading}
          label="Peças processadas"
          value={number(pieces)}
          icon={Package}
          tone="info"
          hint={`${number(scoped.length)} atendimentos`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Faturamento por dia"
            hint="Comparativo entre valor faturado e efetivamente recebido"
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyChart} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="fillFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillRecebido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  minTickGap={20}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${Math.round(Number(value) / 100) / 10}k`}
                  width={54}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  name="Faturamento"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#fillFaturamento)"
                />
                <Area
                  type="monotone"
                  dataKey="recebido"
                  name="Recebido"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  fill="url(#fillRecebido)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Formas de pagamento" hint="Participação no período" loading={loading}>
          {byMethod.length === 0 ? (
            <EmptyState compact icon={Wallet} title="Sem pagamentos no período" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={byMethod}
                    dataKey="total"
                    nameKey="method"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {byMethod.map((entry, index) => (
                      <Cell key={entry.method} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }: any) =>
                      active && payload?.length ? (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                          <p className="text-[12px] font-medium">
                            {paymentMethodLabels[payload[0].payload.method as keyof typeof paymentMethodLabels]}
                          </p>
                          <p className="tabular text-[12px] text-muted-foreground">
                            {currency(payload[0].payload.total)} · {payload[0].payload.count} pagamentos
                          </p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-3 space-y-1.5">
                {byMethod.map((entry, index) => (
                  <li key={entry.method} className="flex items-center gap-2 text-[12px]">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: chartColors[index % chartColors.length] }}
                    />
                    <span className="flex-1 text-muted-foreground">
                      {paymentMethodLabels[entry.method]}
                    </span>
                    <span className="tabular font-medium">{currency(entry.total)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Peças mais processadas" hint="Volume por tipo de peça" loading={loading}>
          {garmentsRanking.length === 0 ? (
            <EmptyState compact icon={Package} title="Sem peças no período" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={garmentsRanking}
                layout="vertical"
                margin={{ left: 10, right: 16 }}
                barSize={16}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={130}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent) / 0.4)' }}
                  content={({ active, payload }: any) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                        <p className="text-[12px] font-medium">{payload[0].payload.name}</p>
                        <p className="tabular text-[12px] text-muted-foreground">
                          {payload[0].payload.quantity} peças ·{' '}
                          {currency(payload[0].payload.total)}
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="quantity" radius={[0, 4, 4, 0]} fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Serviços por receita" hint="Onde o faturamento é gerado" loading={loading}>
          {servicesRanking.length === 0 ? (
            <EmptyState compact icon={Receipt} title="Sem serviços no período" />
          ) : (
            <ul className="space-y-2.5">
              {servicesRanking.map((service, index) => {
                const share = revenue > 0 ? (service.total / revenue) * 100 : 0
                return (
                  <li key={service.name}>
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: chartColors[index % chartColors.length] }}
                        />
                        {service.name}
                      </span>
                      <span className="tabular font-medium">{currency(service.total)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${share}%`,
                            background: chartColors[index % chartColors.length],
                          }}
                        />
                      </div>
                      <span className="tabular w-20 text-right text-[11px] text-muted-foreground">
                        {service.quantity} peças
                      </span>
                      <Badge variant="neutral" size="sm" className="tabular w-12 justify-center">
                        {percent(share)}
                      </Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
