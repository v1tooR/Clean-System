import * as React from 'react'
import { FileDown, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ThermalReceipt } from '@/components/shared/thermal-receipt'
import { useDataStore } from '@/store/data-store'
import { printArea } from '@/lib/print'
import { cn } from '@/lib/utils'
import type { NewOrderFlow } from '../use-new-order'

export function StepReceipt({ flow }: { flow: NewOrderFlow }) {
  const company = useDataStore((state) => state.company)
  const orders = useDataStore((state) => state.orders)
  const invoices = useDataStore((state) => state.invoices)
  const markPrinted = useDataStore((state) => state.markOrderPrinted)
  const settings = useDataStore((state) => state.settings)

  const order = orders.find((item) => item.id === flow.createdOrder?.id) ?? flow.createdOrder
  const invoice = invoices.find((item) => item.orderId === order?.id)

  if (!order) return null

  function print(asPdf: boolean) {
    if (!order) return
    markPrinted(order.id)
    toast[asPdf ? 'info' : 'success'](
      asPdf ? 'Gerando PDF' : 'Enviado para a impressora',
      {
        description: asPdf
          ? 'Escolha “Salvar como PDF” na janela de impressão.'
          : `Comprovante da OS ${order.code} · térmica 80mm`,
      },
    )
    setTimeout(() => printArea('thermal'), 300)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">Comprovante do cliente</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Entregue a via impressa com o código de retirada{' '}
          <strong className="tabular text-foreground">{order.pickupCode}</strong>.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          className={cn('gap-2', settings.autoPrintReceipt && 'animate-pulse-ring')}
          onClick={() => print(false)}
        >
          <Printer className="size-4" />
          Imprimir comprovante
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => print(true)}>
          <FileDown className="size-4" />
          Gerar PDF
        </Button>
        {settings.autoPrintReceipt ? (
          <span className="text-[12px] text-muted-foreground">
            Impressão em destaque conforme as configurações da operação
          </span>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-5">
        <ThermalReceipt
          order={order}
          customer={flow.customer ?? undefined}
          company={company}
          invoice={invoice}
        />
      </div>
    </div>
  )
}
