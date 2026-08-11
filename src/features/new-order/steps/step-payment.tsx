import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, CreditCard, Loader2, QrCode, RefreshCw, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'
import { PaymentMethodSelector } from '@/components/shared/payment-method-selector'
import { PixQrCode } from '../pix-qrcode'
import { useDataStore } from '@/store/data-store'
import { awaitPixConfirmation, createPixCharge, type PixCharge } from '@/services/fiscal.service'
import { currency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NewOrderFlow } from '../use-new-order'

type PixState = 'idle' | 'gerando' | 'aguardando' | 'confirmado'

export function StepPayment({ flow }: { flow: NewOrderFlow }) {
  const settings = useDataStore((state) => state.settings)
  const [pixState, setPixState] = React.useState<PixState>('idle')
  const [charge, setCharge] = React.useState<PixCharge | null>(null)
  const [received, setReceived] = React.useState('')
  const abortRef = React.useRef<AbortController | null>(null)

  const change = Math.max(0, (Number(received.replace(',', '.')) || 0) - flow.total)

  /* ------------------------------- Pix ---------------------------------- */

  const startPix = React.useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setPixState('gerando')
    setCharge(null)
    const created = await createPixCharge(flow.total, settings.pixKey)
    setCharge(created)
    setPixState('aguardando')

    try {
      await awaitPixConfirmation(controller.signal)
      setPixState('confirmado')
      flow.setPaid(true)
      toast.success('Pagamento Pix confirmado', { description: currency(flow.total) })
    } catch {
      /* cobrança cancelada pelo operador */
    }
  }, [flow, settings.pixKey])

  React.useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  function handleChoice(choice: NonNullable<NewOrderFlow['payment']>) {
    flow.setPayment(choice)
    abortRef.current?.abort()
    setPixState('idle')
    setCharge(null)

    if (choice === 'pix') {
      flow.setPaid(false)
      void startPix()
    } else if (choice === 'aberto' || choice === 'faturado') {
      flow.setPaid(false)
    } else {
      flow.setPaid(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">Como o cliente vai pagar?</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          O valor pode ser recebido agora ou ficar em aberto para a retirada.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card-elevated px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Wallet className="size-4 text-muted-foreground" />
          <div>
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-[12px] text-muted-foreground">
              {flow.pieces} peças · {flow.customer?.kind === 'PJ' ? 'Empresa' : 'Pessoa física'}
            </p>
          </div>
        </div>
        <p className="tabular text-[28px] font-semibold leading-none tracking-tight">
          {currency(flow.total)}
        </p>
      </div>

      <PaymentMethodSelector
        value={flow.payment}
        onChange={handleChoice}
        allowBilling={flow.allowBilling}
      />

      <AnimatePresence mode="wait">
        {/* ------------------------------- Pix ------------------------------ */}
        {flow.payment === 'pix' ? (
          <motion.div
            key="pix"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative shrink-0 self-center">
                {charge ? (
                  <PixQrCode
                    payload={charge.copyPaste}
                    className={cn(pixState === 'confirmado' && 'opacity-30 blur-[1px]')}
                  />
                ) : (
                  <div className="grid size-44 place-items-center rounded-lg bg-muted">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                <AnimatePresence>
                  {pixState === 'confirmado' ? (
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 grid place-items-center"
                    >
                      <span className="grid size-16 place-items-center rounded-full bg-success text-success-foreground shadow-lg">
                        <Check className="size-8" strokeWidth={3} />
                      </span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="size-4 text-muted-foreground" />
                  <p className="text-[13px] font-medium">Cobrança Pix</p>
                  {pixState === 'gerando' ? (
                    <Badge variant="neutral">Gerando…</Badge>
                  ) : pixState === 'aguardando' ? (
                    <Badge variant="warning" className="gap-1.5">
                      <span className="size-1.5 animate-pulse rounded-full bg-warning" />
                      Aguardando pagamento
                    </Badge>
                  ) : pixState === 'confirmado' ? (
                    <Badge variant="success">Pagamento confirmado</Badge>
                  ) : null}
                </div>

                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  {pixState === 'confirmado'
                    ? `Recebemos ${currency(flow.total)}. Pode seguir para a nota fiscal.`
                    : 'Mostre o QR Code ao cliente ou envie o código copia e cola. A confirmação chega automaticamente.'}
                </p>

                {charge && pixState !== 'confirmado' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 p-2">
                      <code className="tabular flex-1 truncate text-[11px] text-muted-foreground">
                        {charge.copyPaste}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Copiar código Pix"
                        onClick={() => {
                          navigator.clipboard?.writeText(charge.copyPaste)
                          toast.success('Código copiado')
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={startPix}>
                      <RefreshCw className="size-3.5" />
                      Gerar nova cobrança
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* --------------------------- Maquininha --------------------------- */}
        {flow.payment === 'debito' || flow.payment === 'credito' ? (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-md bg-muted text-muted-foreground">
                  <CreditCard className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-medium">
                    Cobrança na maquininha ·{' '}
                    {flow.payment === 'debito' ? 'Débito' : 'Crédito'}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Passe o cartão na Moderninha e confirme aqui o recebimento.
                  </p>
                </div>
              </div>
              {flow.paid ? (
                <Badge variant="success" className="gap-1.5">
                  <Check className="size-3" />
                  Recebimento confirmado
                </Badge>
              ) : (
                <Button
                  onClick={() => {
                    flow.setPaid(true)
                    toast.success('Pagamento registrado', {
                      description: `${flow.payment === 'debito' ? 'Débito' : 'Crédito'} · ${currency(flow.total)}`,
                    })
                  }}
                >
                  Confirmar recebimento
                </Button>
              )}
            </div>
          </motion.div>
        ) : null}

        {/* ----------------------------- Dinheiro --------------------------- */}
        {flow.payment === 'dinheiro' ? (
          <motion.div
            key="cash"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Valor recebido</Label>
                <Input
                  value={received}
                  onChange={(event) => setReceived(event.target.value)}
                  placeholder={flow.total.toFixed(2).replace('.', ',')}
                  inputMode="decimal"
                  className="tabular"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Troco</Label>
                <div className="tabular flex h-9 items-center rounded-md border border-border bg-background/40 px-3 text-[15px] font-semibold">
                  {currency(change)}
                </div>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-end">
              {flow.paid ? (
                <Badge variant="success" className="gap-1.5">
                  <Check className="size-3" />
                  Recebido em espécie
                </Badge>
              ) : (
                <Button
                  onClick={() => {
                    flow.setPaid(true)
                    toast.success('Pagamento em dinheiro registrado', {
                      description: change > 0 ? `Troco de ${currency(change)}` : currency(flow.total),
                    })
                  }}
                >
                  Confirmar recebimento
                </Button>
              )}
            </div>
          </motion.div>
        ) : null}

        {/* ------------------------- Aberto / faturado ---------------------- */}
        {flow.payment === 'aberto' || flow.payment === 'faturado' ? (
          <motion.div
            key="open"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-warning/30 bg-warning/8 p-4"
          >
            <p className="text-[13px] font-medium">
              {flow.payment === 'faturado'
                ? 'Atendimento entra no faturamento do cliente'
                : 'Pagamento ficará em aberto'}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {flow.payment === 'faturado'
                ? `Os valores serão consolidados no fechamento ${flow.customer?.kind === 'PJ' ? flow.customer.billing.cycle : ''} e aparecem na tela de Faturamento.`
                : 'A OS aparece em Pagamentos como pendente e pode ser quitada na retirada. A NFS-e só é emitida após o recebimento.'}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
