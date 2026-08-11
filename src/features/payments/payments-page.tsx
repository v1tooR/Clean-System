import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Banknote,
  Clock3,
  CreditCard,
  Landmark,
  QrCode,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MetricCard } from '@/components/shared/metric-card'
import { DataTable } from '@/components/shared/data-table'
import { SearchInput } from '@/components/shared/search-input'
import { ActiveFilters, FilterSelect, PeriodFilter } from '@/components/shared/filter-bar'
import { EmptyState } from '@/components/shared/states'
import { StatusBadge, paymentMethodLabels } from '@/components/shared/status-badge'
import { usePageHeader } from '@/components/layout/header-slot'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { inRange, paymentSummary, rangeFromPreset } from '@/store/selectors'
import { useDebouncedValue, useSimulatedLoading } from '@/hooks'
import { downloadFile, toCSV } from '@/services/fiscal.service'
import { currency, dateTime } from '@/lib/format'
import { normalize } from '@/lib/utils'
import type { DateRange, Payment, PaymentMethod, PeriodPreset } from '@/types'

const methodIcons: Record<PaymentMethod, React.ElementType> = {
  pix: QrCode,
  debito: CreditCard,
  credito: CreditCard,
  dinheiro: Banknote,
  faturado: Landmark,
}

const statusOptions = [
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelado', label: 'Cancelado' },
]

const methodOptions = Object.entries(paymentMethodLabels).map(([value, label]) => ({
  value,
  label,
}))

export function PaymentsPage() {
  const payments = useDataStore((state) => state.payments)
  const orders = useDataStore((state) => state.orders)
  const registerPayment = useDataStore((state) => state.registerPayment)
  const openOrder = useUIStore((state) => state.openOrder)
  const [searchParams, setSearchParams] = useSearchParams()
  const loading = useSimulatedLoading(420)

  const [search, setSearch] = React.useState('')
  const debounced = useDebouncedValue(search)
  const [preset, setPreset] = React.useState<PeriodPreset>('30d')
  const [range, setRange] = React.useState<DateRange>(() => rangeFromPreset('30d'))
  const [statuses, setStatuses] = React.useState<string[]>(() => {
    const initial = searchParams.get('status')
    return initial ? [initial] : []
  })
  const [methods, setMethods] = React.useState<string[]>([])

  React.useEffect(() => {
    if (searchParams.get('status')) setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summary = React.useMemo(() => paymentSummary(payments, range), [payments, range])

  const rows = React.useMemo(() => {
    const term = normalize(debounced)
    return payments
      .map((payment) => ({
        payment,
        order: orders.find((order) => order.id === payment.orderId),
      }))
      .filter(({ payment, order }) => {
        if (!order) return false
        if (!inRange(payment.createdAt, range)) return false
        if (statuses.length > 0 && !statuses.includes(payment.status)) return false
        if (methods.length > 0 && !(payment.method && methods.includes(payment.method))) return false
        if (term && !normalize(`${order.code} ${order.customerName}`).includes(term)) return false
        return true
      })
  }, [payments, orders, range, statuses, methods, debounced])

  type Row = (typeof rows)[number]

  usePageHeader(
    {
      title: 'Pagamentos',
      description: 'Recebimentos e pendências financeiras',
      actions: (
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            const csv = toCSV(
              rows.map(({ payment, order }) => ({
                OS: order?.code ?? '',
                Cliente: order?.customerName ?? '',
                Valor: payment.amount.toFixed(2).replace('.', ','),
                Metodo: payment.method ? paymentMethodLabels[payment.method] : 'A definir',
                Situacao: payment.status,
                Data: dateTime(payment.createdAt),
              })),
            )
            downloadFile('pagamentos.csv', csv, 'text/csv;charset=utf-8')
            toast.success('Exportação concluída', { description: 'pagamentos.csv' })
          }}
        >
          <Receipt className="size-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      ),
    },
    [rows],
  )

  const columns = React.useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        id: 'code',
        header: 'OS',
        size: 90,
        accessorFn: (row) => row.order?.code ?? '',
        cell: ({ getValue }) => <span className="tabular font-semibold">{String(getValue())}</span>,
      },
      {
        id: 'customer',
        header: 'Cliente',
        accessorFn: (row) => row.order?.customerName ?? '',
        cell: ({ getValue }) => (
          <span className="block max-w-[240px] truncate">{String(getValue())}</span>
        ),
      },
      {
        id: 'amount',
        header: 'Valor',
        size: 120,
        accessorFn: (row) => row.payment.amount,
        cell: ({ row }) => (
          <span className="tabular font-medium">{currency(row.original.payment.amount)}</span>
        ),
      },
      {
        id: 'method',
        header: 'Método',
        size: 130,
        accessorFn: (row) => row.payment.method ?? '',
        cell: ({ row }) => {
          const method = row.original.payment.method
          if (!method) {
            return (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground/70">
                <Clock3 className="size-3.5" />
                A definir
              </span>
            )
          }
          const Icon = methodIcons[method]
          return (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Icon className="size-3.5" />
              {paymentMethodLabels[method]}
            </span>
          )
        },
      },
      {
        id: 'status',
        header: 'Situação',
        size: 120,
        accessorFn: (row) => row.payment.status,
        cell: ({ row }) => <StatusBadge kind="payment" status={row.original.payment.status} size="sm" />,
      },
      {
        id: 'date',
        header: 'Data',
        size: 170,
        accessorFn: (row) => row.payment.paidAt ?? row.payment.createdAt,
        cell: ({ row }) => (
          <span className="tabular text-muted-foreground">
            {dateTime(row.original.payment.paidAt ?? row.original.payment.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 130,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const { payment, order } = row.original
          if (payment.status !== 'pendente' || !order) return null
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[12px]"
                  onClick={(event) => event.stopPropagation()}
                >
                  Registrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuLabel>Método recebido</DropdownMenuLabel>
                {(['pix', 'debito', 'credito', 'dinheiro'] as PaymentMethod[]).map((method) => (
                  <DropdownMenuItem
                    key={method}
                    onSelect={() => {
                      registerPayment(order.id, method)
                      toast.success('Pagamento registrado', {
                        description: `OS ${order.code} · ${paymentMethodLabels[method]} · ${currency(payment.amount)}`,
                      })
                    }}
                  >
                    {paymentMethodLabels[method]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [registerPayment],
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          loading={loading}
          label="Recebido hoje"
          value={currency(summary.receivedToday)}
          icon={TrendingUp}
          tone="success"
          hint="Somente pagamentos confirmados"
        />
        <MetricCard
          loading={loading}
          label="Recebido no período"
          value={currency(summary.receivedInRange)}
          icon={Wallet}
          hint="De acordo com o filtro selecionado"
        />
        <MetricCard
          loading={loading}
          label="Pendente"
          value={currency(summary.pending)}
          icon={Receipt}
          tone={summary.pending > 0 ? 'warning' : 'success'}
          hint="Inclui atendimentos faturados"
        />
        <MetricCard
          loading={loading}
          label="Pagamentos no período"
          value={String(summary.count)}
          icon={CreditCard}
          tone="info"
          hint="Lançamentos registrados"
        />
      </div>

      {statuses.length > 0 || methods.length > 0 ? (
        <ActiveFilters
          chips={[
            ...statuses.map((value) => ({
              id: `s-${value}`,
              label: `Situação: ${statusOptions.find((option) => option.value === value)?.label}`,
              onRemove: () => setStatuses((current) => current.filter((item) => item !== value)),
            })),
            ...methods.map((value) => ({
              id: `m-${value}`,
              label: `Método: ${paymentMethodLabels[value as PaymentMethod]}`,
              onRemove: () => setMethods((current) => current.filter((item) => item !== value)),
            })),
          ]}
          onClearAll={() => {
            setStatuses([])
            setMethods([])
          }}
        />
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        onRowClick={(row) => row.order && openOrder(row.order.id)}
        entityLabel={{ singular: 'pagamento', plural: 'pagamentos' }}
        initialSorting={[{ id: 'date', desc: true }]}
        hideOnMobile={['method', 'date']}
        emptyState={
          <EmptyState
            icon={Wallet}
            title="Nenhum pagamento no período"
            description="Ajuste o período ou os filtros para ver os lançamentos."
          />
        }
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por OS ou cliente…"
              containerClassName="min-w-[220px] max-w-sm"
            />
            <PeriodFilter
              preset={preset}
              range={range}
              onChange={(nextPreset, nextRange) => {
                setPreset(nextPreset)
                setRange(nextRange)
              }}
            />
            <FilterSelect
              label="Situação"
              options={statusOptions}
              selected={statuses}
              onChange={setStatuses}
            />
            <FilterSelect
              label="Método"
              options={methodOptions}
              selected={methods}
              onChange={setMethods}
            />
          </>
        }
      />
    </div>
  )
}
