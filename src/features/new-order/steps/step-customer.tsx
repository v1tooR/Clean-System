import * as React from 'react'
import { Building2, Check, Clock, Phone, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CustomerAutocomplete } from '@/components/shared/customer-autocomplete'
import { CustomerFormDialog } from '@/features/customers/customer-form-dialog'
import { useDataStore } from '@/store/data-store'
import { customerStats } from '@/store/selectors'
import { currency, relative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NewOrderFlow } from '../use-new-order'

export function StepCustomer({ flow }: { flow: NewOrderFlow }) {
  const customers = useDataStore((state) => state.customers)
  const orders = useDataStore((state) => state.orders)
  const [creating, setCreating] = React.useState(false)
  const [query, setQuery] = React.useState('')

  /** Clientes atendidos recentemente — atalho para o balcão. */
  const recent = React.useMemo(() => {
    const seen = new Set<string>()
    const list: typeof customers = []
    for (const order of orders) {
      if (seen.has(order.customerId)) continue
      const customer = customers.find((item) => item.id === order.customerId)
      if (customer?.active) {
        seen.add(customer.id)
        list.push(customer)
      }
      if (list.length >= 6) break
    }
    return list
  }, [orders, customers])

  const selected = flow.customer
  const stats = selected ? customerStats(selected.id, orders) : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">Quem está trazendo as peças?</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Busque por nome, CPF, CNPJ ou telefone. Se for a primeira vez, cadastre em segundos.
        </p>
      </div>

      <CustomerAutocomplete
        customers={customers}
        autoFocus={!selected}
        onSelect={(customer) => {
          flow.setCustomer(customer)
          flow.goTo(1)
        }}
        onCreateNew={(value) => {
          setQuery(value)
          setCreating(true)
        }}
      />

      {selected ? (
        <div className="rounded-lg border border-primary/40 bg-primary/6 p-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-full',
                selected.kind === 'PJ' ? 'bg-info/15 text-info' : 'bg-primary/15 text-primary',
              )}
            >
              {selected.kind === 'PJ' ? (
                <Building2 className="size-5" />
              ) : (
                <UserRound className="size-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-[14px] font-semibold">
                  {selected.kind === 'PJ' ? selected.tradeName : selected.name}
                </p>
                <Badge variant="success" size="sm" className="gap-1">
                  <Check className="size-3" />
                  Selecionado
                </Badge>
                {selected.kind === 'PJ' && selected.billing.enabled ? (
                  <Badge variant="info" size="sm">
                    Faturamento {selected.billing.cycle}
                    {selected.billing.discountPercent > 0
                      ? ` · ${selected.billing.discountPercent}% off`
                      : ''}
                  </Badge>
                ) : null}
              </div>
              <p className="tabular mt-0.5 text-[12px] text-muted-foreground">
                {selected.kind === 'PJ' ? selected.cnpj : selected.cpf || 'CPF não informado'} ·{' '}
                {selected.phone}
              </p>
              {stats && stats.ordersCount > 0 ? (
                <p className="mt-2 text-[12px] text-muted-foreground">
                  {stats.ordersCount} atendimentos · {currency(stats.totalSpent)} no total
                  {stats.pending > 0 ? (
                    <span className="text-warning"> · {currency(stats.pending)} em aberto</span>
                  ) : null}
                  {stats.lastOrderAt ? ` · último ${relative(stats.lastOrderAt)}` : ''}
                </p>
              ) : (
                <p className="mt-2 text-[12px] text-muted-foreground">Primeiro atendimento 🎉</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remover cliente selecionado"
              onClick={() => flow.setCustomer(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Clock className="size-3.5" />
            Atendidos recentemente
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  flow.setCustomer(customer)
                  flow.goTo(1)
                }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-card-elevated"
              >
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full',
                    customer.kind === 'PJ' ? 'bg-info/12 text-info' : 'bg-primary/12 text-primary',
                  )}
                >
                  {customer.kind === 'PJ' ? (
                    <Building2 className="size-4" />
                  ) : (
                    <UserRound className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">
                    {customer.kind === 'PJ' ? customer.tradeName : customer.name}
                  </span>
                  <span className="tabular flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Phone className="size-3" />
                    {customer.phone}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <CustomerFormDialog
        open={creating}
        onOpenChange={setCreating}
        initialQuery={query}
        onCreated={(customer) => {
          flow.setCustomer(customer)
          flow.goTo(1)
        }}
      />
    </div>
  )
}
