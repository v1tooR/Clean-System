import {
  eachDayOfInterval,
  endOfDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns'
import type {
  BillingCycleRecord,
  Customer,
  DateRange,
  Order,
  OrderStatus,
  Payment,
  PaymentMethod,
  PeriodPreset,
} from '@/types'
import { sum } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/* Períodos                                                                    */
/* -------------------------------------------------------------------------- */

export const periodLabels: Record<PeriodPreset, string> = {
  hoje: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  mes: 'Mês atual',
  custom: 'Período personalizado',
}

export function rangeFromPreset(preset: PeriodPreset, custom?: DateRange): DateRange {
  const now = new Date()
  switch (preset) {
    case 'hoje':
      return { from: startOfDay(now), to: endOfDay(now) }
    case '7d':
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
    case '30d':
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }
    case 'mes':
      return { from: startOfMonth(now), to: endOfDay(now) }
    case 'custom':
      return custom ?? { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }
  }
}

export function inRange(dateISO: string, range: DateRange) {
  const date = new Date(dateISO)
  return isWithinInterval(date, { start: range.from, end: range.to })
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

export interface DashboardMetrics {
  ordersToday: number
  ordersYesterday: number
  piecesInProcess: number
  ordersInProcess: number
  receivedToday: number
  receivedYesterday: number
  receivable: number
  receivableCount: number
  readyForPickup: number
  overdue: number
}

export function pieceCount(order: Order) {
  return order.items.reduce((acc, item) => acc + item.quantity, 0)
}

export function dashboardMetrics(orders: Order[]): DashboardMetrics {
  const now = new Date()
  const today = { from: startOfDay(now), to: endOfDay(now) }
  const yesterday = { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) }

  const todayOrders = orders.filter((order) => inRange(order.createdAt, today))
  const yesterdayOrders = orders.filter((order) => inRange(order.createdAt, yesterday))
  const active = orders.filter((order) => order.status === 'recebido' || order.status === 'em-processo')
  const pending = orders.filter(
    (order) => order.paymentStatus === 'pendente' && order.status !== 'cancelado',
  )

  return {
    ordersToday: todayOrders.length,
    ordersYesterday: yesterdayOrders.length,
    piecesInProcess: sum(active.map(pieceCount)),
    ordersInProcess: active.length,
    receivedToday: sum(
      todayOrders.filter((order) => order.paymentStatus === 'pago').map((order) => order.total),
    ),
    receivedYesterday: sum(
      yesterdayOrders.filter((order) => order.paymentStatus === 'pago').map((order) => order.total),
    ),
    receivable: sum(pending.map((order) => order.total)),
    receivableCount: pending.length,
    readyForPickup: orders.filter((order) => order.status === 'pronto').length,
    overdue: orders.filter(
      (order) =>
        new Date(order.dueAt) < now && (order.status === 'recebido' || order.status === 'em-processo'),
    ).length,
  }
}

export const kanbanColumns: { id: Exclude<OrderStatus, 'cancelado'>; label: string; hint: string }[] = [
  { id: 'recebido', label: 'Recebido', hint: 'Aguardando separação' },
  { id: 'em-processo', label: 'Em processo', hint: 'Lavagem e passadoria' },
  { id: 'pronto', label: 'Pronto', hint: 'Aguardando retirada' },
  { id: 'entregue', label: 'Entregue', hint: 'Concluídos hoje' },
]

/** O Kanban mostra o fluxo vivo: tudo em aberto + entregues recentes. */
export function kanbanOrders(orders: Order[]) {
  const cutoff = subDays(new Date(), 1)
  return orders.filter((order) => {
    if (order.status === 'cancelado') return false
    if (order.status === 'entregue') {
      return order.deliveredAt ? new Date(order.deliveredAt) >= cutoff : false
    }
    return true
  })
}

/* -------------------------------------------------------------------------- */
/* Financeiro                                                                  */
/* -------------------------------------------------------------------------- */

export function paymentsInRange(payments: Payment[], range: DateRange) {
  return payments.filter((payment) => inRange(payment.createdAt, range))
}

export interface PaymentSummary {
  receivedToday: number
  receivedInRange: number
  pending: number
  count: number
}

export function paymentSummary(payments: Payment[], range: DateRange): PaymentSummary {
  const now = new Date()
  const today = { from: startOfDay(now), to: endOfDay(now) }
  const scoped = paymentsInRange(payments, range)
  return {
    receivedToday: sum(
      payments
        .filter((p) => p.status === 'pago' && p.paidAt && inRange(p.paidAt, today))
        .map((p) => p.amount),
    ),
    receivedInRange: sum(scoped.filter((p) => p.status === 'pago').map((p) => p.amount)),
    pending: sum(payments.filter((p) => p.status === 'pendente').map((p) => p.amount)),
    count: scoped.length,
  }
}

export function revenueByDay(orders: Order[], range: DateRange) {
  const days = eachDayOfInterval({ start: range.from, end: range.to })
  return days.map((day) => {
    const dayRange = { from: startOfDay(day), to: endOfDay(day) }
    const scoped = orders.filter(
      (order) => inRange(order.createdAt, dayRange) && order.status !== 'cancelado',
    )
    return {
      date: day,
      faturamento: Number(sum(scoped.map((order) => order.total)).toFixed(2)),
      recebido: Number(
        sum(scoped.filter((o) => o.paymentStatus === 'pago').map((o) => o.total)).toFixed(2),
      ),
      atendimentos: scoped.length,
    }
  })
}

export function revenueByMethod(orders: Order[], range: DateRange) {
  const scoped = orders.filter(
    (order) => inRange(order.createdAt, range) && order.status !== 'cancelado',
  )
  const methods: PaymentMethod[] = ['pix', 'debito', 'credito', 'dinheiro', 'faturado']
  return methods
    .map((method) => ({
      method,
      total: Number(
        sum(scoped.filter((order) => order.paymentMethod === method).map((o) => o.total)).toFixed(2),
      ),
      count: scoped.filter((order) => order.paymentMethod === method).length,
    }))
    .filter((entry) => entry.count > 0)
}

export function topGarments(orders: Order[], range: DateRange, limit = 8) {
  const scoped = orders.filter(
    (order) => inRange(order.createdAt, range) && order.status !== 'cancelado',
  )
  const map = new Map<string, { name: string; quantity: number; total: number }>()
  scoped.forEach((order) => {
    order.items.forEach((item) => {
      const entry = map.get(item.garmentName) ?? { name: item.garmentName, quantity: 0, total: 0 }
      entry.quantity += item.quantity
      entry.total += item.quantity * item.unitPrice
      map.set(item.garmentName, entry)
    })
  })
  return Array.from(map.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
}

export function topServices(orders: Order[], range: DateRange) {
  const scoped = orders.filter(
    (order) => inRange(order.createdAt, range) && order.status !== 'cancelado',
  )
  const map = new Map<string, { name: string; quantity: number; total: number }>()
  scoped.forEach((order) => {
    order.items.forEach((item) => {
      const entry = map.get(item.serviceName) ?? { name: item.serviceName, quantity: 0, total: 0 }
      entry.quantity += item.quantity
      entry.total += item.quantity * item.unitPrice
      map.set(item.serviceName, entry)
    })
  })
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

/* -------------------------------------------------------------------------- */
/* Clientes                                                                    */
/* -------------------------------------------------------------------------- */

export interface CustomerStats {
  ordersCount: number
  totalSpent: number
  pending: number
  lastOrderAt?: string
}

export function customerStats(customerId: string, orders: Order[]): CustomerStats {
  const scoped = orders.filter((order) => order.customerId === customerId)
  return {
    ordersCount: scoped.length,
    totalSpent: sum(scoped.filter((o) => o.status !== 'cancelado').map((o) => o.total)),
    pending: sum(scoped.filter((o) => o.paymentStatus === 'pendente').map((o) => o.total)),
    lastOrderAt: scoped[0]?.createdAt,
  }
}

export function customerDisplayName(customer: Customer) {
  return customer.kind === 'PJ' ? customer.tradeName : customer.name
}

export function customerDocument(customer: Customer) {
  return customer.kind === 'PJ' ? customer.cnpj : customer.cpf
}

/* -------------------------------------------------------------------------- */
/* Faturamento PJ                                                              */
/* -------------------------------------------------------------------------- */

export interface OpenCycle {
  customer: Customer
  orders: Order[]
  amount: number
  discount: number
  total: number
  periodStart: string
  periodEnd: string
}

export function openCycles(customers: Customer[], orders: Order[]): OpenCycle[] {
  return customers
    .filter((customer) => customer.kind === 'PJ' && customer.billing.enabled && customer.active)
    .map((customer) => {
      const scoped = orders.filter(
        (order) =>
          order.customerId === customer.id &&
          !order.billingCycleId &&
          order.status !== 'cancelado' &&
          order.paymentStatus === 'pendente',
      )
      const amount = sum(scoped.map((order) => order.subtotal))
      const discount = sum(scoped.map((order) => order.discount))
      const sorted = [...scoped].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      return {
        customer,
        orders: scoped,
        amount,
        discount,
        total: amount - discount,
        periodStart: sorted[0]?.createdAt ?? new Date().toISOString(),
        periodEnd: sorted[sorted.length - 1]?.createdAt ?? new Date().toISOString(),
      }
    })
    .filter((cycle) => cycle.orders.length > 0)
    .sort((a, b) => b.total - a.total)
}

export function cyclesForCustomer(cycles: BillingCycleRecord[], customerId: string) {
  return cycles.filter((cycle) => cycle.customerId === customerId)
}
