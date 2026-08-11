import * as React from 'react'
import {
  Building2,
  CalendarClock,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/misc'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/states'
import { CustomerFormDialog } from './customer-form-dialog'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { customerStats, cyclesForCustomer } from '@/store/selectors'
import { currency, dateShort, dateTime, relative } from '@/lib/format'
import { cn } from '@/lib/utils'

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('tabular mt-1 text-[18px] font-semibold tracking-tight', tone)}>{value}</p>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="text-[13px]">{value}</div>
      </div>
    </div>
  )
}

export function CustomerDetailDrawer() {
  const openCustomerId = useUIStore((state) => state.openCustomerId)
  const openCustomer = useUIStore((state) => state.openCustomer)
  const openOrder = useUIStore((state) => state.openOrder)
  const customers = useDataStore((state) => state.customers)
  const orders = useDataStore((state) => state.orders)
  const cycles = useDataStore((state) => state.billingCycles)
  const navigate = useNavigate()
  const [editing, setEditing] = React.useState(false)

  const customer = customers.find((item) => item.id === openCustomerId) ?? null
  const customerOrders = React.useMemo(
    () => orders.filter((order) => order.customerId === customer?.id),
    [orders, customer?.id],
  )
  const stats = customer ? customerStats(customer.id, orders) : null
  const customerCycles = customer ? cyclesForCustomer(cycles, customer.id) : []

  return (
    <>
      <Sheet open={!!customer} onOpenChange={(value) => !value && openCustomer(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[560px]">
          {customer && stats ? (
            <>
              <div className="shrink-0 border-b border-border px-5 pb-4 pt-5">
                <div className="flex items-start gap-3 pr-8">
                  <span
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-full',
                      customer.kind === 'PJ' ? 'bg-info/12 text-info' : 'bg-primary/12 text-primary',
                    )}
                  >
                    {customer.kind === 'PJ' ? (
                      <Building2 className="size-5" />
                    ) : (
                      <UserRound className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-semibold tracking-tight">
                        {customer.kind === 'PJ' ? customer.tradeName : customer.name}
                      </h2>
                      <Badge variant={customer.active ? 'success' : 'neutral'} size="sm">
                        {customer.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="tabular truncate text-[12px] text-muted-foreground">
                      {customer.kind === 'PJ' ? customer.cnpj : customer.cpf || 'CPF não informado'}
                      {' · '}
                      cliente desde {dateShort(customer.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      openCustomer(null)
                      navigate(`/atendimentos/novo?cliente=${customer.id}`)
                    }}
                  >
                    <Plus className="size-3.5" />
                    Novo atendimento
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-3 gap-2.5">
                  <Stat label="Atendimentos" value={String(stats.ordersCount)} />
                  <Stat label="Total gasto" value={currency(stats.totalSpent)} />
                  <Stat
                    label="Pendências"
                    value={currency(stats.pending)}
                    tone={stats.pending > 0 ? 'text-warning' : undefined}
                  />
                </div>

                <Tabs defaultValue="dados" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="dados" className="flex-1">
                      Dados
                    </TabsTrigger>
                    <TabsTrigger value="atendimentos" className="flex-1">
                      Atendimentos
                    </TabsTrigger>
                    {customer.kind === 'PJ' ? (
                      <TabsTrigger value="faturamento" className="flex-1">
                        Faturamento
                      </TabsTrigger>
                    ) : null}
                  </TabsList>

                  <TabsContent value="dados" className="space-y-4">
                    <div className="grid gap-3.5 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
                      {customer.kind === 'PJ' ? (
                        <>
                          <InfoRow icon={Building2} label="Razão social" value={customer.name} />
                          <InfoRow
                            icon={UserRound}
                            label="Contato"
                            value={customer.contactName}
                          />
                        </>
                      ) : (
                        <InfoRow icon={UserRound} label="Nome" value={customer.name} />
                      )}
                      <InfoRow
                        icon={Phone}
                        label="Telefone"
                        value={<span className="tabular">{customer.phone}</span>}
                      />
                      {customer.email ? (
                        <InfoRow icon={Mail} label="E-mail" value={customer.email} />
                      ) : null}
                      {customer.address ? (
                        <InfoRow
                          icon={MapPin}
                          label="Endereço"
                          value={
                            <span>
                              {customer.address.street}, {customer.address.number}
                              {customer.address.complement ? ` · ${customer.address.complement}` : ''}
                              <br />
                              {customer.address.district} — {customer.address.city}/
                              {customer.address.state}
                            </span>
                          }
                        />
                      ) : null}
                      <InfoRow
                        icon={CalendarClock}
                        label="Último atendimento"
                        value={
                          stats.lastOrderAt ? (
                            <span>
                              {dateShort(stats.lastOrderAt)}{' '}
                              <span className="text-muted-foreground">
                                ({relative(stats.lastOrderAt)})
                              </span>
                            </span>
                          ) : (
                            'Nenhum'
                          )
                        }
                      />
                    </div>

                    {customer.notes ? (
                      <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Observações
                        </p>
                        <p className="mt-1 text-[13px]">{customer.notes}</p>
                      </div>
                    ) : null}
                  </TabsContent>

                  <TabsContent value="atendimentos">
                    {customerOrders.length === 0 ? (
                      <EmptyState
                        icon={Receipt}
                        title="Nenhum atendimento ainda"
                        description="Quando este cliente trouxer peças, o histórico aparece aqui."
                        compact
                      />
                    ) : (
                      <ul className="space-y-1.5">
                        {customerOrders.slice(0, 20).map((order) => (
                          <li key={order.id}>
                            <button
                              type="button"
                              onClick={() => {
                                openCustomer(null)
                                openOrder(order.id)
                              }}
                              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
                            >
                              <span className="tabular text-[13px] font-semibold">
                                {order.code}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[12px] text-muted-foreground">
                                  {dateTime(order.createdAt)} ·{' '}
                                  {order.items.reduce((acc, item) => acc + item.quantity, 0)} peças
                                </span>
                              </span>
                              <StatusBadge
                                kind="order"
                                status={order.status}
                                size="sm"
                                showIcon={false}
                              />
                              <span className="tabular w-20 text-right text-[13px] font-medium">
                                {currency(order.total)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>

                  {customer.kind === 'PJ' ? (
                    <TabsContent value="faturamento" className="space-y-4">
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center gap-2">
                          <Wallet className="size-4 text-muted-foreground" />
                          <p className="text-[13px] font-semibold">Condições comerciais</p>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 gap-3.5">
                          <InfoRow
                            icon={CalendarClock}
                            label="Ciclo"
                            value={customer.billing.cycle === 'mensal' ? 'Mensal' : 'Quinzenal'}
                          />
                          <InfoRow
                            icon={CalendarClock}
                            label="Vencimento"
                            value={`Dia ${customer.billing.dueDay}`}
                          />
                          <InfoRow
                            icon={Wallet}
                            label="Desconto contratual"
                            value={`${customer.billing.discountPercent}%`}
                          />
                          <InfoRow
                            icon={FileText}
                            label="Faturamento"
                            value={customer.billing.enabled ? 'Habilitado' : 'Desabilitado'}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-[13px] font-semibold">Fechamentos</p>
                        {customerCycles.length === 0 ? (
                          <EmptyState
                            icon={FileText}
                            title="Nenhum fechamento gerado"
                            description="Os atendimentos em aberto aparecem na tela de Faturamento."
                            compact
                          />
                        ) : (
                          <ul className="space-y-1.5">
                            {customerCycles.map((cycle) => (
                              <li
                                key={cycle.id}
                                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[13px] font-medium">
                                    {dateShort(cycle.periodStart)} — {dateShort(cycle.periodEnd)}
                                  </span>
                                  <span className="block text-[12px] text-muted-foreground">
                                    {cycle.ordersCount} atendimentos
                                  </span>
                                </span>
                                <StatusBadge kind="billing" status={cycle.status} size="sm" />
                                <span className="tabular text-[13px] font-medium">
                                  {currency(cycle.total)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </TabsContent>
                  ) : null}
                </Tabs>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <CustomerFormDialog open={editing} onOpenChange={setEditing} customer={customer} />
    </>
  )
}
