import * as React from 'react'
import { addDays, setHours, startOfDay } from 'date-fns'
import { useDataStore } from '@/store/data-store'
import { uid } from '@/lib/utils'
import type { Customer, Order, OrderItem } from '@/types'
import type { PaymentChoice } from '@/components/shared/payment-method-selector'

export interface DraftItem {
  key: string
  garmentId: string
  garmentName: string
  quantity: number
  tags: string[]
  note?: string
  serviceId?: string
  serviceName?: string
  unitPrice?: number
}

export const steps = [
  { id: 'cliente', label: 'Cliente' },
  { id: 'pecas', label: 'Peças' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'resumo', label: 'Resumo' },
  { id: 'pagamento', label: 'Pagamento' },
  { id: 'nota', label: 'NFS-e' },
  { id: 'comprovante', label: 'Comprovante' },
  { id: 'fim', label: 'Conclusão' },
] as const

export type StepId = (typeof steps)[number]['id']

export function useNewOrder(initialCustomer?: Customer | null) {
  const garments = useDataStore((state) => state.garments)
  const services = useDataStore((state) => state.services)
  const settings = useDataStore((state) => state.settings)
  const createOrder = useDataStore((state) => state.createOrder)

  const [stepIndex, setStepIndex] = React.useState(initialCustomer ? 1 : 0)
  const [furthest, setFurthest] = React.useState(initialCustomer ? 1 : 0)
  const [customer, setCustomer] = React.useState<Customer | null>(initialCustomer ?? null)
  const [items, setItems] = React.useState<DraftItem[]>([])
  const [discount, setDiscount] = React.useState(0)
  const [surcharge, setSurcharge] = React.useState(0)
  const [notes, setNotes] = React.useState('')
  const [priority, setPriority] = React.useState(false)
  const [dueAt, setDueAt] = React.useState<Date>(() =>
    setHours(startOfDay(addDays(new Date(), 2)), 17),
  )
  const [payment, setPayment] = React.useState<PaymentChoice | null>(null)
  const [paid, setPaid] = React.useState(false)
  const [createdOrder, setCreatedOrder] = React.useState<Order | null>(null)

  /* ------------------------------ Derivados ------------------------------ */

  const pieces = items.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = items.reduce((acc, item) => acc + (item.unitPrice ?? 0) * item.quantity, 0)
  const total = Math.max(0, subtotal - discount + surcharge)
  const missingService = items.filter((item) => !item.serviceId)
  const allowBilling = customer?.kind === 'PJ' && customer.billing.enabled

  /* Prazo sugerido a partir das peças escolhidas */
  React.useEffect(() => {
    if (items.length === 0) return
    const lead = Math.max(
      settings.defaultLeadTimeDays,
      ...items.map(
        (item) => garments.find((garment) => garment.id === item.garmentId)?.leadTimeDays ?? 2,
      ),
    )
    setDueAt(setHours(startOfDay(addDays(new Date(), priority ? Math.max(1, lead - 1) : lead)), 17))
  }, [items, priority, garments, settings.defaultLeadTimeDays])

  /* Desconto contratual do cliente PJ é aplicado automaticamente */
  React.useEffect(() => {
    if (customer?.kind === 'PJ' && customer.billing.discountPercent > 0) {
      setDiscount(Number(((subtotal * customer.billing.discountPercent) / 100).toFixed(2)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, subtotal])

  /* -------------------------------- Ações -------------------------------- */

  const goTo = React.useCallback((index: number) => {
    setStepIndex(index)
    setFurthest((value) => Math.max(value, index))
  }, [])

  const next = React.useCallback(() => goTo(Math.min(stepIndex + 1, steps.length - 1)), [goTo, stepIndex])
  const back = React.useCallback(() => setStepIndex((value) => Math.max(0, value - 1)), [])

  function addGarment(garmentId: string) {
    const garment = garments.find((item) => item.id === garmentId)
    if (!garment) return
    setItems((current) => {
      const existing = current.find((item) => item.garmentId === garmentId && item.tags.length === 0)
      if (existing) {
        return current.map((item) =>
          item.key === existing.key ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      const defaultPrice = garment.prices[0]
      const service = services.find((item) => item.id === defaultPrice?.serviceId)
      return [
        ...current,
        {
          key: uid('draft'),
          garmentId,
          garmentName: garment.name,
          quantity: 1,
          tags: [],
          serviceId: defaultPrice?.serviceId,
          serviceName: service?.name,
          unitPrice: defaultPrice?.price,
        },
      ]
    })
  }

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  function changeQuantity(key: string, delta: number) {
    setItems((current) =>
      current
        .map((item) =>
          item.key === key ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key))
  }

  function duplicateItem(key: string) {
    setItems((current) => {
      const source = current.find((item) => item.key === key)
      if (!source) return current
      return [...current, { ...source, key: uid('draft'), quantity: 1, tags: [], note: undefined }]
    })
  }

  function setService(key: string, serviceId: string, price: number) {
    const service = services.find((item) => item.id === serviceId)
    updateItem(key, { serviceId, serviceName: service?.name, unitPrice: price })
  }

  /** Cria a OS no sistema — chamado ao concluir a etapa de pagamento. */
  function commitOrder(): Order | null {
    if (!customer || items.length === 0 || createdOrder) return createdOrder

    const orderItems: OrderItem[] = items.map((item) => ({
      id: uid('itm'),
      garmentId: item.garmentId,
      garmentName: item.garmentName,
      serviceId: item.serviceId!,
      serviceName: item.serviceName ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? 0,
      tags: item.tags,
      note: item.note,
    }))

    const method =
      payment === 'aberto' ? undefined : payment === null ? undefined : (payment as Exclude<PaymentChoice, 'aberto'>)

    const order = createOrder({
      customerId: customer.id,
      items: orderItems,
      discount,
      surcharge,
      dueAt: dueAt.toISOString(),
      notes: notes || undefined,
      priority,
      paymentMethod: method,
      paymentStatus: paid ? 'pago' : 'pendente',
    })

    setCreatedOrder(order)
    return order
  }

  function reset() {
    setStepIndex(0)
    setFurthest(0)
    setCustomer(null)
    setItems([])
    setDiscount(0)
    setSurcharge(0)
    setNotes('')
    setPriority(false)
    setPayment(null)
    setPaid(false)
    setCreatedOrder(null)
  }

  return {
    // estado
    stepIndex,
    furthest,
    customer,
    items,
    discount,
    surcharge,
    notes,
    priority,
    dueAt,
    payment,
    paid,
    createdOrder,
    // derivados
    pieces,
    subtotal,
    total,
    missingService,
    allowBilling,
    // setters
    setCustomer,
    setDiscount,
    setSurcharge,
    setNotes,
    setPriority,
    setDueAt,
    setPayment,
    setPaid,
    // ações
    goTo,
    next,
    back,
    addGarment,
    updateItem,
    changeQuantity,
    removeItem,
    duplicateItem,
    setService,
    commitOrder,
    reset,
  }
}

export type NewOrderFlow = ReturnType<typeof useNewOrder>
