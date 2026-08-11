import * as React from 'react'
import { Check, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/states'
import { useDataStore } from '@/store/data-store'
import { garmentIcon } from '@/lib/icons'
import { currency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NewOrderFlow } from '../use-new-order'

export function StepServices({ flow }: { flow: NewOrderFlow }) {
  const garments = useDataStore((state) => state.garments)
  const services = useDataStore((state) => state.services)

  /** Serviços que existem em todas as peças do atendimento — aplicação em lote. */
  const commonServices = React.useMemo(() => {
    if (flow.items.length < 2) return []
    const lists = flow.items.map(
      (item) =>
        garments.find((garment) => garment.id === item.garmentId)?.prices.map((p) => p.serviceId) ?? [],
    )
    return lists
      .reduce((acc, list) => acc.filter((id) => list.includes(id)), lists[0] ?? [])
      .map((id) => services.find((service) => service.id === id))
      .filter(Boolean)
  }, [flow.items, garments, services])

  function applyToAll(serviceId: string) {
    flow.items.forEach((item) => {
      const garment = garments.find((entry) => entry.id === item.garmentId)
      const price = garment?.prices.find((entry) => entry.serviceId === serviceId)
      if (price) flow.setService(item.key, serviceId, price.price)
    })
  }

  if (flow.items.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Nenhuma peça para configurar"
        description="Volte para a etapa anterior e adicione as peças do cliente."
        action={
          <Button variant="outline" onClick={() => flow.goTo(1)}>
            Voltar para peças
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">
          Qual serviço para cada peça?
        </h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          O preço é calculado por peça e multiplicado pela quantidade.
        </p>
      </div>

      {commonServices.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2.5">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Wand2 className="size-3.5" />
            Aplicar a todas:
          </span>
          {commonServices.map((service) =>
            service ? (
              <Button
                key={service.id}
                variant="outline"
                size="sm"
                className="h-7 text-[12px]"
                onClick={() => applyToAll(service.id)}
              >
                {service.name}
              </Button>
            ) : null,
          )}
        </div>
      ) : null}

      <ul className="space-y-2.5">
        {flow.items.map((item) => {
          const garment = garments.find((entry) => entry.id === item.garmentId)
          const Icon = garmentIcon(garment?.icon ?? '')
          const lineTotal = (item.unitPrice ?? 0) * item.quantity

          return (
            <li key={item.key} className="rounded-lg border border-border bg-card p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium">
                      {item.quantity}x {item.garmentName}
                    </p>
                    {item.tags.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="warning" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="tabular text-[15px] font-semibold">{currency(lineTotal)}</p>
                  {item.unitPrice ? (
                    <p className="tabular text-[11px] text-muted-foreground">
                      {currency(item.unitPrice)} por peça
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {garment?.prices.map((price) => {
                  const service = services.find((entry) => entry.id === price.serviceId)
                  if (!service?.active) return null
                  const active = item.serviceId === price.serviceId

                  return (
                    <button
                      key={price.serviceId}
                      type="button"
                      onClick={() => flow.setService(item.key, price.serviceId, price.price)}
                      className={cn(
                        'group flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary/12'
                          : 'border-border hover:border-border/90 hover:bg-accent/50',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-4 place-items-center rounded-full border transition-colors',
                          active ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                        )}
                      >
                        {active ? <Check className="size-2.5" strokeWidth={4} /> : null}
                      </span>
                      <span className="text-[12px] font-medium">{service.name}</span>
                      <span className="tabular text-[12px] text-muted-foreground">
                        {currency(price.price)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card-elevated px-4 py-3">
        <div>
          <p className="text-[13px] font-medium">Subtotal dos serviços</p>
          <p className="text-[11px] text-muted-foreground">
            {flow.pieces} peças · {flow.items.length} linhas
          </p>
        </div>
        <p className="tabular text-[20px] font-semibold tracking-tight">
          {currency(flow.subtotal)}
        </p>
      </div>
    </div>
  )
}
