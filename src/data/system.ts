import { subHours, subMinutes } from 'date-fns'
import { formatCNPJ } from '@/lib/format'
import { fixCNPJ } from '@/lib/validators'
import type { AppNotification, AppUser, CompanyProfile, OperationSettings } from '@/types'

const AURORA_CNPJ = formatCNPJ(fixCNPJ('32.884.115/0001-70'))

export const currentUser: AppUser = {
  id: 'usr-001',
  name: 'Camila Prado',
  role: 'Proprietária',
  email: 'camila@lavanderiaaurora.com.br',
  initials: 'CP',
}

export const teamMembers: AppUser[] = [
  currentUser,
  {
    id: 'usr-002',
    name: 'Douglas Reis',
    role: 'Produção',
    email: 'douglas@lavanderiaaurora.com.br',
    initials: 'DR',
  },
  {
    id: 'usr-003',
    name: 'Vanessa Lopes',
    role: 'Atendente',
    email: 'vanessa@lavanderiaaurora.com.br',
    initials: 'VL',
  },
]

export const companyProfile: CompanyProfile = {
  tradeName: 'Lavanderia Aurora',
  legalName: 'Aurora Serviços de Lavanderia Ltda',
  cnpj: AURORA_CNPJ,
  municipalRegistration: '4.882.109-3',
  phone: '(11) 3567-2210',
  address: 'Rua Barão do Triunfo, 428 · Brooklin',
  city: 'São Paulo · SP',
  taxRegime: 'Simples Nacional',
  serviceCode: '14.09 — Lavanderia, tinturaria e afins',
  issRate: 2,
}

export const defaultSettings: OperationSettings = {
  defaultLeadTimeDays: 2,
  openingHour: '08:00',
  closingHour: '19:00',
  autoPrintReceipt: true,
  autoIssueInvoice: true,
  compactDensity: false,
  sidebarCollapsedByDefault: false,
  pixKey: AURORA_CNPJ,
}

export function buildNotifications(): AppNotification[] {
  const now = new Date()
  return [
    {
      id: 'ntf-1',
      title: '3 entregas previstas para hoje',
      description: 'Confira as OS prontas aguardando retirada no balcão.',
      at: subMinutes(now, 18).toISOString(),
      kind: 'atencao',
      read: false,
      href: '/atendimentos?status=pronto',
    },
    {
      id: 'ntf-2',
      title: 'NFS-e rejeitada',
      description: 'Uma nota voltou com rejeição 214 e precisa ser reenviada.',
      at: subHours(now, 2).toISOString(),
      kind: 'atencao',
      read: false,
      href: '/notas-fiscais?status=erro',
    },
    {
      id: 'ntf-3',
      title: 'Fechamento do Hotel Bela Vista disponível',
      description: 'O ciclo mensal já pode ser consolidado e enviado.',
      at: subHours(now, 5).toISOString(),
      kind: 'info',
      read: false,
      href: '/faturamento',
    },
    {
      id: 'ntf-4',
      title: 'Tabela de preços atualizada',
      description: 'Camisa social — lavar e passar ajustado para R$ 18,90.',
      at: subHours(now, 26).toISOString(),
      kind: 'sucesso',
      read: true,
      href: '/pecas-servicos',
    },
  ]
}
