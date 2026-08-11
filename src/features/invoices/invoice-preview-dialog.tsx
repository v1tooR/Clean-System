import { FileCode2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/misc'
import { useDataStore } from '@/store/data-store'
import { currency, dateTime } from '@/lib/format'
import { downloadFile, invoiceXML } from '@/services/fiscal.service'
import { printArea } from '@/lib/print'
import type { Invoice, Order } from '@/types'

interface InvoicePreviewDialogProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-black/50">{label}</p>
      <p className="truncate text-[12px] font-medium text-black">{value}</p>
    </div>
  )
}

export function InvoicePreviewDialog({ invoice, open, onOpenChange }: InvoicePreviewDialogProps) {
  const company = useDataStore((state) => state.company)
  const orders = useDataStore((state) => state.orders)

  if (!invoice) return null
  const order: Order | undefined = orders.find((item) => item.id === invoice.orderId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>NFS-e {invoice.number}</DialogTitle>
          <DialogDescription>
            Documento auxiliar da nota fiscal de serviço eletrônica.
          </DialogDescription>
        </DialogHeader>

        <div className="print-area max-h-[58vh] overflow-y-auto rounded-lg bg-white p-6 text-black shadow-inner">
          <div className="flex items-start justify-between gap-4 border-b border-black/15 pb-4">
            <div>
              <p className="text-[15px] font-bold uppercase">{company.tradeName}</p>
              <p className="text-[11px] text-black/70">{company.legalName}</p>
              <p className="text-[11px] text-black/70">
                CNPJ {company.cnpj} · IM {company.municipalRegistration}
              </p>
              <p className="text-[11px] text-black/70">
                {company.address} — {company.city}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-black/50">NFS-e nº</p>
              <p className="text-[20px] font-bold leading-tight">{invoice.number}</p>
              <p className="text-[11px] text-black/70">Código {invoice.verificationCode}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-4">
            <Field label="Emissão" value={invoice.issuedAt ? dateTime(invoice.issuedAt) : '—'} />
            <Field label="Competência" value={invoice.issuedAt ? dateTime(invoice.issuedAt) : '—'} />
            <Field label="Regime" value={company.taxRegime} />
            <Field label="ISS" value={`${company.issRate}%`} />
          </div>

          <Separator className="bg-black/10" />

          <div className="py-4">
            <p className="text-[10px] uppercase tracking-wider text-black/50">Tomador do serviço</p>
            <p className="text-[13px] font-semibold">{invoice.customerName}</p>
          </div>

          <Separator className="bg-black/10" />

          <div className="py-4">
            <p className="text-[10px] uppercase tracking-wider text-black/50">
              Discriminação dos serviços
            </p>
            <p className="text-[12px]">
              {company.serviceCode} — Serviços de lavanderia referentes à OS {order?.code ?? '—'}.
            </p>
            <div className="mt-3 space-y-1">
              {order?.items.map((item) => (
                <div key={item.id} className="flex justify-between text-[12px]">
                  <span>
                    {item.quantity}x {item.garmentName} · {item.serviceName}
                  </span>
                  <span className="tabular">{currency(item.quantity * item.unitPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-baseline justify-between border-t border-black/15 pt-4">
            <span className="text-[13px] font-semibold uppercase">Valor total da nota</span>
            <span className="tabular text-[20px] font-bold">{currency(invoice.amount)}</span>
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-black/50">
            Documento emitido em ambiente de homologação para demonstração. A autenticidade pode ser
            verificada no portal da prefeitura informando o número da nota e o código de verificação.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              downloadFile(
                `NFSe-${invoice.number}.xml`,
                invoiceXML(invoice, order),
                'application/xml',
              )
              toast.success('XML baixado', { description: `NFSe-${invoice.number}.xml` })
            }}
          >
            <FileCode2 className="size-4" />
            Baixar XML
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              toast.info('Gerando PDF', {
                description: 'Escolha “Salvar como PDF” na janela de impressão.',
              })
              setTimeout(() => printArea('document'), 300)
            }}
          >
            <Printer className="size-4" />
            Imprimir / PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
