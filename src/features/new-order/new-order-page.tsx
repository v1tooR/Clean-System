import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Package, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'
import { Stepper, StepPanel } from '@/components/shared/stepper'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { usePageHeader } from '@/components/layout/header-slot'
import { StepCustomer } from './steps/step-customer'
import { StepItems } from './steps/step-items'
import { StepServices } from './steps/step-services'
import { StepSummary } from './steps/step-summary'
import { StepPayment } from './steps/step-payment'
import { StepInvoice } from './steps/step-invoice'
import { StepReceipt } from './steps/step-receipt'
import { StepDone } from './steps/step-done'
import { steps, useNewOrder } from './use-new-order'
import { useDataStore } from '@/store/data-store'
import { currency, dueLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

export function NewOrderPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const customers = useDataStore((state) => state.customers)

  const initialCustomer = React.useMemo(() => {
    const id = searchParams.get('cliente')
    return id ? (customers.find((customer) => customer.id === id) ?? null) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flow = useNewOrder(initialCustomer)
  const [confirmExit, setConfirmExit] = React.useState(false)
  const step = steps[flow.stepIndex]

  const hasDraft = !!flow.customer || flow.items.length > 0

  usePageHeader(
    {
      title: 'Novo atendimento',
      description: 'Registro rápido no balcão',
      breadcrumbs: [{ label: 'Atendimentos', to: '/atendimentos' }, { label: 'Novo' }],
      actions: (
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => (hasDraft && !flow.createdOrder ? setConfirmExit(true) : navigate('/atendimentos'))}
        >
          <X className="size-4" />
          <span className="hidden sm:inline">Cancelar</span>
        </Button>
      ),
    },
    [hasDraft, flow.createdOrder],
  )

  /* ------------------------- Regras de avanço --------------------------- */

  const blocked = React.useMemo(() => {
    switch (step.id) {
      case 'cliente':
        return flow.customer ? null : 'Selecione ou cadastre um cliente para continuar.'
      case 'pecas':
        return flow.items.length > 0 ? null : 'Adicione ao menos uma peça.'
      case 'servicos':
        return flow.missingService.length === 0
          ? null
          : `Escolha o serviço de ${flow.missingService.length} ${flow.missingService.length === 1 ? 'peça' : 'peças'}.`
      case 'resumo':
        return flow.total >= 0 ? null : 'Revise os valores do atendimento.'
      case 'pagamento':
        return flow.payment ? null : 'Escolha a forma de pagamento.'
      default:
        return null
    }
  }, [step.id, flow.customer, flow.items.length, flow.missingService.length, flow.total, flow.payment])

  function handleNext() {
    if (blocked) {
      toast.warning(blocked)
      return
    }

    if (step.id === 'pagamento' && !flow.createdOrder) {
      const created = flow.commitOrder()
      if (created) {
        toast.success(`OS ${created.code} criada`, {
          description: flow.paid
            ? `Pagamento recebido · ${currency(created.total)}`
            : 'Pagamento em aberto — cobrar na retirada.',
        })
      }
    }

    flow.next()
  }

  const showSummaryAside = ['pecas', 'servicos', 'resumo'].includes(step.id)
  const isLastStep = step.id === 'fim'
  const nextLabel = {
    cliente: 'Ir para peças',
    pecas: 'Definir serviços',
    servicos: 'Revisar atendimento',
    resumo: 'Escolher pagamento',
    pagamento: 'Concluir e criar OS',
    nota: 'Revisar comprovante',
    comprovante: 'Finalizar atendimento',
    fim: 'Concluído',
  }[step.id]

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* Stepper */}
      <div className="rounded-lg border border-border bg-card px-4 py-3.5 shadow-xs">
        <Stepper
          steps={steps.map((item) => ({
            id: item.id,
            label: item.label,
            group: item.group,
            description: item.description,
          }))}
          current={flow.stepIndex}
          furthest={flow.createdOrder ? flow.stepIndex : flow.furthest}
          onStepClick={flow.createdOrder ? undefined : flow.goTo}
        />
      </div>

      <div className={cn('grid gap-4', showSummaryAside && 'lg:grid-cols-[1fr_300px]')}>
        <div className="min-w-0 rounded-lg border border-border bg-card p-5">
          <AnimatePresence mode="wait">
            <StepPanel stepKey={step.id}>
              {step.id === 'cliente' ? <StepCustomer flow={flow} /> : null}
              {step.id === 'pecas' ? <StepItems flow={flow} /> : null}
              {step.id === 'servicos' ? <StepServices flow={flow} /> : null}
              {step.id === 'resumo' ? <StepSummary flow={flow} /> : null}
              {step.id === 'pagamento' ? <StepPayment flow={flow} /> : null}
              {step.id === 'nota' ? <StepInvoice flow={flow} /> : null}
              {step.id === 'comprovante' ? <StepReceipt flow={flow} /> : null}
              {step.id === 'fim' ? <StepDone flow={flow} /> : null}
            </StepPanel>
          </AnimatePresence>
        </div>

        {/* Resumo lateral persistente */}
        {showSummaryAside ? (
          <aside className="h-fit rounded-lg border border-border bg-card p-4 lg:sticky lg:top-[76px]">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Resumo do atendimento
            </p>

            {flow.customer ? (
              <div className="mt-2">
                <p className="truncate text-[13px] font-medium">
                  {flow.customer.kind === 'PJ' ? flow.customer.tradeName : flow.customer.name}
                </p>
                <p className="tabular text-[11px] text-muted-foreground">{flow.customer.phone}</p>
              </div>
            ) : null}

            <Separator className="my-3" />

            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Package className="size-3.5" />
                  Peças
                </span>
                <span className="tabular font-medium">{flow.pieces}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular">{currency(flow.subtotal)}</span>
              </div>
              {flow.discount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="tabular text-success">− {currency(flow.discount)}</span>
                </div>
              ) : null}
              {flow.surcharge > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Acréscimo</span>
                  <span className="tabular">+ {currency(flow.surcharge)}</span>
                </div>
              ) : null}
            </div>

            <Separator className="my-3" />

            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="tabular mt-0.5 text-[26px] font-semibold leading-none tracking-tight">
                {currency(flow.total)}
              </p>
              <Badge variant="neutral" size="sm" className="mt-2">
                Entrega {dueLabel(flow.dueAt)}
              </Badge>
            </div>

            {flow.missingService.length > 0 ? (
              <p className="mt-3 rounded-md border border-warning/30 bg-warning/8 p-2 text-[11px] text-warning">
                {flow.missingService.length} peça(s) sem serviço definido
              </p>
            ) : null}
          </aside>
        ) : null}
      </div>

      {/* Navegação */}
      {!isLastStep ? (
        <div className="sticky bottom-0 flex items-end justify-between gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-md backdrop-blur">
          <Button
            variant="ghost"
            onClick={flow.back}
            disabled={flow.stepIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>

          <div className="ml-auto flex min-w-0 flex-col items-end gap-2">
            {blocked ? (
              <p className="max-w-sm text-right text-[12px] font-medium text-warning" role="status">
                Para avançar: {blocked}
              </p>
            ) : null}
            <Button onClick={handleNext} disabled={!!blocked} className="gap-2" size="lg">
              {nextLabel}
              {step.id === 'pagamento' || step.id === 'comprovante' ? (
                <Check className="size-4" />
              ) : (
                <ArrowRight className="size-4" />
              )}
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmExit}
        onOpenChange={setConfirmExit}
        destructive
        title="Descartar este atendimento?"
        description="As peças e valores informados serão perdidos. O cliente não será cobrado."
        confirmLabel="Descartar"
        cancelLabel="Continuar registrando"
        onConfirm={() => navigate('/atendimentos')}
      />
    </div>
  )
}
