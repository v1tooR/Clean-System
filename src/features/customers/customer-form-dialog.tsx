import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, UserRound } from 'lucide-react'
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
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch, Separator } from '@/components/ui/misc'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataStore } from '@/store/data-store'
import { formatCNPJ, formatCPF, formatPhone } from '@/lib/format'
import { isValidCNPJ, isValidCPF, isValidPhone } from '@/lib/validators'
import { uid } from '@/lib/utils'
import type { Customer, CustomerKind } from '@/types'

const baseSchema = {
  phone: z.string().refine(isValidPhone, 'Informe um telefone válido com DDD'),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  notes: z.string().optional(),
}

const pfSchema = z.object({
  ...baseSchema,
  name: z.string().min(3, 'Informe o nome completo'),
  cpf: z
    .string()
    .optional()
    .refine((value) => !value || isValidCPF(value), 'CPF inválido'),
})

const pjSchema = z.object({
  ...baseSchema,
  name: z.string().min(3, 'Informe a razão social'),
  tradeName: z.string().min(2, 'Informe o nome fantasia'),
  cnpj: z.string().refine(isValidCNPJ, 'CNPJ inválido'),
  contactName: z.string().min(3, 'Informe o contato responsável'),
  cycle: z.enum(['quinzenal', 'mensal']),
  dueDay: z.coerce.number().min(1, 'Entre 1 e 28').max(28, 'Entre 1 e 28'),
  discountPercent: z.coerce.number().min(0).max(50, 'Máximo de 50%'),
  billingEnabled: z.boolean(),
})

type PFValues = z.infer<typeof pfSchema>
type PJValues = z.infer<typeof pjSchema>

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Cliente existente = edição. */
  customer?: Customer | null
  /** Texto digitado na busca, aproveitado como nome inicial. */
  initialQuery?: string
  onCreated?: (customer: Customer) => void
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  initialQuery,
  onCreated,
}: CustomerFormDialogProps) {
  const createCustomer = useDataStore((state) => state.createCustomer)
  const updateCustomer = useDataStore((state) => state.updateCustomer)
  const [kind, setKind] = React.useState<CustomerKind>(customer?.kind ?? 'PF')
  const [saving, setSaving] = React.useState(false)

  const pfForm = useForm<PFValues>({
    resolver: zodResolver(pfSchema),
    defaultValues: { name: '', cpf: '', phone: '', email: '', notes: '' },
  })

  const pjForm = useForm<PJValues>({
    resolver: zodResolver(pjSchema),
    defaultValues: {
      name: '',
      tradeName: '',
      cnpj: '',
      contactName: '',
      phone: '',
      email: '',
      notes: '',
      cycle: 'mensal',
      dueDay: 10,
      discountPercent: 0,
      billingEnabled: true,
    },
  })

  // Reidrata o formulário sempre que o diálogo abre
  React.useEffect(() => {
    if (!open) return
    const suggestedName = initialQuery && /\D/.test(initialQuery) ? initialQuery : ''

    if (customer?.kind === 'PJ') {
      setKind('PJ')
      pjForm.reset({
        name: customer.name,
        tradeName: customer.tradeName,
        cnpj: customer.cnpj,
        contactName: customer.contactName,
        phone: customer.phone,
        email: customer.email ?? '',
        notes: customer.notes ?? '',
        cycle: customer.billing.cycle,
        dueDay: customer.billing.dueDay,
        discountPercent: customer.billing.discountPercent,
        billingEnabled: customer.billing.enabled,
      })
    } else if (customer?.kind === 'PF') {
      setKind('PF')
      pfForm.reset({
        name: customer.name,
        cpf: customer.cpf,
        phone: customer.phone,
        email: customer.email ?? '',
        notes: customer.notes ?? '',
      })
    } else {
      setKind('PF')
      pfForm.reset({ name: suggestedName, cpf: '', phone: '', email: '', notes: '' })
      pjForm.reset({
        name: suggestedName,
        tradeName: '',
        cnpj: '',
        contactName: '',
        phone: '',
        email: '',
        notes: '',
        cycle: 'mensal',
        dueDay: 10,
        discountPercent: 0,
        billingEnabled: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer, initialQuery])

  async function submitPF(values: PFValues) {
    setSaving(true)
    const payload: Customer = {
      id: customer?.id ?? uid('cli'),
      kind: 'PF',
      name: values.name.trim(),
      cpf: values.cpf ? formatCPF(values.cpf) : '',
      phone: formatPhone(values.phone),
      email: values.email || undefined,
      notes: values.notes || undefined,
      active: customer?.active ?? true,
      createdAt: customer?.createdAt ?? new Date().toISOString(),
    }
    finish(payload)
  }

  async function submitPJ(values: PJValues) {
    setSaving(true)
    const payload: Customer = {
      id: customer?.id ?? uid('cli'),
      kind: 'PJ',
      name: values.name.trim(),
      tradeName: values.tradeName.trim(),
      cnpj: formatCNPJ(values.cnpj),
      contactName: values.contactName.trim(),
      phone: formatPhone(values.phone),
      email: values.email || undefined,
      notes: values.notes || undefined,
      active: customer?.active ?? true,
      createdAt: customer?.createdAt ?? new Date().toISOString(),
      billing: {
        enabled: values.billingEnabled,
        cycle: values.cycle,
        dueDay: values.dueDay,
        discountPercent: values.discountPercent,
      },
    }
    finish(payload)
  }

  function finish(payload: Customer) {
    if (customer) {
      updateCustomer(customer.id, payload)
      toast.success('Cliente atualizado', { description: payload.name })
    } else {
      createCustomer(payload)
      toast.success('Cliente cadastrado', {
        description: `${payload.kind === 'PJ' ? payload.tradeName : payload.name} já pode ser usado no atendimento.`,
      })
      onCreated?.(payload)
    }
    setSaving(false)
    onOpenChange(false)
  }

  const pf = pfForm.formState.errors
  const pj = pjForm.formState.errors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
          <DialogDescription>
            {customer
              ? 'Atualize os dados cadastrais do cliente.'
              : 'Cadastro rápido — apenas nome e telefone são obrigatórios para pessoa física.'}
          </DialogDescription>
        </DialogHeader>

        {!customer ? (
          <Tabs value={kind} onValueChange={(value) => setKind(value as CustomerKind)}>
            <TabsList className="w-full">
              <TabsTrigger value="PF" className="flex-1 gap-1.5">
                <UserRound className="size-3.5" />
                Pessoa física
              </TabsTrigger>
              <TabsTrigger value="PJ" className="flex-1 gap-1.5">
                <Building2 className="size-3.5" />
                Pessoa jurídica
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null}

        {kind === 'PF' ? (
          <form
            id="customer-form"
            onSubmit={pfForm.handleSubmit(submitPF)}
            className="space-y-3.5"
          >
            <Field label="Nome completo" error={pf.name?.message} required>
              <Input {...pfForm.register('name')} placeholder="Ex.: Mariana Alves Ferreira" autoFocus />
            </Field>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="CPF" error={pf.cpf?.message} hint="Necessário apenas para NFS-e">
                <Input
                  {...pfForm.register('cpf', {
                    onChange: (event) => pfForm.setValue('cpf', formatCPF(event.target.value)),
                  })}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="tabular"
                />
              </Field>
              <Field label="Telefone" error={pf.phone?.message} required>
                <Input
                  {...pfForm.register('phone', {
                    onChange: (event) => pfForm.setValue('phone', formatPhone(event.target.value)),
                  })}
                  placeholder="(11) 90000-0000"
                  inputMode="tel"
                  className="tabular"
                />
              </Field>
            </div>
            <Field label="E-mail" error={pf.email?.message}>
              <Input {...pfForm.register('email')} placeholder="cliente@email.com" type="email" />
            </Field>
            <Field label="Observações">
              <Textarea
                {...pfForm.register('notes')}
                placeholder="Preferências do cliente, instruções de retirada…"
                className="min-h-[64px]"
              />
            </Field>
          </form>
        ) : (
          <form
            id="customer-form"
            onSubmit={pjForm.handleSubmit(submitPJ)}
            className="max-h-[52vh] space-y-3.5 overflow-y-auto pr-1"
          >
            <Field label="Razão social" error={pj.name?.message} required>
              <Input {...pjForm.register('name')} placeholder="Ex.: Hotel Bela Vista Hotelaria S/A" />
            </Field>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Nome fantasia" error={pj.tradeName?.message} required>
                <Input {...pjForm.register('tradeName')} placeholder="Hotel Bela Vista" />
              </Field>
              <Field label="CNPJ" error={pj.cnpj?.message} required>
                <Input
                  {...pjForm.register('cnpj', {
                    onChange: (event) => pjForm.setValue('cnpj', formatCNPJ(event.target.value)),
                  })}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  className="tabular"
                />
              </Field>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Contato responsável" error={pj.contactName?.message} required>
                <Input {...pjForm.register('contactName')} placeholder="Nome do responsável" />
              </Field>
              <Field label="Telefone" error={pj.phone?.message} required>
                <Input
                  {...pjForm.register('phone', {
                    onChange: (event) => pjForm.setValue('phone', formatPhone(event.target.value)),
                  })}
                  placeholder="(11) 3000-0000"
                  inputMode="tel"
                  className="tabular"
                />
              </Field>
            </div>
            <Field label="E-mail financeiro" error={pj.email?.message}>
              <Input {...pjForm.register('email')} placeholder="financeiro@empresa.com.br" />
            </Field>

            <Separator />

            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div>
                <p className="text-[13px] font-medium">Faturamento acumulado</p>
                <p className="text-[12px] text-muted-foreground">
                  Atendimentos entram em um fechamento periódico
                </p>
              </div>
              <Switch
                checked={pjForm.watch('billingEnabled')}
                onCheckedChange={(value) => pjForm.setValue('billingEnabled', value)}
              />
            </div>

            {pjForm.watch('billingEnabled') ? (
              <div className="grid gap-3.5 sm:grid-cols-3">
                <Field label="Ciclo">
                  <Select
                    value={pjForm.watch('cycle')}
                    onValueChange={(value) =>
                      pjForm.setValue('cycle', value as PJValues['cycle'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Dia do vencimento" error={pj.dueDay?.message}>
                  <Input
                    {...pjForm.register('dueDay')}
                    type="number"
                    min={1}
                    max={28}
                    className="tabular"
                  />
                </Field>
                <Field label="Desconto (%)" error={pj.discountPercent?.message}>
                  <Input
                    {...pjForm.register('discountPercent')}
                    type="number"
                    min={0}
                    max={50}
                    className="tabular"
                  />
                </Field>
              </div>
            ) : null}
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="customer-form" loading={saving}>
            {customer ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1">
        {label}
        {required ? <span className="text-primary">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-[12px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
