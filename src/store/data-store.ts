import { create } from 'zustand'
import { addDays, setHours, startOfDay } from 'date-fns'
import { buildSeed } from '@/data/seed'
import { garments as garmentsSeed, services as servicesSeed } from '@/data/catalog'
import {
  buildNotifications,
  companyProfile as companySeed,
  currentUser,
  defaultSettings,
} from '@/data/system'
import { uid } from '@/lib/utils'
import type {
  AppNotification,
  BillingCycleRecord,
  CompanyProfile,
  Customer,
  Garment,
  Invoice,
  OperationSettings,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Service,
  TimelineEvent,
} from '@/types'

const seed = buildSeed()

export interface NewOrderInput {
  customerId: string
  items: OrderItem[]
  discount: number
  surcharge: number
  dueAt: string
  notes?: string
  priority: boolean
  paymentMethod?: PaymentMethod
  paymentStatus: PaymentStatus
}

interface DataState {
  customers: Customer[]
  orders: Order[]
  payments: Payment[]
  invoices: Invoice[]
  billingCycles: BillingCycleRecord[]
  garments: Garment[]
  services: Service[]
  notifications: AppNotification[]
  settings: OperationSettings
  company: CompanyProfile

  /* Atendimentos */
  createOrder: (input: NewOrderInput) => Order
  setOrderStatus: (orderId: string, status: OrderStatus, author?: string) => void
  cancelOrder: (orderId: string, reason: string) => void
  addOrderNote: (orderId: string, note: string) => void
  registerPayment: (orderId: string, method: PaymentMethod) => void
  markOrderPrinted: (orderId: string) => void
  attachInvoice: (orderId: string, invoice: Invoice) => void
  setInvoiceStatus: (invoiceId: string, status: Invoice['status'], error?: string) => void

  /* Clientes */
  createCustomer: (customer: Customer) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  toggleCustomerActive: (id: string) => void

  /* Catálogo */
  upsertGarment: (garment: Garment) => void
  removeGarment: (id: string) => void
  toggleGarmentActive: (id: string) => void
  toggleServiceActive: (id: string) => void

  /* Faturamento */
  closeBillingCycle: (record: Omit<BillingCycleRecord, 'id'>) => BillingCycleRecord
  markCycleAsPaid: (id: string) => void

  /* Sistema */
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  updateSettings: (patch: Partial<OperationSettings>) => void
  updateCompany: (patch: Partial<CompanyProfile>) => void
}

function event(
  type: TimelineEvent['type'],
  title: string,
  description?: string,
  author = currentUser.name,
): TimelineEvent {
  return { id: uid('tl'), at: new Date().toISOString(), type, title, description, author }
}

function nextOrderCode(orders: Order[]) {
  const highest = orders.reduce((acc, order) => Math.max(acc, Number(order.code) || 0), 0)
  return String(highest + 1)
}

function nextPickupCode(orders: Order[]) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const index = orders.length
  return `${letters[index % letters.length]}${String(100 + ((index * 41) % 900))}`
}

export const useDataStore = create<DataState>((set, get) => ({
  customers: seed.customers,
  orders: seed.orders,
  payments: seed.payments,
  invoices: seed.invoices,
  billingCycles: seed.billingCycles,
  garments: garmentsSeed,
  services: servicesSeed,
  notifications: buildNotifications(),
  settings: defaultSettings,
  company: companySeed,

  createOrder: (input) => {
    const state = get()
    const customer = state.customers.find((item) => item.id === input.customerId)
    if (!customer) throw new Error('Cliente não encontrado')

    const subtotal = input.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0)
    const total = Number((subtotal - input.discount + input.surcharge).toFixed(2))
    const code = nextOrderCode(state.orders)
    const pickup = nextPickupCode(state.orders)
    const now = new Date().toISOString()

    const timeline: TimelineEvent[] = [
      event(
        'criado',
        `OS ${code} registrada`,
        `${input.items.reduce((acc, item) => acc + item.quantity, 0)} peças recebidas no balcão`,
      ),
    ]
    if (input.paymentStatus === 'pago' && input.paymentMethod) {
      timeline.push(
        event('pagamento', `Pagamento confirmado · ${paymentLabel(input.paymentMethod)}`),
      )
    }

    const order: Order = {
      id: uid('os'),
      code,
      customerId: customer.id,
      customerName: customer.kind === 'PJ' ? customer.tradeName : customer.name,
      customerKind: customer.kind,
      status: 'recebido',
      items: input.items,
      createdAt: now,
      dueAt: input.dueAt,
      discount: input.discount,
      surcharge: input.surcharge,
      subtotal: Number(subtotal.toFixed(2)),
      total,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      invoiceStatus: 'nao-emitida',
      attendant: currentUser.name,
      pickupCode: pickup,
      priority: input.priority,
      notes: input.notes,
      timeline,
    }

    const payment: Payment = {
      id: uid('pay'),
      orderId: order.id,
      method: input.paymentStatus === 'pago' ? input.paymentMethod : input.paymentMethod === 'faturado' ? 'faturado' : undefined,
      status: input.paymentStatus,
      amount: total,
      createdAt: now,
      paidAt: input.paymentStatus === 'pago' ? now : undefined,
    }

    set((current) => ({
      orders: [order, ...current.orders],
      payments: [payment, ...current.payments],
    }))

    return order
  },

  setOrderStatus: (orderId, status, author) =>
    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id !== orderId || order.status === status) return order
        const labels: Record<OrderStatus, string> = {
          recebido: 'Retornado para recebido',
          'em-processo': 'Enviado para processo',
          pronto: 'Pronto para retirada',
          entregue: 'Entregue ao cliente',
          cancelado: 'Atendimento cancelado',
        }
        return {
          ...order,
          status,
          deliveredAt: status === 'entregue' ? new Date().toISOString() : order.deliveredAt,
          timeline: [
            ...order.timeline,
            event(
              status === 'entregue' ? 'entrega' : 'status',
              labels[status],
              status === 'pronto' ? `Código de retirada ${order.pickupCode}` : undefined,
              author,
            ),
          ],
        }
      }),
    })),

  cancelOrder: (orderId, reason) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'cancelado',
              paymentStatus: order.paymentStatus === 'pago' ? 'pago' : 'cancelado',
              timeline: [...order.timeline, event('cancelamento', 'Atendimento cancelado', reason)],
            }
          : order,
      ),
      payments: state.payments.map((payment) =>
        payment.orderId === orderId && payment.status === 'pendente'
          ? { ...payment, status: 'cancelado' }
          : payment,
      ),
    })),

  addOrderNote: (orderId, note) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, timeline: [...order.timeline, event('observacao', 'Observação', note)] }
          : order,
      ),
    })),

  registerPayment: (orderId, method) =>
    set((state) => {
      const order = state.orders.find((item) => item.id === orderId)
      if (!order) return state
      const now = new Date().toISOString()
      const existing = state.payments.find((payment) => payment.orderId === orderId)

      return {
        orders: state.orders.map((item) =>
          item.id === orderId
            ? {
                ...item,
                paymentMethod: method,
                paymentStatus: 'pago',
                timeline: [
                  ...item.timeline,
                  event('pagamento', `Pagamento confirmado · ${paymentLabel(method)}`),
                ],
              }
            : item,
        ),
        payments: existing
          ? state.payments.map((payment) =>
              payment.orderId === orderId
                ? { ...payment, method, status: 'pago', paidAt: now }
                : payment,
            )
          : [
              {
                id: uid('pay'),
                orderId,
                method,
                status: 'pago' as PaymentStatus,
                amount: order.total,
                createdAt: now,
                paidAt: now,
              },
              ...state.payments,
            ],
      }
    }),

  markOrderPrinted: (orderId) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              timeline: [
                ...order.timeline,
                event('impressao', 'Comprovante impresso', 'Via térmica 80mm'),
              ],
            }
          : order,
      ),
    })),

  attachInvoice: (orderId, invoice) =>
    set((state) => ({
      invoices: [invoice, ...state.invoices.filter((item) => item.id !== invoice.id)],
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              invoiceId: invoice.id,
              invoiceStatus: invoice.status,
              timeline:
                invoice.status === 'autorizada'
                  ? [
                      ...order.timeline,
                      event('nota', 'NFS-e autorizada', `Nota ${invoice.number} emitida`, 'Sistema'),
                    ]
                  : order.timeline,
            }
          : order,
      ),
    })),

  setInvoiceStatus: (invoiceId, status, error) =>
    set((state) => ({
      invoices: state.invoices.map((invoice) =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              status,
              error,
              issuedAt: status === 'autorizada' ? new Date().toISOString() : invoice.issuedAt,
            }
          : invoice,
      ),
      orders: state.orders.map((order) =>
        order.invoiceId === invoiceId ? { ...order, invoiceStatus: status } : order,
      ),
    })),

  createCustomer: (customer) => {
    set((state) => ({ customers: [customer, ...state.customers] }))
    return customer
  },

  updateCustomer: (id, patch) =>
    set((state) => ({
      customers: state.customers.map((customer) =>
        customer.id === id ? ({ ...customer, ...patch } as Customer) : customer,
      ),
      orders: state.orders.map((order) =>
        order.customerId === id && (patch as { name?: string }).name
          ? { ...order, customerName: (patch as { name: string }).name }
          : order,
      ),
    })),

  toggleCustomerActive: (id) =>
    set((state) => ({
      customers: state.customers.map((customer) =>
        customer.id === id ? { ...customer, active: !customer.active } : customer,
      ),
    })),

  upsertGarment: (garment) =>
    set((state) => ({
      garments: state.garments.some((item) => item.id === garment.id)
        ? state.garments.map((item) => (item.id === garment.id ? garment : item))
        : [...state.garments, garment],
    })),

  removeGarment: (id) => set((state) => ({ garments: state.garments.filter((g) => g.id !== id) })),

  toggleGarmentActive: (id) =>
    set((state) => ({
      garments: state.garments.map((garment) =>
        garment.id === id ? { ...garment, active: !garment.active } : garment,
      ),
    })),

  toggleServiceActive: (id) =>
    set((state) => ({
      services: state.services.map((service) =>
        service.id === id ? { ...service, active: !service.active } : service,
      ),
    })),

  closeBillingCycle: (record) => {
    const created: BillingCycleRecord = { ...record, id: uid('fec') }
    set((state) => ({
      billingCycles: [created, ...state.billingCycles],
      orders: state.orders.map((order) =>
        record.orderIds.includes(order.id) ? { ...order, billingCycleId: created.id } : order,
      ),
    }))
    return created
  },

  markCycleAsPaid: (id) =>
    set((state) => ({
      billingCycles: state.billingCycles.map((cycle) =>
        cycle.id === id ? { ...cycle, status: 'pago' } : cycle,
      ),
      orders: state.orders.map((order) =>
        order.billingCycleId === id ? { ...order, paymentStatus: 'pago' } : order,
      ),
      payments: state.payments.map((payment) => {
        const order = state.orders.find((item) => item.id === payment.orderId)
        return order?.billingCycleId === id
          ? { ...payment, status: 'pago' as PaymentStatus, paidAt: new Date().toISOString() }
          : payment
      }),
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, read: true })),
    })),

  updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

  updateCompany: (patch) => set((state) => ({ company: { ...state.company, ...patch } })),
}))

export function paymentLabel(method: PaymentMethod) {
  const map: Record<PaymentMethod, string> = {
    pix: 'Pix',
    debito: 'Débito',
    credito: 'Crédito',
    dinheiro: 'Dinheiro',
    faturado: 'Faturado',
  }
  return map[method]
}

/** Previsão de entrega padrão a partir das configurações da operação. */
export function defaultDueDate(leadDays: number) {
  return setHours(startOfDay(addDays(new Date(), leadDays)), 17)
}
