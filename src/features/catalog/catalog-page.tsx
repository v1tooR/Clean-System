import * as React from 'react'
import { MoreHorizontal, Pencil, Plus, Search, Shirt, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/misc'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchInput } from '@/components/shared/search-input'
import { EmptyState } from '@/components/shared/states'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { GarmentFormDialog } from './garment-form-dialog'
import { usePageHeader } from '@/components/layout/header-slot'
import { garmentCategories } from '@/data/catalog'
import { useDataStore } from '@/store/data-store'
import { garmentIcon } from '@/lib/icons'
import { currency } from '@/lib/format'
import { cn, normalize } from '@/lib/utils'
import type { Garment } from '@/types'

export function CatalogPage() {
  const garments = useDataStore((state) => state.garments)
  const services = useDataStore((state) => state.services)
  const orders = useDataStore((state) => state.orders)
  const upsertGarment = useDataStore((state) => state.upsertGarment)
  const toggleGarmentActive = useDataStore((state) => state.toggleGarmentActive)
  const removeGarment = useDataStore((state) => state.removeGarment)
  const toggleServiceActive = useDataStore((state) => state.toggleServiceActive)

  const [search, setSearch] = React.useState('')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Garment | null>(null)
  const [removing, setRemoving] = React.useState<Garment | null>(null)
  const [priceDraft, setPriceDraft] = React.useState<Record<string, string>>({})

  usePageHeader(
    {
      title: 'Peças e Serviços',
      description: 'Tabela de preços usada no atendimento',
      actions: (
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova peça</span>
        </Button>
      ),
    },
    [],
  )

  const filtered = React.useMemo(() => {
    const term = normalize(search)
    return garments.filter((garment) => !term || normalize(garment.name).includes(term))
  }, [garments, search])

  const byCategory = React.useMemo(() => {
    const map = new Map<string, Garment[]>()
    filtered.forEach((garment) => {
      map.set(garment.category, [...(map.get(garment.category) ?? []), garment])
    })
    return map
  }, [filtered])

  /** Edição rápida de preço direto na lista. */
  function commitPrice(garment: Garment, serviceId: string, raw: string) {
    const value = Number(raw.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) return
    const current = garment.prices.find((price) => price.serviceId === serviceId)
    if (current && Math.abs(current.price - value) < 0.005) return

    upsertGarment({
      ...garment,
      prices: garment.prices.map((price) =>
        price.serviceId === serviceId ? { ...price, price: value } : price,
      ),
    })
    toast.success('Preço atualizado', {
      description: `${garment.name} · ${services.find((s) => s.id === serviceId)?.name} · ${currency(value)}`,
    })
  }

  function usageCount(garmentId: string) {
    return orders.reduce(
      (acc, order) =>
        acc + order.items.filter((item) => item.garmentId === garmentId).reduce((sum) => sum + 1, 0),
      0,
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pecas">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="pecas">Peças ({garments.length})</TabsTrigger>
            <TabsTrigger value="servicos">Serviços ({services.length})</TabsTrigger>
          </TabsList>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar peça…"
            containerClassName="max-w-xs"
          />
        </div>

        <TabsContent value="pecas" className="space-y-5">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhuma peça encontrada"
              description="Ajuste a busca ou cadastre uma nova peça na tabela de preços."
              action={
                <Button
                  className="gap-2"
                  onClick={() => {
                    setEditing(null)
                    setFormOpen(true)
                  }}
                >
                  <Plus className="size-4" />
                  Nova peça
                </Button>
              }
            />
          ) : (
            Array.from(byCategory.entries()).map(([category, items]) => (
              <section key={category} className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-[13px] font-semibold">
                    {garmentCategories[category]?.label ?? category}
                  </h2>
                  <span className="text-[11px] text-muted-foreground">
                    {garmentCategories[category]?.description}
                  </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <ul className="divide-y divide-border/70">
                    {items.map((garment) => {
                      const Icon = garmentIcon(garment.icon)
                      return (
                        <li
                          key={garment.id}
                          className={cn(
                            'flex flex-col gap-3 p-3.5 transition-colors sm:flex-row sm:items-center',
                            !garment.active && 'opacity-55',
                          )}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                              <Icon className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 text-[13px] font-medium">
                                {garment.name}
                                {!garment.active ? (
                                  <Badge variant="neutral" size="sm">
                                    Inativa
                                  </Badge>
                                ) : null}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Prazo {garment.leadTimeDays} dias · {usageCount(garment.id)} usos
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {garment.prices.map((price) => {
                              const service = services.find((item) => item.id === price.serviceId)
                              if (!service) return null
                              const key = `${garment.id}:${price.serviceId}`
                              const draft = priceDraft[key]

                              return (
                                <div
                                  key={price.serviceId}
                                  className="flex items-center gap-1.5 rounded-md border border-border bg-background/50 py-1 pl-2.5 pr-1"
                                >
                                  <span className="text-[11px] text-muted-foreground">
                                    {service.name}
                                  </span>
                                  <Input
                                    value={draft ?? price.price.toFixed(2).replace('.', ',')}
                                    onChange={(event) =>
                                      setPriceDraft((current) => ({
                                        ...current,
                                        [key]: event.target.value,
                                      }))
                                    }
                                    onBlur={(event) => {
                                      commitPrice(garment, price.serviceId, event.target.value)
                                      setPriceDraft((current) => {
                                        const next = { ...current }
                                        delete next[key]
                                        return next
                                      })
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') event.currentTarget.blur()
                                    }}
                                    inputMode="decimal"
                                    aria-label={`Preço de ${service.name} para ${garment.name}`}
                                    className="tabular h-7 w-[68px] border-0 bg-transparent px-1 text-right text-[12px] font-medium shadow-none focus-visible:ring-1"
                                  />
                                </div>
                              )
                            })}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" aria-label="Ações da peça">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setEditing(garment)
                                    setFormOpen(true)
                                  }}
                                >
                                  <Pencil />
                                  Editar peça
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    toggleGarmentActive(garment.id)
                                    toast.success(
                                      garment.active ? 'Peça desativada' : 'Peça reativada',
                                      { description: garment.name },
                                    )
                                  }}
                                >
                                  {garment.active ? 'Desativar' : 'Reativar'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  destructive
                                  onSelect={() => setRemoving(garment)}
                                >
                                  <Trash2 />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </section>
            ))
          )}
        </TabsContent>

        <TabsContent value="servicos">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <ul className="divide-y divide-border/70">
              {services.map((service) => {
                const used = garments.filter((garment) =>
                  garment.prices.some((price) => price.serviceId === service.id),
                ).length
                const average =
                  garments
                    .flatMap((garment) => garment.prices)
                    .filter((price) => price.serviceId === service.id)
                    .reduce((acc, price, _, list) => acc + price.price / list.length, 0) || 0

                return (
                  <li key={service.id} className="flex items-center gap-3 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">{service.name}</p>
                      <p className="text-[12px] text-muted-foreground">{service.description}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="tabular text-[13px] font-medium">{currency(average)}</p>
                      <p className="text-[11px] text-muted-foreground">preço médio</p>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {used} peças
                    </Badge>
                    <Switch
                      checked={service.active}
                      onCheckedChange={() => {
                        toggleServiceActive(service.id)
                        toast.success(
                          service.active ? 'Serviço desativado' : 'Serviço reativado',
                          {
                            description: service.active
                              ? `${service.name} deixa de aparecer no atendimento (${used} peças afetadas).`
                              : `${service.name} voltou a ficar disponível no atendimento.`,
                          },
                        )
                      }}
                      aria-label={`Ativar ou desativar ${service.name}`}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      <GarmentFormDialog
        open={formOpen}
        onOpenChange={(value) => {
          setFormOpen(value)
          if (!value) setEditing(null)
        }}
        garment={editing}
      />

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(value) => !value && setRemoving(null)}
        destructive
        icon={Trash2}
        title={`Excluir ${removing?.name}?`}
        description="A peça deixa de aparecer no atendimento. Os atendimentos já registrados continuam intactos."
        confirmLabel="Excluir peça"
        onConfirm={() => {
          if (!removing) return
          removeGarment(removing.id)
          toast.success('Peça excluída', { description: removing.name })
          setRemoving(null)
        }}
      />
    </div>
  )
}
