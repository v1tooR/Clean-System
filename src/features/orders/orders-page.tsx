import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, Package, Plus, Receipt, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/shared/data-table'
import { SearchInput } from '@/components/shared/search-input'
import {
  ActiveFilters,
  FilterSelect,
  PeriodFilter,
  type ActiveFilterChip,
} from '@/components/shared/filter-bar'
import { EmptyState } from '@/components/shared/states'
import { StatusBadge, paymentMethodLabels } from '@/components/shared/status-badge'
import { OrderStatusMenu } from './order-status-menu'
import { usePageHeader } from '@/components/layout/header-slot'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { inRange, rangeFromPreset } from '@/store/selectors'
import { useDebouncedValue, useSimulatedLoading } from '@/hooks'
import { currency, customerShort, dateShort, dueLabel, shortName } from '@/lib/format'
import { normalize } from '@/lib/utils'
import type { DateRange, Order, PeriodPreset } from '@/types'

const statusOptions = [
  { value: 'recebido', label: 'Recebido' },
  { value: 'em-processo', label: 'Em processo' },
  { value: 'pronto', label: 'Pronto' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
]

const paymentOptions = [
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelado', label: 'Cancelado' },
]

const methodOptions = [
  { value: 'pix', label: 'Pix' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'faturado', label: 'Faturado' },
]

export function OrdersPage() {
  const orders = useDataStore((state) => state.orders)
  const openOrder = useUIStore((state) => state.openOrder)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const loading = useSimulatedLoading(450)

  const [search, setSearch] = React.useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [preset, setPreset] = React.useState<PeriodPreset>('30d')
  const [range, setRange] = React.useState<DateRange>(() => rangeFromPreset('30d'))
  const [statuses, setStatuses] = React.useState<string[]>(() => {
    const initial = searchParams.get('status')
    return initial ? [initial] : []
  })
  const [payments, setPayments] = React.useState<string[]>([])
  const [methods, setMethods] = React.useState<string[]>([])
  const [onlyLate, setOnlyLate] = React.useState(searchParams.get('atraso') === '1')

  usePageHeader(
    {
      title: 'Atendimentos',
      description: 'Todas as ordens de serviço da lavanderia',
      actions: (
        <Button className="gap-2" onClick={() => navigate('/atendimentos/novo')}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Novo atendimento</span>
        </Button>
      ),
    },
    [],
  )

  /* Limpa parâmetros da URL depois de aplicá-los como filtro inicial */
  React.useEffect(() => {
    if (searchParams.get('status') || searchParams.get('atraso')) {
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = React.useMemo(() => {
    const term = normalize(debouncedSearch)
    const now = new Date()

    return orders.filter((order) => {
      if (!inRange(order.createdAt, range)) return false
      if (statuses.length > 0 && !statuses.includes(order.status)) return false
      if (payments.length > 0 && !payments.includes(order.paymentStatus)) return false
      if (methods.length > 0 && !(order.paymentMethod && methods.includes(order.paymentMethod)))
        return false
      if (
        onlyLate &&
        !(new Date(order.dueAt) < now && (order.status === 'recebido' || order.status === 'em-processo'))
      )
        return false
      if (term) {
        const haystack = normalize(
          `${order.code} ${order.customerName} ${order.pickupCode} ${order.attendant}`,
        )
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [orders, range, statuses, payments, methods, onlyLate, debouncedSearch])

  const columns = React.useMemo<ColumnDef<Order, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'OS',
        size: 96,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="tabular font-semibold">{row.original.code}</span>
            {row.original.priority ? <Star className="size-3 fill-warning text-warning" /> : null}
          </div>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Cliente',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="max-w-[220px] truncate">
              {customerShort(row.original.customerName, row.original.customerKind)}
            </span>
            {row.original.customerKind === 'PJ' ? (
              <Badge variant="info" size="sm">
                PJ
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Entrada',
        size: 110,
        cell: ({ row }) => (
          <span className="tabular text-muted-foreground">{dateShort(row.original.createdAt)}</span>
        ),
      },
      {
        accessorKey: 'dueAt',
        header: 'Entrega',
        size: 130,
        cell: ({ row }) => {
          const late =
            new Date(row.original.dueAt) < new Date() &&
            (row.original.status === 'recebido' || row.original.status === 'em-processo')
          return (
            <span
              className={`tabular inline-flex items-center gap-1 ${late ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {late ? <AlertTriangle className="size-3" /> : null}
              {dueLabel(row.original.dueAt)}
            </span>
          )
        },
      },
      {
        id: 'pieces',
        header: 'Peças',
        size: 80,
        accessorFn: (row) => row.items.reduce((acc, item) => acc + item.quantity, 0),
        cell: ({ getValue }) => (
          <span className="tabular inline-flex items-center gap-1.5 text-muted-foreground">
            <Package className="size-3.5" />
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Valor',
        size: 110,
        cell: ({ row }) => (
          <span className="tabular font-medium">{currency(row.original.total)}</span>
        ),
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Pagamento',
        size: 150,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <StatusBadge kind="payment" status={row.original.paymentStatus} size="sm" />
            {row.original.paymentMethod ? (
              <span className="text-[11px] text-muted-foreground">
                {paymentMethodLabels[row.original.paymentMethod]}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Situação',
        size: 130,
        cell: ({ row }) => <StatusBadge kind="order" status={row.original.status} size="sm" />,
      },
      {
        accessorKey: 'invoiceStatus',
        header: 'NFS-e',
        size: 130,
        cell: ({ row }) => (
          <StatusBadge kind="invoice" status={row.original.invoiceStatus} size="sm" />
        ),
      },
      {
        accessorKey: 'attendant',
        header: 'Responsável',
        size: 140,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{shortName(row.original.attendant)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 48,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => <OrderStatusMenu order={row.original} variant="icon" />,
      },
    ],
    [],
  )

  const chips: ActiveFilterChip[] = [
    ...statuses.map((value) => ({
      id: `status-${value}`,
      label: `Situação: ${statusOptions.find((option) => option.value === value)?.label}`,
      onRemove: () => setStatuses((current) => current.filter((item) => item !== value)),
    })),
    ...payments.map((value) => ({
      id: `pay-${value}`,
      label: `Pagamento: ${paymentOptions.find((option) => option.value === value)?.label}`,
      onRemove: () => setPayments((current) => current.filter((item) => item !== value)),
    })),
    ...methods.map((value) => ({
      id: `method-${value}`,
      label: `Método: ${methodOptions.find((option) => option.value === value)?.label}`,
      onRemove: () => setMethods((current) => current.filter((item) => item !== value)),
    })),
    ...(onlyLate
      ? [{ id: 'late', label: 'Somente atrasados', onRemove: () => setOnlyLate(false) }]
      : []),
  ]

  return (
    <div className="space-y-3">
      {chips.length > 0 ? (
        <ActiveFilters
          chips={chips}
          onClearAll={() => {
            setStatuses([])
            setPayments([])
            setMethods([])
            setOnlyLate(false)
          }}
        />
      ) : null}

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onRowClick={(order) => openOrder(order.id)}
        entityLabel={{ singular: 'atendimento', plural: 'atendimentos' }}
        initialSorting={[{ id: 'createdAt', desc: true }]}
        initialVisibility={{ attendant: false }}
        hideOnMobile={['createdAt', 'pieces', 'invoiceStatus']}
        emptyState={
          <EmptyState
            icon={Receipt}
            title="Nenhum atendimento encontrado"
            description="Ajuste os filtros ou registre um novo atendimento no balcão."
            action={
              <Button onClick={() => navigate('/atendimentos/novo')} className="gap-2">
                <Plus className="size-4" />
                Novo atendimento
              </Button>
            }
          />
        }
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por OS, cliente ou código de retirada…"
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
              label="Pagamento"
              options={paymentOptions}
              selected={payments}
              onChange={setPayments}
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
