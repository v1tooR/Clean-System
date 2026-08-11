import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'
import { InvoicePreviewDialog } from '@/features/invoices/invoice-preview-dialog'
import { useDataStore } from '@/store/data-store'
import { downloadFile, invoiceXML, issueInvoice, type InvoiceProgress } from '@/services/fiscal.service'
import { currency, dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NewOrderFlow } from '../use-new-order'

const stages: { id: InvoiceProgress; label: string }[] = [
  { id: 'preparando', label: 'Preparando dados' },
  { id: 'emitindo', label: 'Transmitindo à prefeitura' },
  { id: 'autorizada', label: 'Autorizada' },
]

export function StepInvoice({ flow }: { flow: NewOrderFlow }) {
  const settings = useDataStore((state) => state.settings)
  const invoices = useDataStore((state) => state.invoices)
  const orders = useDataStore((state) => state.orders)
  const [progress, setProgress] = React.useState<InvoiceProgress | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const started = React.useRef(false)

  const order = orders.find((item) => item.id === flow.createdOrder?.id) ?? flow.createdOrder
  const invoice = invoices.find((item) => item.orderId === order?.id) ?? null

  const run = React.useCallback(async () => {
    if (!order) return
    setProgress('preparando')
    const { invoice: created } = await issueInvoice(order, setProgress)
    if (created.status === 'autorizada') {
      toast.success('NFS-e autorizada', { description: `Nota ${created.number}` })
    } else {
      toast.error('NFS-e rejeitada', { description: created.error })
    }
  }, [order])

  /* Emissão automática quando a operação está configurada para isso. */
  React.useEffect(() => {
    if (started.current) return
    if (!order || order.paymentStatus !== 'pago' || invoice) return
    if (!settings.autoIssueInvoice) return
    started.current = true
    void run()
  }, [order, invoice, settings.autoIssueInvoice, run])

  if (!order) return null

  const notPayable = order.paymentStatus !== 'pago'
  const currentStageIndex = progress ? stages.findIndex((stage) => stage.id === progress) : -1

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">Nota fiscal de serviço</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          A NFS-e é transmitida à prefeitura e fica anexada à OS {order.code}.
        </p>
      </div>

      {notPayable && !invoice ? (
        <div className="rounded-lg border border-warning/30 bg-warning/8 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="text-[13px] font-medium">Emissão pendente de pagamento</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {flow.payment === 'faturado'
                  ? 'Clientes faturados recebem uma nota única no fechamento do período.'
                  : 'Assim que o pagamento for registrado, a nota pode ser emitida pela tela do atendimento.'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {invoice?.status === 'autorizada' ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-lg border border-success/30 bg-success/6"
          >
            <div className="flex items-center gap-3 border-b border-success/20 px-4 py-3">
              <span className="grid size-9 place-items-center rounded-full bg-success/15 text-success">
                <ShieldCheck className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">NFS-e autorizada</p>
                <p className="text-[12px] text-muted-foreground">
                  Emitida em {invoice.issuedAt ? dateTime(invoice.issuedAt) : '—'}
                </p>
              </div>
              <Badge variant="success">Autorizada</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
              <Info label="Número" value={invoice.number} />
              <Info label="Código de verificação" value={invoice.verificationCode} />
              <Info label="Valor" value={currency(invoice.amount)} />
              <Info label="Tomador" value={invoice.customerName} />
            </div>

            <Separator className="bg-success/20" />

            <div className="flex flex-wrap gap-2 p-3">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPreviewOpen(true)}>
                <FileText className="size-3.5" />
                Visualizar PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  downloadFile(
                    `NFSe-${invoice.number}.xml`,
                    invoiceXML(invoice, order),
                    'application/xml',
                  )
                  toast.success('XML baixado')
                }}
              >
                <FileCode2 className="size-3.5" />
                Baixar XML
              </Button>
            </div>
          </motion.div>
        ) : invoice?.status === 'erro' ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-destructive/30 bg-destructive/6 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">Nota rejeitada</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{invoice.error}</p>
                <Button size="sm" className="mt-3 gap-1.5" onClick={run}>
                  <RefreshCw className="size-3.5" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </motion.div>
        ) : progress ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <ol className="space-y-3">
              {stages.map((stage, index) => {
                const done = currentStageIndex > index || progress === 'autorizada'
                const active = currentStageIndex === index && progress !== 'autorizada'
                return (
                  <li key={stage.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-full border transition-colors',
                        done
                          ? 'border-success bg-success/15 text-success'
                          : active
                            ? 'border-primary bg-primary/12 text-primary'
                            : 'border-border text-muted-foreground',
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : active ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-[13px]',
                        done || active ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {stage.label}
                    </span>
                  </li>
                )
              })}
            </ol>
          </motion.div>
        ) : !notPayable ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div>
              <p className="text-[13px] font-medium">Pronto para emitir</p>
              <p className="text-[12px] text-muted-foreground">
                Valor de {currency(order.total)} para {order.customerName}
              </p>
            </div>
            <Button className="gap-2" onClick={run}>
              <FileText className="size-4" />
              Emitir NFS-e
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <InvoicePreviewDialog invoice={invoice} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="tabular truncate text-[13px] font-medium">{value}</p>
    </div>
  )
}
