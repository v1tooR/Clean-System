import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableSkeleton } from './states'
import { useIsMobile } from '@/hooks'
import { cn } from '@/lib/utils'

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  loading?: boolean
  onRowClick?: (row: TData) => void
  emptyState?: React.ReactNode
  toolbar?: React.ReactNode
  pageSize?: number
  /** Rótulo usado no rodapé: "12 de 48 atendimentos" */
  entityLabel?: { singular: string; plural: string }
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  initialSorting?: SortingState
  compact?: boolean
  /** Colunas ocultas por padrão */
  initialVisibility?: VisibilityState
  /** Colunas secundárias — escondidas automaticamente no celular */
  hideOnMobile?: string[]
}

export function DataTable<TData>({
  columns,
  data,
  loading,
  onRowClick,
  emptyState,
  toolbar,
  pageSize = 12,
  entityLabel = { singular: 'registro', plural: 'registros' },
  globalFilter,
  onGlobalFilterChange,
  initialSorting = [],
  compact,
  initialVisibility,
  hideOnMobile,
}: DataTableProps<TData>) {
  const isMobile = useIsMobile()
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialVisibility ?? {},
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: onGlobalFilterChange as never,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const rows = table.getRowModel().rows
  const totalRows = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const firstRow = totalRows === 0 ? 0 : pageIndex * table.getState().pagination.pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * table.getState().pagination.pageSize, totalRows)

  React.useEffect(() => {
    table.setPageIndex(0)
  }, [globalFilter, data.length, table])

  /* No celular, colunas secundárias saem da tabela — o essencial continua legível. */
  const mobileKey = hideOnMobile?.join(',') ?? ''
  React.useEffect(() => {
    if (!mobileKey) return
    setColumnVisibility((current) => ({
      ...current,
      ...Object.fromEntries(mobileKey.split(',').map((id) => [id, !isMobile])),
    }))
  }, [isMobile, mobileKey])

  if (loading) return <TableSkeleton columns={Math.min(columns.length, 7)} />

  return (
    <div className="space-y-3">
      {(toolbar || table.getAllColumns().some((column) => column.getCanHide())) && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 flex-wrap items-center gap-2">{toolbar}</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 font-normal">
                <Settings2 className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Colunas</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-3 text-primary" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-3 text-primary" />
                          ) : (
                            <ChevronsUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  {emptyState ?? (
                    <p className="py-14 text-center text-[13px] text-muted-foreground">
                      Nenhum resultado encontrado.
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === 'Enter') onRowClick(row.original)
                        }
                      : undefined
                  }
                  className={cn(
                    onRowClick && 'cursor-pointer hover:bg-primary/7 focus-visible:bg-primary/8',
                    compact ? '[&_td]:py-2.5' : '[&_td]:py-4',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalRows > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="tabular text-[12px] text-muted-foreground">
            {firstRow}–{lastRow} de {totalRows}{' '}
            {totalRows === 1 ? entityLabel.singular : entityLabel.plural}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="tabular px-2 text-[12px] text-muted-foreground">
              {pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
