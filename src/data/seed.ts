import { addDays, addHours, addMinutes, setHours, setMinutes, startOfDay, subDays } from 'date-fns'
import { garments, itemTags, serviceById } from './catalog'
import { customersSeed } from './customers'
import type {
  BillingCycleRecord,
  Customer,
  Invoice,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  TimelineEvent,
} from '@/types'

/* -------------------------------------------------------------------------- */
/* PRNG determinístico — a base de dados é idêntica a cada carregamento        */
/* -------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260811)

const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)]
const chance = (probability: number) => rand() < probability

const attendants = ['Camila Prado', 'Douglas Reis', 'Vanessa Lopes', 'Camila Prado']

const noteSamples = [
  'Cliente pediu atenção na gola.',
  'Entregar junto com a OS anterior.',
  'Peça com tecido delicado, sem centrifugar.',
  'Retirada por terceiro autorizado.',
]

function iso(date: Date) {
  return date.toISOString()
}

function pickupCode(index: number) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  return `${letters[index % letters.length]}${String(100 + ((index * 37) % 900))}`
}

/* -------------------------------------------------------------------------- */
/* Geração de itens                                                            */
/* -------------------------------------------------------------------------- */

function buildItems(isCompany: boolean): OrderItem[] {
  const lines = isCompany ? int(2, 4) : int(1, 4)
  const items: OrderItem[] = []
  const used = new Set<string>()

  for (let i = 0; i < lines; i += 1) {
    const pool = isCompany
      ? garments.filter((g) => ['profissional', 'cama-mesa-banho', 'casa'].includes(g.category))
      : garments.filter((g) => g.category !== 'especial' || chance(0.05))
    const garment = pick(pool.length ? pool : garments)
    const priceEntry = pick(garment.prices)
    const key = `${garment.id}:${priceEntry.serviceId}`
    if (used.has(key)) continue
    used.add(key)

    const service = serviceById.get(priceEntry.serviceId)
    const quantity = isCompany ? int(3, 14) : int(1, 6)
    const tags: string[] = []
    if (chance(0.22)) tags.push(pick(itemTags))
    if (chance(0.08)) tags.push(pick(itemTags))

    items.push({
      id: `itm_${i}_${garment.id}_${Math.floor(rand() * 1e6).toString(36)}`,
      garmentId: garment.id,
      garmentName: garment.name,
      serviceId: priceEntry.serviceId,
      serviceName: service?.name ?? 'Lavar',
      quantity,
      unitPrice: priceEntry.price,
      tags: Array.from(new Set(tags)),
      note: chance(0.08) ? pick(noteSamples) : undefined,
    })
  }

  return items.length ? items : buildItems(isCompany)
}

/* -------------------------------------------------------------------------- */
/* Geração de OS                                                               */
/* -------------------------------------------------------------------------- */

interface SeedResult {
  customers: Customer[]
  orders: Order[]
  payments: Payment[]
  invoices: Invoice[]
  billingCycles: BillingCycleRecord[]
}

function statusForAge(daysAgo: number, hour: number): OrderStatus {
  if (daysAgo >= 6) return chance(0.96) ? 'entregue' : 'cancelado'
  if (daysAgo >= 4) return chance(0.85) ? 'entregue' : 'pronto'
  if (daysAgo >= 2) return chance(0.55) ? 'entregue' : chance(0.7) ? 'pronto' : 'em-processo'
  if (daysAgo === 1) return chance(0.35) ? 'entregue' : chance(0.6) ? 'pronto' : 'em-processo'
  // Hoje: distribuição operacional ao longo do dia
  if (hour < 10) return chance(0.6) ? 'em-processo' : 'recebido'
  if (hour < 13) return chance(0.5) ? 'recebido' : 'em-processo'
  return chance(0.45) ? 'recebido' : chance(0.55) ? 'em-processo' : 'pronto'
}

function methodFor(customer: Customer): PaymentMethod {
  if (customer.kind === 'PJ' && customer.billing.enabled) return 'faturado'
  const roll = rand()
  if (roll < 0.42) return 'pix'
  if (roll < 0.66) return 'debito'
  if (roll < 0.85) return 'credito'
  return 'dinheiro'
}

export function buildSeed(): SeedResult {
  const now = new Date()
  const orders: Order[] = []
  const payments: Payment[] = []
  const invoices: Invoice[] = []
  let sequence = 2380

  for (let daysAgo = 45; daysAgo >= 0; daysAgo -= 1) {
    const day = startOfDay(subDays(now, daysAgo))
    const weekday = day.getDay()
    if (weekday === 0) continue // domingo fechado

    const volume = weekday === 6 ? int(3, 6) : int(5, 11)
    const cap = daysAgo === 0 ? Math.min(volume, Math.max(2, now.getHours() - 6)) : volume

    for (let i = 0; i < cap; i += 1) {
      const customer = chance(0.2)
        ? pick(customersSeed.filter((c) => c.kind === 'PJ'))
        : pick(customersSeed.filter((c) => c.kind === 'PF' && c.active))

      const hour = int(8, daysAgo === 0 ? Math.max(9, Math.min(18, now.getHours())) : 18)
      const createdAt = setMinutes(setHours(day, hour), int(0, 59))
      if (daysAgo === 0 && createdAt > now) continue

      const items = buildItems(customer.kind === 'PJ')
      const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
      const isCompany = customer.kind === 'PJ'
      const discount = isCompany
        ? Number(((subtotal * (customer.billing.discountPercent ?? 0)) / 100).toFixed(2))
        : chance(0.12)
          ? Number((subtotal * 0.05).toFixed(2))
          : 0
      const surcharge = !isCompany && chance(0.08) ? 12 : 0
      const total = Number((subtotal - discount + surcharge).toFixed(2))

      const status = statusForAge(daysAgo, hour)
      const leadDays = Math.max(...items.map((item) => garmentLead(item.garmentId)), 2)
      const dueAt = setHours(addDays(day, leadDays), 17)

      const intendedMethod = methodFor(customer)
      let paymentStatus: PaymentStatus = 'pago'
      if (status === 'cancelado') paymentStatus = 'cancelado'
      else if (intendedMethod === 'faturado') paymentStatus = 'pendente'
      else if (status === 'entregue') paymentStatus = chance(0.97) ? 'pago' : 'pendente'
      else paymentStatus = chance(0.68) ? 'pago' : 'pendente'

      /**
       * Só há método definido quando o valor foi efetivamente recebido — ou
       * quando o cliente é faturado. Em aberto, a forma é escolhida na retirada.
       */
      const method =
        paymentStatus === 'pago' || intendedMethod === 'faturado' ? intendedMethod : undefined

      const code = String(sequence++)
      const attendant = pick(attendants)
      const pickup = pickupCode(sequence)

      const timeline: TimelineEvent[] = [
        {
          id: `tl_${code}_1`,
          at: iso(createdAt),
          type: 'criado',
          title: `OS ${code} registrada`,
          description: `${items.reduce((a, b) => a + b.quantity, 0)} peças recebidas no balcão`,
          author: attendant,
        },
      ]

      if (paymentStatus === 'pago') {
        timeline.push({
          id: `tl_${code}_2`,
          at: iso(addMinutes(createdAt, int(1, 8))),
          type: 'pagamento',
          title: `Pagamento confirmado · ${methodLabel(intendedMethod)}`,
          description: `Valor de R$ ${total.toFixed(2).replace('.', ',')}`,
          author: attendant,
        })
      }

      if (status !== 'recebido' && status !== 'cancelado') {
        timeline.push({
          id: `tl_${code}_3`,
          at: iso(addHours(createdAt, int(1, 6))),
          type: 'status',
          title: 'Enviado para processo',
          description: 'Peças separadas e encaminhadas para lavagem',
          author: 'Douglas Reis',
        })
      }
      if (status === 'pronto' || status === 'entregue') {
        timeline.push({
          id: `tl_${code}_4`,
          at: iso(addHours(createdAt, int(8, 30))),
          type: 'status',
          title: 'Pronto para retirada',
          description: `Código de retirada ${pickup}`,
          author: 'Vanessa Lopes',
        })
      }

      let deliveredAt: string | undefined
      if (status === 'entregue') {
        const delivered = addHours(createdAt, int(20, 72))
        deliveredAt = iso(delivered > now ? addMinutes(now, -int(20, 240)) : delivered)
        timeline.push({
          id: `tl_${code}_5`,
          at: deliveredAt,
          type: 'entrega',
          title: 'Entregue ao cliente',
          description: `Retirada confirmada com o código ${pickup}`,
          author: attendant,
        })
      }
      if (status === 'cancelado') {
        timeline.push({
          id: `tl_${code}_6`,
          at: iso(addHours(createdAt, 2)),
          type: 'cancelamento',
          title: 'Atendimento cancelado',
          description: 'Cliente desistiu do serviço antes do processo',
          author: attendant,
        })
      }

      /* Nota fiscal */
      let invoiceStatus: Order['invoiceStatus'] = 'nao-emitida'
      let invoiceId: string | undefined
      if (paymentStatus === 'pago' && chance(0.88)) {
        const roll = rand()
        invoiceStatus = roll < 0.92 ? 'autorizada' : roll < 0.97 ? 'processando' : 'erro'
        invoiceId = `nf_${code}`
        invoices.push({
          id: invoiceId,
          orderId: `os_${code}`,
          number: `${2026}${code}`,
          verificationCode: `${Math.floor(rand() * 9e7 + 1e7)}`.slice(0, 8).toUpperCase(),
          status: invoiceStatus,
          amount: total,
          issuedAt: invoiceStatus === 'autorizada' ? iso(addMinutes(createdAt, 12)) : undefined,
          customerId: customer.id,
          customerName: customer.kind === 'PJ' ? customer.tradeName : customer.name,
          error:
            invoiceStatus === 'erro'
              ? 'Rejeição 214: inscrição municipal do tomador inválida'
              : undefined,
        })
        if (invoiceStatus === 'autorizada') {
          timeline.push({
            id: `tl_${code}_7`,
            at: iso(addMinutes(createdAt, 12)),
            type: 'nota',
            title: 'NFS-e autorizada',
            description: `Nota ${2026}${code} emitida pela prefeitura`,
            author: 'Sistema',
          })
        }
      } else if (method === 'faturado') {
        invoiceStatus = 'nao-emitida'
      }

      const order: Order = {
        id: `os_${code}`,
        code,
        customerId: customer.id,
        customerName: customer.kind === 'PJ' ? customer.tradeName : customer.name,
        customerKind: customer.kind,
        status,
        items,
        createdAt: iso(createdAt),
        dueAt: iso(dueAt),
        deliveredAt,
        discount,
        surcharge,
        subtotal: Number(subtotal.toFixed(2)),
        total,
        paymentMethod: method,
        paymentStatus,
        invoiceStatus,
        invoiceId,
        attendant,
        pickupCode: pickup,
        priority: chance(0.09),
        notes: chance(0.12) ? pick(noteSamples) : undefined,
        timeline: timeline.sort((a, b) => a.at.localeCompare(b.at)),
      }

      orders.push(order)

      payments.push({
        id: `pay_${code}`,
        orderId: order.id,
        method,
        status: paymentStatus,
        amount: total,
        createdAt: iso(createdAt),
        paidAt: paymentStatus === 'pago' ? iso(addMinutes(createdAt, int(1, 8))) : undefined,
        reference:
          method === 'pix'
            ? `PIX${Math.floor(rand() * 1e6)
                .toString()
                .padStart(6, '0')}`
            : method === 'debito' || method === 'credito'
              ? `MOD-${Math.floor(rand() * 1e6)
                  .toString()
                  .padStart(6, '0')}`
              : undefined,
      })
    }
  }

  const billingCycles = buildBillingCycles(orders, payments)

  return {
    customers: customersSeed,
    orders: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    payments,
    invoices,
    billingCycles,
  }
}

function garmentLead(garmentId: string) {
  return garments.find((garment) => garment.id === garmentId)?.leadTimeDays ?? 2
}

function methodLabel(method: PaymentMethod) {
  const map: Record<PaymentMethod, string> = {
    pix: 'Pix',
    debito: 'Débito',
    credito: 'Crédito',
    dinheiro: 'Dinheiro',
    faturado: 'Faturado',
  }
  return map[method]
}

/**
 * Fechamento do ciclo anterior de cada empresa.
 *
 * Os atendimentos faturados com mais de 20 dias entram no fechamento e saem da
 * lista de acúmulo — só o período corrente fica em aberto, como na operação real.
 */
function buildBillingCycles(orders: Order[], payments: Payment[]): BillingCycleRecord[] {
  const cycles: BillingCycleRecord[] = []
  const now = new Date()
  const companies = customersSeed.filter((c) => c.kind === 'PJ')

  companies.forEach((company, index) => {
    if (company.kind !== 'PJ') return
    const periodStart = startOfDay(subDays(now, 45))
    const periodEnd = startOfDay(subDays(now, 20))
    const closedOrders = orders.filter(
      (order) =>
        order.customerId === company.id &&
        order.status !== 'cancelado' &&
        new Date(order.createdAt) >= periodStart &&
        new Date(order.createdAt) <= periodEnd,
    )
    if (closedOrders.length === 0) return

    const amount = closedOrders.reduce((acc, order) => acc + order.subtotal, 0)
    const discount = closedOrders.reduce((acc, order) => acc + order.discount, 0)
    const cycleId = `fec_${company.id}_ant`
    // Um dos clientes fica com o fechamento em aberto para demonstrar a cobrança.
    const settled = index % 3 !== 0

    closedOrders.forEach((order) => {
      order.billingCycleId = cycleId
      if (settled) {
        order.paymentStatus = 'pago'
        const payment = payments.find((item) => item.orderId === order.id)
        if (payment) {
          payment.status = 'pago'
          payment.paidAt = iso(subDays(now, 18))
        }
      }
    })

    cycles.push({
      id: cycleId,
      customerId: company.id,
      customerName: company.tradeName,
      periodStart: iso(periodStart),
      periodEnd: iso(periodEnd),
      orderIds: closedOrders.map((order) => order.id),
      ordersCount: closedOrders.length,
      amount: Number(amount.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number((amount - discount).toFixed(2)),
      status: settled ? 'pago' : 'fechado',
      closedAt: iso(subDays(now, 19)),
      dueAt: iso(subDays(now, 9)),
    })
  })

  return cycles
}
