import * as React from 'react'
import { currency, dateTime } from '@/lib/format'
import { paymentMethodLabels } from './status-badge'
import { cn } from '@/lib/utils'
import type { CompanyProfile, Customer, Invoice, Order } from '@/types'

interface ThermalReceiptProps {
  order: Order
  customer?: Customer
  company: CompanyProfile
  invoice?: Invoice
  className?: string
}

function Divider() {
  return <div className="my-1.5 border-t border-dashed border-black/40" />
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-2', strong && 'font-bold')}>
      <span>{label}</span>
      <span className="tabular">{value}</span>
    </div>
  )
}

/**
 * Comprovante para impressora térmica de 80mm.
 * A impressão real é feita por `window.print()` — o CSS de @media print
 * isola este bloco e define a página em 80mm.
 */
export const ThermalReceipt = React.forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ order, customer, company, invoice, className }, ref) => {
    const pieces = order.items.reduce((acc, item) => acc + item.quantity, 0)
    const document = customer?.kind === 'PJ' ? customer.cnpj : customer?.kind === 'PF' ? customer.cpf : ''

    return (
      <div
        ref={ref}
        id="thermal-receipt"
        className={cn(
          'print-area mx-auto w-[302px] rounded-md bg-white p-4 font-mono text-[11px] leading-[1.45] text-black shadow-md',
          className,
        )}
      >
        <div className="text-center">
          <p className="text-[13px] font-bold uppercase tracking-wide">{company.tradeName}</p>
          <p>{company.legalName}</p>
          <p>CNPJ {company.cnpj}</p>
          <p>{company.address}</p>
          <p>
            {company.city} · {company.phone}
          </p>
        </div>

        <Divider />

        <div className="text-center">
          <p className="text-[12px] font-bold">COMPROVANTE DE SERVIÇO</p>
          <p className="text-[15px] font-bold tracking-wide">OS {order.code}</p>
        </div>

        <Divider />

        <Row label="Entrada" value={dateTime(order.createdAt)} />
        <Row label="Previsão" value={dateTime(order.dueAt)} />
        <Row label="Atendente" value={order.attendant} />

        <Divider />

        <p className="font-bold">CLIENTE</p>
        <p>{order.customerName}</p>
        {document ? <p>{customer?.kind === 'PJ' ? 'CNPJ' : 'CPF'} {document}</p> : null}
        {customer?.phone ? <p>Tel {customer.phone}</p> : null}

        <Divider />

        <p className="font-bold">PEÇAS E SERVIÇOS</p>
        <div className="mt-1 space-y-1.5">
          {order.items.map((item) => (
            <div key={item.id}>
              <div className="flex justify-between gap-2">
                <span className="flex-1">
                  {item.quantity}x {item.garmentName}
                </span>
                <span className="tabular">{currency(item.quantity * item.unitPrice)}</span>
              </div>
              <div className="flex justify-between gap-2 pl-3 text-black/70">
                <span>{item.serviceName}</span>
                <span className="tabular">{currency(item.unitPrice)} un.</span>
              </div>
              {item.tags.length > 0 ? (
                <p className="pl-3 text-black/70">Obs: {item.tags.join(', ')}</p>
              ) : null}
              {item.note ? <p className="pl-3 text-black/70">{item.note}</p> : null}
            </div>
          ))}
        </div>

        <Divider />

        <Row label={`Peças (${pieces})`} value={currency(order.subtotal)} />
        {order.discount > 0 ? <Row label="Desconto" value={`- ${currency(order.discount)}`} /> : null}
        {order.surcharge > 0 ? <Row label="Acréscimo" value={currency(order.surcharge)} /> : null}
        <div className="my-1 border-t border-black/60" />
        <div className="flex items-baseline justify-between text-[15px] font-bold">
          <span>TOTAL</span>
          <span className="tabular">{currency(order.total)}</span>
        </div>

        <Divider />

        <Row
          label="Pagamento"
          value={order.paymentMethod ? paymentMethodLabels[order.paymentMethod] : '—'}
        />
        <Row label="Situação" value={order.paymentStatus === 'pago' ? 'PAGO' : 'EM ABERTO'} />

        {invoice && invoice.status === 'autorizada' ? (
          <>
            <Divider />
            <p className="font-bold">NFS-e</p>
            <Row label="Número" value={invoice.number} />
            <Row label="Verificação" value={invoice.verificationCode} />
            <p className="text-black/70">Consulta em nfse.prefeitura.sp.gov.br</p>
          </>
        ) : null}

        <Divider />

        <div className="text-center">
          <p className="font-bold">CÓDIGO DE RETIRADA</p>
          <p className="text-[22px] font-bold tracking-[0.2em]">{order.pickupCode}</p>
          <p className="text-black/70">Apresente este código na retirada</p>
        </div>

        <Divider />

        <p className="text-center text-black/70">
          Guarde este comprovante. Peças não retiradas em 90 dias poderão ser doadas conforme
          contrato de prestação de serviço.
        </p>
        <p className="mt-1 text-center font-bold">Obrigado pela preferência!</p>
      </div>
    )
  },
)
ThermalReceipt.displayName = 'ThermalReceipt'
