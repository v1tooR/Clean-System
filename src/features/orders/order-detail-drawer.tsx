import * as React from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Banknote,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  Phone,
  Printer,
  QrCode,
  Receipt,
  Star,
  UserRound,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge, paymentMethodLabels } from '@/components/shared/status-badge'
import { Timeline } from '@/components/shared/timeline'
import { EmptyState } from '@/components/shared/states'
import { OrderStatusMenu } from './order-status-menu'
import { ReceiptDialog } from './receipt-dialog'
import { InvoicePreviewDialog } from '@/features/invoices/invoice-preview-dialog'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { issueInvoice, type InvoiceProgress } from '@/services/fiscal.service'
import { currency, dateTime, dueLabel, formatDocument } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order, PaymentMethod } from '@/types'

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

const paymentOptions: { method: PaymentMethod; icon: React.ElementType }[] = [
  { method: 'pix', icon: QrCode },
  { method: 'debito', icon: CreditCard },
  { method: 'credito', icon: CreditCard },
  { method: 'dinheiro', icon: Banknote },
]

export function OrderDetailDrawer() {
  const openOrderId = useUIStore((state) => state.openOrderId)
  const openOrder = useUIStore((state) => state.openOrder)
  const openCustomer = useUIStore((state) => state.openCustomer)

  const orders = useDataStore((state) => state.orders)
  const customers = useDataStore((state) => state.customers)
  const invoices = useDataStore((state) => state.invoices)
  const registerPayment = useDataStore((state) => state.registerPayment)

  const [receiptOpen, setReceiptOpen] = React.useState(false)
  const [invoiceOpen, setInvoiceOpen] = React.useState(false)
  const [issuing, setIssuing] = React.useState<InvoiceProgress | null>(null)

  const order = orders.find((item) => item.id === openOrderId) ?? null
  const customer = customers.find((item) => item.id === order?.customerId)
  const invoice = invoices.find((item) => item.orderId === order?.id)

  async function handleIssueInvoice(target: Order) {
    setIssuing('preparando')
    try {
      const { invoice: created } = await issueInvoice(target, setIssuing)
      if (created.status === 'autorizada') {
        toast.success('NFS-e autorizada', {
          description: `Nota ${created.number} · código ${created.verificationCode}`,
          action: { label: 'Ver nota', onClick: () => setInvoiceOpen(true) },
        })
      } else {
        toast.error('NFS-e rejeitada', { description: created.error })
      }
    } finally {
      setTimeout(() => setIssuing(null), 600)
    }
  }

  return (
    <>
      <Sheet open={!!order} onOpenChange={(value) => !value && openOrder(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[560px]">
          {order ? (
            <>
              {/* Cabeçalho */}
              <div className="shrink-0 border-b border-border px-5 pb-4 pt-5">
                <div className="flex items-start justify-between gap-3 pr-8">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="tabular text-lg font-semibold tracking-tight">
                        OS {order.code}
                      </h2>
                      <StatusBadge kind="order" status={order.status} />
                      {order.priority ? (
                        <Badge variant="warning" className="gap-1">
                          <Star className="size-3" />
                          Prioridade
                        </Badge>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        openOrder(null)
                        openCustomer(order.customerId)
                      }}
                      className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {order.customerKind === 'PJ' ? (
                        <Building2 className="size-3.5" />
                      ) : (
                        <UserRound className="size-3.5" />
                      )}
                      <span className="truncate">{order.customerName}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <OrderStatusMenu order={order} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setReceiptOpen(true)}
                  >
                    <Printer className="size-3.5" />
                    Comprovante
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <Tabs defaultValue="detalhes">
                  <TabsList className="w-full">
                    <TabsTrigger value="detalhes" className="flex-1">
                      Detalhes
                    </TabsTrigger>
                    <TabsTrigger value="financeiro" className="flex-1">
                      Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="historico" className="flex-1">
                      Histórico
                    </TabsTrigger>
                  </TabsList>

                  {/* ------------------------------ Detalhes ------------------------------ */}
                  <TabsContent value="detalhes" className="space-y-5">
                    <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-card p-4">
                      <InfoRow icon={CalendarClock} label="Entrada" value={dateTime(order.createdAt)} />
                      <InfoRow
                        icon={CalendarClock}
                        label="Previsão de entrega"
                        value={
                          <span
                            className={cn(
                              new Date(order.dueAt) < new Date() &&
                                order.status !== 'entregue' &&
                                'font-medium text-destructive',
                            )}
                          >
                            {dueLabel(order.dueAt)}
                          </span>
                        }
                      />
                      <InfoRow icon={UserRound} label="Responsável" value={order.attendant} />
                      <InfoRow
                        icon={Receipt}
                        label="Código de retirada"
                        value={<span className="tabular font-semibold">{order.pickupCode}</span>}
                      />
                    </div>

                    {customer ? (
                      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-semibold">Cliente</p>
                          <Badge variant={customer.kind === 'PJ' ? 'info' : 'neutral'} size="sm">
                            {customer.kind === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'}
                          </Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InfoRow
                            icon={customer.kind === 'PJ' ? Building2 : UserRound}
                            label={customer.kind === 'PJ' ? 'Razão social' : 'Nome'}
                            value={customer.name}
                          />
                          <InfoRow
                            icon={FileText}
                            label={customer.kind === 'PJ' ? 'CNPJ' : 'CPF'}
                            value={
                              <span className="tabular">
                                {formatDocument(
                                  customer.kind === 'PJ' ? customer.cnpj : customer.cpf,
                                )}
                              </span>
                            }
                          />
                          <InfoRow
                            icon={Phone}
                            label="Telefone"
                            value={<span className="tabular">{customer.phone}</span>}
                          />
                          {customer.email ? (
                            <InfoRow icon={Mail} label="E-mail" value={customer.email} />
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                      <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <p className="text-[13px] font-semibold">Peças e serviços</p>
                        <span className="tabular text-[12px] text-muted-foreground">
                          {order.items.reduce((acc, item) => acc + item.quantity, 0)} peças
                        </span>
                      </div>
                      <ul className="divide-y divide-border/70">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                            <span className="tabular mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-muted text-[12px] font-semibold">
                              {item.quantity}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium">{item.garmentName}</p>
                              <p className="text-[12px] text-muted-foreground">
                                {item.serviceName} · {currency(item.unitPrice)} un.
                              </p>
                              {item.tags.length > 0 ? (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {item.tags.map((tag) => (
                                    <Badge key={tag} variant="warning" size="sm">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}
                              {item.note ? (
                                <p className="mt-1 text-[12px] italic text-muted-foreground">
                                  “{item.note}”
                                </p>
                              ) : null}
                            </div>
                            <span className="tabular text-[13px] font-medium">
                              {currency(item.quantity * item.unitPrice)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {order.notes ? (
                      <div className="rounded-lg border border-warning/25 bg-warning/8 p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-warning">
                          Observação do atendimento
                        </p>
                        <p className="mt-1 text-[13px]">{order.notes}</p>
                      </div>
                    ) : null}
                  </TabsContent>

                  {/* ----------------------------- Financeiro ----------------------------- */}
                  <TabsContent value="financeiro" className="space-y-4">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="space-y-2 text-[13px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="tabular">{currency(order.subtotal)}</span>
                        </div>
                        {order.discount > 0 ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Desconto</span>
                            <span className="tabular text-success">
                              − {currency(order.discount)}
                            </span>
                          </div>
                        ) : null}
                        {order.surcharge > 0 ? (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Acréscimo</span>
                            <span className="tabular">{currency(order.surcharge)}</span>
                          </div>
                        ) : null}
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-baseline justify-between">
                        <span className="text-[13px] font-medium">Total</span>
                        <span className="tabular text-[22px] font-semibold tracking-tight">
                          {currency(order.total)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="size-4 text-muted-foreground" />
                          <p className="text-[13px] font-semibold">Pagamento</p>
                        </div>
                        <StatusBadge kind="payment" status={order.paymentStatus} />
                      </div>
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        {order.paymentMethod
                          ? `Método: ${paymentMethodLabels[order.paymentMethod]}`
                          : 'Nenhum método registrado'}
                      </p>

                      {order.paymentStatus === 'pendente' ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="mt-3 w-full gap-2">
                              <Wallet className="size-3.5" />
                              Registrar pagamento
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Método recebido</DropdownMenuLabel>
                            {paymentOptions.map(({ method, icon: Icon }) => (
                              <DropdownMenuItem
                                key={method}
                                onSelect={() => {
                                  registerPayment(order.id, method)
                                  toast.success('Pagamento registrado', {
                                    description: `${paymentMethodLabels[method]} · ${currency(order.total)}`,
                                  })
                                }}
                              >
                                <Icon />
                                {paymentMethodLabels[method]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <p className="text-[13px] font-semibold">Nota fiscal</p>
                        </div>
                        <StatusBadge kind="invoice" status={order.invoiceStatus} />
                      </div>

                      {invoice && invoice.status === 'autorizada' ? (
                        <div className="mt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-3">
                            <InfoRow
                              icon={FileText}
                              label="Número"
                              value={<span className="tabular">{invoice.number}</span>}
                            />
                            <InfoRow
                              icon={FileText}
                              label="Verificação"
                              value={<span className="tabular">{invoice.verificationCode}</span>}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setInvoiceOpen(true)}
                          >
                            Visualizar PDF / XML
                          </Button>
                        </div>
                      ) : invoice && invoice.status === 'erro' ? (
                        <div className="mt-3 space-y-3">
                          <div className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/8 p-3">
                            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                            <p className="text-[12px] text-destructive">{invoice.error}</p>
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleIssueInvoice(order)}
                            loading={!!issuing}
                          >
                            Reenviar nota
                          </Button>
                        </div>
                      ) : issuing ? (
                        <div className="mt-3 flex items-center gap-2.5 rounded-md border border-border bg-muted/40 p-3">
                          <Loader2 className="size-4 animate-spin text-primary" />
                          <div>
                            <p className="text-[13px] font-medium">
                              {issuing === 'preparando' ? 'Preparando dados…' : 'Transmitindo à prefeitura…'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Isso costuma levar poucos segundos
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="mt-3 w-full gap-2"
                          disabled={order.paymentStatus !== 'pago'}
                          onClick={() => handleIssueInvoice(order)}
                        >
                          <FileText className="size-3.5" />
                          {order.paymentStatus === 'pago'
                            ? 'Emitir NFS-e'
                            : 'Confirme o pagamento para emitir'}
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  {/* ------------------------------ Histórico ----------------------------- */}
                  <TabsContent value="historico">
                    {order.timeline.length === 0 ? (
                      <EmptyState icon={Receipt} title="Sem eventos registrados" compact />
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg border border-border bg-card p-4"
                      >
                        <Timeline events={order.timeline} />
                      </motion.div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ReceiptDialog order={order} open={receiptOpen} onOpenChange={setReceiptOpen} />
      <InvoicePreviewDialog
        invoice={invoice ?? null}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
      />
    </>
  )
}
