import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Copy, Minus, Package, Plus, Search, Tag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmptyState } from '@/components/shared/states'
import { SearchInput } from '@/components/shared/search-input'
import { garmentCategories, itemTags } from '@/data/catalog'
import { useDataStore } from '@/store/data-store'
import { garmentIcon } from '@/lib/icons'
import { currency } from '@/lib/format'
import { cn, normalize } from '@/lib/utils'
import type { NewOrderFlow } from '../use-new-order'

export function StepItems({ flow }: { flow: NewOrderFlow }) {
  const garments = useDataStore((state) => state.garments)
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState<string>('todas')

  const categories = React.useMemo(
    () => ['todas', ...Array.from(new Set(garments.map((garment) => garment.category)))],
    [garments],
  )

  const filtered = React.useMemo(() => {
    const term = normalize(query)
    return garments.filter((garment) => {
      if (!garment.active) return false
      if (category !== 'todas' && garment.category !== category) return false
      if (term && !normalize(garment.name).includes(term)) return false
      return true
    })
  }, [garments, query, category])

  function quantityOf(garmentId: string) {
    return flow.items
      .filter((item) => item.garmentId === garmentId)
      .reduce((acc, item) => acc + item.quantity, 0)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">Quais peças o cliente trouxe?</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Toque para adicionar. Use as observações para registrar manchas e avarias na entrada.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar peça…"
          containerClassName="sm:max-w-xs"
        />
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                'whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[12px] transition-colors',
                category === item
                  ? 'border-primary/50 bg-primary/12 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {item === 'todas' ? 'Todas' : garmentCategories[item]?.label ?? item}
            </button>
          ))}
        </div>
      </div>

      {/* Catálogo */}
      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon={Search}
          title="Nenhuma peça encontrada"
          description="Ajuste a busca ou cadastre a peça em Peças e Serviços."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((garment) => {
            const Icon = garmentIcon(garment.icon)
            const count = quantityOf(garment.id)
            const cheapest = Math.min(...garment.prices.map((price) => price.price))

            return (
              <button
                key={garment.id}
                type="button"
                onClick={() => flow.addGarment(garment.id)}
                className={cn(
                  'group relative flex flex-col gap-2 rounded-lg border p-3 text-left transition-all duration-150 active:scale-[0.98]',
                  count > 0
                    ? 'border-primary/50 bg-primary/8'
                    : 'border-border bg-card hover:border-border/90 hover:bg-card-elevated',
                )}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      'grid size-8 place-items-center rounded-md transition-colors',
                      count > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <AnimatePresence>
                    {count > 0 ? (
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        className="tabular grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
                      >
                        {count}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{garment.name}</p>
                  <p className="tabular text-[11px] text-muted-foreground">
                    a partir de {currency(cheapest)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Itens adicionados */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">Peças adicionadas</h3>
          <span className="tabular text-[12px] text-muted-foreground">
            {flow.pieces} {flow.pieces === 1 ? 'peça' : 'peças'}
          </span>
        </div>

        {flow.items.length === 0 ? (
          <EmptyState
            compact
            icon={Package}
            title="Nenhuma peça adicionada"
            description="Selecione as peças acima para montar o atendimento."
          />
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {flow.items.map((item) => (
                <motion.li
                  key={item.key}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">{item.garmentName}</p>
                      {item.tags.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="warning" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* Controles de quantidade */}
                    <div className="flex items-center gap-1 rounded-md border border-border bg-background/60 p-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Diminuir quantidade"
                        onClick={() => flow.changeQuantity(item.key, -1)}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="tabular w-7 text-center text-[13px] font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Aumentar quantidade"
                        onClick={() => flow.changeQuantity(item.key, 1)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon-sm" aria-label="Observações da peça">
                          <Tag className="size-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72">
                        <p className="text-[13px] font-medium">Observações da peça</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Registrado na entrada e impresso no comprovante.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {itemTags.map((tag) => {
                            const active = item.tags.includes(tag)
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() =>
                                  flow.updateItem(item.key, {
                                    tags: active
                                      ? item.tags.filter((value) => value !== tag)
                                      : [...item.tags, tag],
                                  })
                                }
                                className={cn(
                                  'rounded-md border px-2 py-1 text-[11px] transition-colors',
                                  active
                                    ? 'border-warning/40 bg-warning/12 text-warning'
                                    : 'border-border text-muted-foreground hover:text-foreground',
                                )}
                              >
                                {tag}
                              </button>
                            )
                          })}
                        </div>
                        <Textarea
                          value={item.note ?? ''}
                          onChange={(event) => flow.updateItem(item.key, { note: event.target.value })}
                          placeholder="Observação personalizada…"
                          className="mt-3 min-h-[60px] text-[13px]"
                        />
                      </PopoverContent>
                    </Popover>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Duplicar peça"
                      onClick={() => flow.duplicateItem(item.key)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remover peça"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => flow.removeItem(item.key)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  {item.note ? (
                    <p className="mt-2 border-t border-border/70 pt-2 text-[12px] italic text-muted-foreground">
                      “{item.note}”
                    </p>
                  ) : null}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
