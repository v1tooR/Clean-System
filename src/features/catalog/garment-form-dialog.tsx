import * as React from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/misc'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { garmentCategories } from '@/data/catalog'
import { useDataStore } from '@/store/data-store'
import { garmentIcon, garmentIconNames } from '@/lib/icons'
import { uid, cn } from '@/lib/utils'
import type { Garment, GarmentCategory } from '@/types'

interface GarmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  garment?: Garment | null
}

export function GarmentFormDialog({ open, onOpenChange, garment }: GarmentFormDialogProps) {
  const services = useDataStore((state) => state.services)
  const upsertGarment = useDataStore((state) => state.upsertGarment)

  const [name, setName] = React.useState('')
  const [category, setCategory] = React.useState<GarmentCategory>('vestuario')
  const [icon, setIcon] = React.useState('Shirt')
  const [leadTimeDays, setLeadTimeDays] = React.useState(2)
  const [prices, setPrices] = React.useState<Record<string, string>>({})
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setError(null)
    if (garment) {
      setName(garment.name)
      setCategory(garment.category)
      setIcon(garment.icon)
      setLeadTimeDays(garment.leadTimeDays)
      setPrices(
        Object.fromEntries(
          garment.prices.map((price) => [price.serviceId, price.price.toFixed(2).replace('.', ',')]),
        ),
      )
    } else {
      setName('')
      setCategory('vestuario')
      setIcon('Shirt')
      setLeadTimeDays(2)
      setPrices({})
    }
  }, [open, garment])

  function save() {
    if (name.trim().length < 2) {
      setError('Informe o nome da peça.')
      return
    }
    const parsed = Object.entries(prices)
      .map(([serviceId, value]) => ({
        serviceId,
        price: Number(String(value).replace(',', '.')),
      }))
      .filter((entry) => Number.isFinite(entry.price) && entry.price > 0)

    if (parsed.length === 0) {
      setError('Defina o preço de ao menos um serviço.')
      return
    }

    const payload: Garment = {
      id: garment?.id ?? uid('grm'),
      name: name.trim(),
      category,
      icon,
      active: garment?.active ?? true,
      leadTimeDays,
      prices: parsed,
    }

    upsertGarment(payload)
    toast.success(garment ? 'Peça atualizada' : 'Peça cadastrada', { description: payload.name })
    onOpenChange(false)
  }

  const Icon = garmentIcon(icon)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{garment ? 'Editar peça' : 'Nova peça'}</DialogTitle>
          <DialogDescription>
            Defina os serviços disponíveis e o preço cobrado por peça.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[56vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <div className="space-y-1.5">
              <Label>Ícone</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="w-[92px]">
                  <span className="flex items-center gap-2">
                    <Icon className="size-4" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {garmentIconNames.map((name) => {
                    const Option = garmentIcon(name)
                    return (
                      <SelectItem key={name} value={name}>
                        <span className="flex items-center gap-2">
                          <Option className="size-4" />
                          {name}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome da peça</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Camisa social"
                autoFocus
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as GarmentCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(garmentCategories).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prazo padrão (dias)</Label>
              <Input
                type="number"
                min={1}
                max={15}
                value={leadTimeDays}
                onChange={(event) => setLeadTimeDays(Number(event.target.value) || 1)}
                className="tabular"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Serviços e preços</Label>
            <p className="text-[11px] text-muted-foreground">
              Deixe em branco os serviços que não se aplicam a esta peça.
            </p>
            <div className="space-y-1.5">
              {services.map((service) => {
                const value = prices[service.id] ?? ''
                const enabled = value !== ''
                return (
                  <div
                    key={service.id}
                    className={cn(
                      'flex items-center gap-3 rounded-md border p-2.5 transition-colors',
                      enabled ? 'border-primary/30 bg-primary/6' : 'border-border',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">{service.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {service.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] text-muted-foreground">R$</span>
                      <Input
                        value={value}
                        onChange={(event) =>
                          setPrices((current) => ({ ...current, [service.id]: event.target.value }))
                        }
                        placeholder="0,00"
                        inputMode="decimal"
                        className="tabular h-8 w-24 text-right"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {error ? <p className="text-[12px] text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>{garment ? 'Salvar alterações' : 'Cadastrar peça'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
