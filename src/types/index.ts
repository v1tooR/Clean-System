/* ==========================================================================
   Modelo de domínio — Lavanderia
   Tipos são a fonte da verdade entre mocks, services e UI. Quando o backend
   existir, apenas a camada `services` muda; estes contratos permanecem.
   ========================================================================== */

export type ID = string

/* ------------------------------- Clientes -------------------------------- */

export type CustomerKind = 'PF' | 'PJ'

export interface CustomerBase {
  id: ID
  kind: CustomerKind
  phone: string
  email?: string
  notes?: string
  createdAt: string
  active: boolean
  address?: Address
}

export interface Address {
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
  zip: string
}

export interface CustomerPF extends CustomerBase {
  kind: 'PF'
  name: string
  cpf: string
}

export type BillingCycle = 'quinzenal' | 'mensal'

export interface CustomerPJ extends CustomerBase {
  kind: 'PJ'
  /** Razão social */
  name: string
  tradeName: string
  cnpj: string
  contactName: string
  billing: {
    /** Faturamento acumulado com fechamento posterior */
    enabled: boolean
    cycle: BillingCycle
    /** Dia do vencimento após o fechamento */
    dueDay: number
    /** Desconto contratual em % */
    discountPercent: number
  }
}

export type Customer = CustomerPF | CustomerPJ

/* --------------------------- Peças e serviços ---------------------------- */

export type GarmentCategory = 'vestuario' | 'cama-mesa-banho' | 'casa' | 'profissional' | 'especial'

export interface Garment {
  id: ID
  name: string
  category: GarmentCategory
  icon: string
  active: boolean
  /** Preços por serviço aplicável a esta peça */
  prices: GarmentServicePrice[]
  /** Prazo padrão em dias úteis */
  leadTimeDays: number
}

export type ServiceKind =
  | 'lavar'
  | 'passar'
  | 'lavar-passar'
  | 'lavagem-seco'
  | 'lavagem-especial'
  | 'higienizacao'

export interface Service {
  id: ID
  kind: ServiceKind
  name: string
  description: string
  active: boolean
}

export interface GarmentServicePrice {
  serviceId: ID
  price: number
}

/* ------------------------------ Atendimento ------------------------------ */

export type OrderStatus = 'recebido' | 'em-processo' | 'pronto' | 'entregue' | 'cancelado'

export type PaymentMethod = 'pix' | 'debito' | 'credito' | 'dinheiro' | 'faturado'

export type PaymentStatus = 'pago' | 'pendente' | 'cancelado'

export type InvoiceStatus = 'nao-emitida' | 'processando' | 'autorizada' | 'erro' | 'cancelada'

export interface OrderItem {
  id: ID
  garmentId: ID
  garmentName: string
  serviceId: ID
  serviceName: string
  quantity: number
  unitPrice: number
  /** Observações da peça: mancha, botão faltando, tecido delicado… */
  tags: string[]
  note?: string
}

export interface Payment {
  id: ID
  orderId: ID
  /** Indefinido enquanto o valor está em aberto — o método é escolhido na cobrança. */
  method?: PaymentMethod
  status: PaymentStatus
  amount: number
  createdAt: string
  paidAt?: string
  /** Identificação do comprovante externo (Moderninha / Pix) */
  reference?: string
}

export interface Invoice {
  id: ID
  orderId: ID
  number: string
  verificationCode: string
  status: InvoiceStatus
  amount: number
  issuedAt?: string
  customerId: ID
  customerName: string
  error?: string
}

export interface TimelineEvent {
  id: ID
  at: string
  type:
    | 'criado'
    | 'status'
    | 'pagamento'
    | 'nota'
    | 'observacao'
    | 'entrega'
    | 'impressao'
    | 'cancelamento'
  title: string
  description?: string
  author: string
}

export interface Order {
  id: ID
  /** Número da OS visível ao operador — ex.: 2451 */
  code: string
  customerId: ID
  customerName: string
  customerKind: CustomerKind
  status: OrderStatus
  items: OrderItem[]
  createdAt: string
  dueAt: string
  deliveredAt?: string
  discount: number
  surcharge: number
  subtotal: number
  total: number
  paymentMethod?: PaymentMethod
  paymentStatus: PaymentStatus
  invoiceStatus: InvoiceStatus
  invoiceId?: ID
  attendant: string
  /** Código de retirada informado no comprovante */
  pickupCode: string
  priority: boolean
  notes?: string
  timeline: TimelineEvent[]
  /** Preenchido quando a OS entra em um fechamento PJ */
  billingCycleId?: ID
}

/* ------------------------------ Faturamento ------------------------------ */

export type BillingStatus = 'aberto' | 'fechado' | 'pago'

export interface BillingCycleRecord {
  id: ID
  customerId: ID
  customerName: string
  periodStart: string
  periodEnd: string
  orderIds: ID[]
  ordersCount: number
  amount: number
  discount: number
  total: number
  status: BillingStatus
  closedAt?: string
  dueAt?: string
}

/* -------------------------------- Sistema -------------------------------- */

export interface AppUser {
  id: ID
  name: string
  role: 'Proprietária' | 'Atendente' | 'Produção'
  email: string
  initials: string
}

export interface AppNotification {
  id: ID
  title: string
  description: string
  at: string
  kind: 'atencao' | 'info' | 'sucesso'
  read: boolean
  href?: string
}

export interface CompanyProfile {
  tradeName: string
  legalName: string
  cnpj: string
  municipalRegistration: string
  phone: string
  address: string
  city: string
  taxRegime: string
  serviceCode: string
  issRate: number
}

export interface OperationSettings {
  defaultLeadTimeDays: number
  openingHour: string
  closingHour: string
  autoPrintReceipt: boolean
  autoIssueInvoice: boolean
  compactDensity: boolean
  sidebarCollapsedByDefault: boolean
  pixKey: string
}

/* ------------------------- Utilidades de consulta ------------------------ */

export interface DateRange {
  from: Date
  to: Date
}

export type PeriodPreset = 'hoje' | '7d' | '30d' | 'mes' | 'custom'

export interface Paginated<T> {
  rows: T[]
  total: number
}
