import * as React from 'react'
import { FileDown, Printer } from 'lucide-react'
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
import { ThermalReceipt } from '@/components/shared/thermal-receipt'
import { printArea } from '@/lib/print'
import { useDataStore } from '@/store/data-store'
import type { Order } from '@/types'

interface ReceiptDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiptDialog({ order, open, onOpenChange }: ReceiptDialogProps) {
  const company = useDataStore((state) => state.company)
  const customers = useDataStore((state) => state.customers)
  const invoices = useDataStore((state) => state.invoices)
  const markPrinted = useDataStore((state) => state.markOrderPrinted)

  if (!order) return null

  const customer = customers.find((item) => item.id === order.customerId)
  const invoice = invoices.find((item) => item.orderId === order.id)

  function handlePrint(asPdf: boolean) {
    if (!order) return
    markPrinted(order.id)
    if (asPdf) {
      toast.info('Gerando PDF', {
        description: 'Na janela de impressão, escolha “Salvar como PDF” como destino.',
      })
    } else {
      toast.success('Enviado para a impressora', {
        description: `Comprovante da OS ${order.code} · térmica 80mm`,
      })
    }
    setTimeout(() => printArea('thermal'), 350)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Comprovante da OS {order.code}</DialogTitle>
          <DialogDescription>
            Pré-visualização da via térmica de 80mm entregue ao cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[52vh] overflow-y-auto rounded-lg bg-muted/40 p-4">
          <ThermalReceipt order={order} customer={customer} company={company} invoice={invoice} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handlePrint(true)} className="gap-2">
            <FileDown className="size-4" />
            Gerar PDF
          </Button>
          <Button onClick={() => handlePrint(false)} className="gap-2">
            <Printer className="size-4" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
