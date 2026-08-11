import * as React from 'react'
import { format } from 'date-fns'
import { CalendarClock, Package, Percent, Plus, Star } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch, Separator } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { currency, dueLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NewOrderFlow } from '../use-new-order'

export function StepSummary({ flow }: { flow: NewOrderFlow }) {
  const discountPercent = flow.subtotal > 0 ? (flow.discount / flow.subtotal) * 100 : 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">Confira antes de cobrar</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Ajuste descontos, acréscimos e a previsão de entrega combinada com o cliente.
        </p>
      </div>

      {/* Itens */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="text-[13px] font-semibold">Serviços</p>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Package className="size-3.5" />
            {flow.pieces} peças
          </span>
        </div>
        <ul className="divide-y divide-border/70">
          {flow.items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 px-4 py-2.5">
              <span className="tabular grid size-6 shrink-0 place-items-center rounded bg-muted text-[11px] font-semibold">
                {item.quantity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px]">{item.garmentName}</p>
                <p className="text-[11px] text-muted-foreground">{item.serviceName}</p>
              </div>
              <span className="tabular text-[13px]">
                {currency((item.unitPrice ?? 0) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ajustes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Percent className="size-3.5 text-muted-foreground" />
            Desconto (R$)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={flow.discount || ''}
            onChange={(event) => flow.setDiscount(Math.max(0, Number(event.target.value) || 0))}
            placeholder="0,00"
            className="tabular"
          />
          {discountPercent > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              {discountPercent.toFixed(1).replace('.', ',')}% do subtotal
              {flow.customer?.kind === 'PJ' && flow.customer.billing.discountPercent > 0
                ? ' · desconto contratual aplicado'
                : ''}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Plus className="size-3.5 text-muted-foreground" />
            Acréscimo (R$)
          </Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={flow.surcharge || ''}
            onChange={(event) => flow.setSurcharge(Math.max(0, Number(event.target.value) || 0))}
            placeholder="0,00"
            className="tabular"
          />
          <p className="text-[11px] text-muted-foreground">Ex.: urgência, transporte, tratamento</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5 text-muted-foreground" />
            Previsão de entrega
          </Label>
          <Input
            type="datetime-local"
            value={format(flow.dueAt, "yyyy-MM-dd'T'HH:mm")}
            onChange={(event) => {
              const value = new Date(event.target.value)
              if (!Number.isNaN(value.getTime())) flow.setDueAt(value)
            }}
            className="tabular"
          />
          <p className="text-[11px] text-muted-foreground">
            Sugerido pelo prazo das peças · <strong>{dueLabel(flow.dueAt)}</strong>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Observações do atendimento</Label>
          <Textarea
            value={flow.notes}
            onChange={(event) => flow.setNotes(event.target.value)}
            placeholder="Combinados com o cliente, instruções de retirada…"
            className="min-h-[38px]"
          />
        </div>
      </div>

      <label
        className={cn(
          'flex cursor-pointer items-center justify-between rounded-lg border p-3.5 transition-colors',
          flow.priority ? 'border-warning/40 bg-warning/8' : 'border-border bg-card',
        )}
      >
        <span className="flex items-center gap-2.5">
          <Star className={cn('size-4', flow.priority ? 'fill-warning text-warning' : 'text-muted-foreground')} />
          <span>
            <span className="block text-[13px] font-medium">Atendimento prioritário</span>
            <span className="block text-[11px] text-muted-foreground">
              Antecipa o prazo e destaca a OS na produção
            </span>
          </span>
        </span>
        <Switch checked={flow.priority} onCheckedChange={flow.setPriority} />
      </label>

      {/* Total */}
      <div className="rounded-lg border border-border bg-card-elevated p-4">
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular">{currency(flow.subtotal)}</span>
          </div>
          {flow.discount > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <span className="tabular text-success">− {currency(flow.discount)}</span>
            </div>
          ) : null}
          {flow.surcharge > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Acréscimo</span>
              <span className="tabular">+ {currency(flow.surcharge)}</span>
            </div>
          ) : null}
        </div>

        <Separator className="my-3" />

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground">Total a pagar</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="neutral" size="sm">
                {flow.pieces} peças
              </Badge>
              <Badge variant="neutral" size="sm">
                {dueLabel(flow.dueAt)}
              </Badge>
            </div>
          </div>
          <p className="tabular text-[34px] font-semibold leading-none tracking-tight text-primary">
            {currency(flow.total)}
          </p>
        </div>
      </div>
    </div>
  )
}
