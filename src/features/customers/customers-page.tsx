import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Building2, MoreHorizontal, Plus, UserRound, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/shared/data-table'
import { SearchInput } from '@/components/shared/search-input'
import { EmptyState } from '@/components/shared/states'
import { CustomerFormDialog } from './customer-form-dialog'
import { usePageHeader } from '@/components/layout/header-slot'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { customerStats } from '@/store/selectors'
import { useDebouncedValue, useSimulatedLoading } from '@/hooks'
import { currency, dateShort, relative } from '@/lib/format'
import { normalize, onlyDigits } from '@/lib/utils'
import type { Customer } from '@/types'

type Filter = 'todos' | 'PF' | 'PJ'

export function CustomersPage() {
  const customers = useDataStore((state) => state.customers)
  const orders = useDataStore((state) => state.orders)
  const toggleActive = useDataStore((state) => state.toggleCustomerActive)
  const openCustomer = useUIStore((state) => state.openCustomer)
  const [searchParams, setSearchParams] = useSearchParams()
  const loading = useSimulatedLoading(400)

  const [search, setSearch] = React.useState('')
  const debounced = useDebouncedValue(search)
  const [filter, setFilter] = React.useState<Filter>('todos')
  const [formOpen, setFormOpen] = React.useState(searchParams.get('novo') === '1')
  const [editing, setEditing] = React.useState<Customer | null>(null)

  usePageHeader(
    {
      title: 'Clientes',
      description: 'Pessoas físicas e empresas atendidas',
      actions: (
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Novo cliente</span>
        </Button>
      ),
    },
    [],
  )

  React.useEffect(() => {
    if (searchParams.get('novo')) setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = React.useMemo(() => {
    const term = normalize(debounced)
    const digits = onlyDigits(debounced)

    return customers
      .filter((customer) => {
        if (filter !== 'todos' && customer.kind !== filter) return false
        if (!term) return true
        const name = normalize(
          `${customer.name} ${customer.kind === 'PJ' ? customer.tradeName : ''} ${customer.email ?? ''}`,
        )
        const docs = onlyDigits(
          `${customer.kind === 'PJ' ? customer.cnpj : customer.cpf}${customer.phone}`,
        )
        return name.includes(term) || (digits.length >= 3 && docs.includes(digits))
      })
      .map((customer) => ({ customer, stats: customerStats(customer.id, orders) }))
  }, [customers, orders, filter, debounced])

  type Row = (typeof rows)[number]

  const columns = React.useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Cliente',
        accessorFn: (row) =>
          row.customer.kind === 'PJ' ? row.customer.tradeName : row.customer.name,
        cell: ({ row }) => {
          const customer = row.original.customer
          return (
            <div className="flex items-center gap-2.5">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full ${
                  customer.kind === 'PJ' ? 'bg-info/12 text-info' : 'bg-primary/12 text-primary'
                }`}
              >
                {customer.kind === 'PJ' ? (
                  <Building2 className="size-4" />
                ) : (
                  <UserRound className="size-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {customer.kind === 'PJ' ? customer.tradeName : customer.name}
                  {!customer.active ? (
                    <Badge variant="neutral" size="sm">
                      Inativo
                    </Badge>
                  ) : null}
                </p>
                <p className="tabular truncate text-[12px] text-muted-foreground">
                  {customer.kind === 'PJ' ? customer.cnpj : customer.cpf || 'CPF não informado'}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        id: 'kind',
        header: 'Tipo',
        size: 90,
        accessorFn: (row) => row.customer.kind,
        cell: ({ row }) => (
          <Badge variant={row.original.customer.kind === 'PJ' ? 'info' : 'neutral'} size="sm">
            {row.original.customer.kind}
          </Badge>
        ),
      },
      {
        id: 'phone',
        header: 'Telefone',
        size: 140,
        accessorFn: (row) => row.customer.phone,
        cell: ({ getValue }) => <span className="tabular">{String(getValue())}</span>,
      },
      {
        id: 'ordersCount',
        header: 'Atendimentos',
        size: 120,
        accessorFn: (row) => row.stats.ordersCount,
        cell: ({ getValue }) => <span className="tabular">{String(getValue())}</span>,
      },
      {
        id: 'totalSpent',
        header: 'Total gasto',
        size: 130,
        accessorFn: (row) => row.stats.totalSpent,
        cell: ({ row }) => (
          <span className="tabular font-medium">{currency(row.original.stats.totalSpent)}</span>
        ),
      },
      {
        id: 'pending',
        header: 'Pendências',
        size: 130,
        accessorFn: (row) => row.stats.pending,
        cell: ({ row }) =>
          row.original.stats.pending > 0 ? (
            <span className="tabular font-medium text-warning">
              {currency(row.original.stats.pending)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'lastOrder',
        header: 'Último atendimento',
        size: 170,
        accessorFn: (row) => row.stats.lastOrderAt ?? '',
        cell: ({ row }) =>
          row.original.stats.lastOrderAt ? (
            <span className="text-muted-foreground">
              {dateShort(row.original.stats.lastOrderAt)}{' '}
              <span className="text-[11px]">({relative(row.original.stats.lastOrderAt)})</span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'actions',
        header: '',
        size: 48,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const customer = row.original.customer
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Ações do cliente"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuItem onSelect={() => openCustomer(customer.id)}>
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setEditing(customer)
                    setFormOpen(true)
                  }}
                >
                  Editar cadastro
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  destructive={customer.active}
                  onSelect={() => {
                    toggleActive(customer.id)
                    toast.success(
                      customer.active ? 'Cliente desativado' : 'Cliente reativado',
                      { description: customer.kind === 'PJ' ? customer.tradeName : customer.name },
                    )
                  }}
                >
                  {customer.active ? 'Desativar cliente' : 'Reativar cliente'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [openCustomer, toggleActive],
  )

  const counts = {
    todos: customers.length,
    PF: customers.filter((customer) => customer.kind === 'PF').length,
    PJ: customers.filter((customer) => customer.kind === 'PJ').length,
  }

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        onRowClick={(row) => openCustomer(row.customer.id)}
        entityLabel={{ singular: 'cliente', plural: 'clientes' }}
        initialSorting={[{ id: 'lastOrder', desc: true }]}
        hideOnMobile={['kind', 'phone', 'ordersCount', 'lastOrder']}
        emptyState={
          <EmptyState
            icon={Users}
            title="Nenhum cliente encontrado"
            description="Cadastre o cliente para começar a registrar atendimentos."
            action={
              <Button
                className="gap-2"
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
              >
                <Plus className="size-4" />
                Novo cliente
              </Button>
            }
          />
        }
        toolbar={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nome, documento ou telefone…"
              containerClassName="min-w-[220px] max-w-sm"
            />
            <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
              <TabsList>
                <TabsTrigger value="todos">Todos ({counts.todos})</TabsTrigger>
                <TabsTrigger value="PF">Pessoa física ({counts.PF})</TabsTrigger>
                <TabsTrigger value="PJ">Empresas ({counts.PJ})</TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        }
      />

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={(value) => {
          setFormOpen(value)
          if (!value) setEditing(null)
        }}
        customer={editing}
      />
    </div>
  )
}
