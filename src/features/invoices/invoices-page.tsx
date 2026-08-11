import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, FileCheck2, FileCode2, FileText, MoreHorizontal, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MetricCard } from '@/components/shared/metric-card'
import { DataTable } from '@/components/shared/data-table'
import { SearchInput } from '@/components/shared/search-input'
import { FilterSelect, PeriodFilter } from '@/components/shared/filter-bar'
import { EmptyState } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/status-badge'
import { InvoicePreviewDialog } from './invoice-preview-dialog'
import { usePageHeader } from '@/components/layout/header-slot'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { inRange, rangeFromPreset } from '@/store/selectors'
import { useDebouncedValue, useSimulatedLoading } from '@/hooks'
import { cancelInvoice, downloadFile, invoiceXML, retryInvoice } from '@/services/fiscal.service'
import { currency, dateTime } from '@/lib/format'
import { normalize, sum } from '@/lib/utils'
import type { DateRange, Invoice, PeriodPreset } from '@/types'

const statusOptions = [
  { value: 'autorizada', label: 'Autorizada' },
  { value: 'processando', label: 'Processando' },
  { value: 'erro', label: 'Erro' },
  { value: 'cancelada', label: 'Cancelada' },
]

export function InvoicesPage() {
  const invoices = useDataStore((state) => state.invoices)
  const orders = useDataStore((state) => state.orders)
  const openOrder = useUIStore((state) => state.openOrder)
  const [searchParams, setSearchParams] = useSearchParams()
  const loading = useSimulatedLoading(430)

  const [search, setSearch] = React.useState('')
  const debounced = useDebouncedValue(search)
  const [preset, setPreset] = React.useState<PeriodPreset>('30d')
  const [range, setRange] = React.useState<DateRange>(() => rangeFromPreset('30d'))
  const [statuses, setStatuses] = React.useState<string[]>(() => {
    const initial = searchParams.get('status')
    return initial ? [initial] : []
  })
  const [preview, setPreview] = React.useState<Invoice | null>(null)
  const [retrying, setRetrying] = React.useState<string | null>(null)

  usePageHeader(
    { title: 'Notas Fiscais', description: 'Emissão e acompanhamento das NFS-e' },
    [],
  )

  React.useEffect(() => {
    if (searchParams.get('status')) setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = React.useMemo(() => {
    const term = normalize(debounced)
    return invoices
      .map((invoice) => ({
        invoice,
        order: orders.find((order) => order.id === invoice.orderId),
      }))
      .filter(({ invoice, order }) => {
        const reference = invoice.issuedAt ?? order?.createdAt
        if (reference && !inRange(reference, range)) return false
        if (statuses.length > 0 && !statuses.includes(invoice.status)) return false
        if (
          term &&
          !normalize(`${invoice.number} ${invoice.customerName} ${order?.code ?? ''}`).includes(term)
        )
          return false
        return true
      })
  }, [invoices, orders, range, statuses, debounced])

  type Row = (typeof rows)[number]

  const authorized = invoices.filter((invoice) => invoice.status === 'autorizada')
  const errors = invoices.filter((invoice) => invoice.status === 'erro')

  async function handleRetry(invoice: Invoice) {
    setRetrying(invoice.id)
    await retryInvoice(invoice.id)
    setRetrying(null)
    toast.success('NFS-e reenviada com sucesso', { description: `Nota ${invoice.number}` })
  }

  const columns = React.useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        id: 'number',
        header: 'Número',
        size: 120,
        accessorFn: (row) => row.invoice.number,
        cell: ({ getValue }) => <span className="tabular font-semibold">{String(getValue())}</span>,
      },
      {
        id: 'order',
        header: 'OS',
        size: 90,
        accessorFn: (row) => row.order?.code ?? '',
        cell: ({ getValue }) => (
          <span className="tabular text-muted-foreground">{String(getValue()) || '—'}</span>
        ),
      },
      {
        id: 'customer',
        header: 'Cliente',
        accessorFn: (row) => row.invoice.customerName,
        cell: ({ getValue }) => (
          <span className="block max-w-[240px] truncate">{String(getValue())}</span>
        ),
      },
      {
        id: 'amount',
        header: 'Valor',
        size: 120,
        accessorFn: (row) => row.invoice.amount,
        cell: ({ row }) => (
          <span className="tabular font-medium">{currency(row.original.invoice.amount)}</span>
        ),
      },
      {
        id: 'issuedAt',
        header: 'Emissão',
        size: 170,
        accessorFn: (row) => row.invoice.issuedAt ?? '',
        cell: ({ row }) => (
          <span className="tabular text-muted-foreground">
            {row.original.invoice.issuedAt ? dateTime(row.original.invoice.issuedAt) : '—'}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Situação',
        size: 140,
        accessorFn: (row) => row.invoice.status,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <StatusBadge kind="invoice" status={row.original.invoice.status} size="sm" />
            {row.original.invoice.status === 'erro' ? (
              <AlertTriangle className="size-3 text-destructive" />
            ) : null}
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 48,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const { invoice, order } = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Ações da nota"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem onSelect={() => setPreview(invoice)}>
                  <FileText />
                  Visualizar PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    downloadFile(
                      `NFSe-${invoice.number}.xml`,
                      invoiceXML(invoice, order),
                      'application/xml',
                    )
                    toast.success('XML baixado', { description: `NFSe-${invoice.number}.xml` })
                  }}
                >
                  <FileCode2 />
                  Baixar XML
                </DropdownMenuItem>
                {order ? (
                  <DropdownMenuItem onSelect={() => openOrder(order.id)}>
                    Ver atendimento
                  </DropdownMenuItem>
                ) : null}
                {invoice.status === 'erro' ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleRetry(invoice)}>
                      <RefreshCw />
                      Reenviar nota
                    </DropdownMenuItem>
                  </>
                ) : null}
                {invoice.status === 'autorizada' ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      destructive
                      onSelect={async () => {
                        await cancelInvoice(invoice.id)
                        toast.success('Nota cancelada', { description: `NFS-e ${invoice.number}` })
                      }}
                    >
                      Cancelar nota
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [openOrder],
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          loading={loading}
          label="Notas autorizadas"
          value={String(authorized.length)}
          icon={FileCheck2}
          tone="success"
          hint={`${currency(sum(authorized.map((invoice) => invoice.amount)))} em serviços`}
        />
        <MetricCard
          loading={loading}
          label="Com erro"
          value={String(errors.length)}
          icon={AlertTriangle}
          tone={errors.length > 0 ? 'destructive' : 'success'}
          hint="Rejeições que precisam de reenvio"
        />
        <MetricCard
          loading={loading}
          label="Sem nota emitida"
          value={String(
            orders.filter(
              (order) => order.invoiceStatus === 'nao-emitida' && order.status !== 'cancelado',
            ).length,
          )}
          icon={FileText}
          tone="warning"
          hint="Atendimentos aguardando emissão"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading || !!retrying}
        onRowClick={(row) => setPreview(row.invoice)}
        entityLabel={{ singular: 'nota', plural: 'notas' }}
        initialSorting={[{ id: 'issuedAt', desc: true }]}
        hideOnMobile={['order', 'issuedAt']}
        emptyState={
          <EmptyState
            icon={FileText}
            title="Nenhuma nota encontrada"
            description="Ajuste o período ou os filtros para localizar as NFS-e."
          />
        }
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por número, OS ou cliente…"
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
          </>
        }
      />

      <InvoicePreviewDialog
        invoice={preview}
        open={!!preview}
        onOpenChange={(value) => !value && setPreview(null)}
      />
    </div>
  )
}
