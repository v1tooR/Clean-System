import { sleep, uid } from '@/lib/utils'
import { useDataStore } from '@/store/data-store'
import type { Invoice, Order } from '@/types'

/* -------------------------------------------------------------------------- */
/* Pix — simulação do ciclo de cobrança                                        */
/* -------------------------------------------------------------------------- */

export type PixState = 'gerando' | 'aguardando' | 'confirmado' | 'expirado'

export interface PixCharge {
  id: string
  amount: number
  copyPaste: string
  expiresInSeconds: number
}

/** Gera uma cobrança Pix fictícia com payload em formato EMV plausível. */
export async function createPixCharge(amount: number, key: string): Promise<PixCharge> {
  await sleep(700)
  const id = uid('pix').replace('_', '').toUpperCase().slice(0, 18)
  const value = amount.toFixed(2)
  const copyPaste = `00020126580014BR.GOV.BCB.PIX0136${key}5204000053039865802BR5921LAVANDERIA AURORA LT6009SAO PAULO62070503***5406${value}6304${id.slice(0, 4)}`
  return { id, amount, copyPaste, expiresInSeconds: 300 }
}

/** Confirma o pagamento após alguns segundos, como faria um webhook do PSP. */
export async function awaitPixConfirmation(signal?: AbortSignal): Promise<'confirmado'> {
  const total = 4200
  const step = 200
  for (let elapsed = 0; elapsed < total; elapsed += step) {
    if (signal?.aborted) throw new DOMException('Cobrança cancelada', 'AbortError')
    await sleep(step)
  }
  return 'confirmado'
}

/* -------------------------------------------------------------------------- */
/* NFS-e — simulação de emissão junto à prefeitura                             */
/* -------------------------------------------------------------------------- */

export type InvoiceProgress = 'preparando' | 'emitindo' | 'autorizada' | 'erro'

export interface IssueInvoiceResult {
  invoice: Invoice
}

export async function issueInvoice(
  order: Order,
  onProgress: (stage: InvoiceProgress) => void,
  options?: { forceError?: boolean },
): Promise<IssueInvoiceResult> {
  onProgress('preparando')
  await sleep(900)
  onProgress('emitindo')
  await sleep(1600)

  const failed = options?.forceError ?? false

  const invoice: Invoice = {
    id: uid('nf'),
    orderId: order.id,
    number: `2026${order.code}`,
    verificationCode: uid('vc').replace('vc_', '').toUpperCase().slice(0, 8),
    status: failed ? 'erro' : 'autorizada',
    amount: order.total,
    issuedAt: failed ? undefined : new Date().toISOString(),
    customerId: order.customerId,
    customerName: order.customerName,
    error: failed ? 'Rejeição 214: inscrição municipal do tomador inválida' : undefined,
  }

  useDataStore.getState().attachInvoice(order.id, invoice)
  onProgress(failed ? 'erro' : 'autorizada')

  return { invoice }
}

/** Reenvio de uma nota rejeitada. */
export async function retryInvoice(invoiceId: string) {
  const store = useDataStore.getState()
  store.setInvoiceStatus(invoiceId, 'processando')
  await sleep(1800)
  store.setInvoiceStatus(invoiceId, 'autorizada')
  return store.invoices.find((invoice) => invoice.id === invoiceId)
}

export async function cancelInvoice(invoiceId: string) {
  await sleep(1200)
  useDataStore.getState().setInvoiceStatus(invoiceId, 'cancelada')
}

/* -------------------------------------------------------------------------- */
/* Exportações                                                                 */
/* -------------------------------------------------------------------------- */

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function toCSV(rows: Record<string, string | number>[]) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (value: string | number) => {
    const text = String(value ?? '')
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [
    headers.join(';'),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(';')),
  ].join('\n')
}

/** XML ilustrativo da NFS-e, no formato ABRASF resumido. */
export function invoiceXML(invoice: Invoice, order?: Order) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse>
  <Nfse>
    <InfNfse>
      <Numero>${invoice.number}</Numero>
      <CodigoVerificacao>${invoice.verificationCode}</CodigoVerificacao>
      <DataEmissao>${invoice.issuedAt ?? ''}</DataEmissao>
      <Servico>
        <ItemListaServico>14.09</ItemListaServico>
        <Discriminacao>Servicos de lavanderia - OS ${order?.code ?? ''}</Discriminacao>
        <ValorServicos>${invoice.amount.toFixed(2)}</ValorServicos>
      </Servico>
      <TomadorServico>
        <RazaoSocial>${invoice.customerName}</RazaoSocial>
      </TomadorServico>
    </InfNfse>
  </Nfse>
</CompNfse>`
}
