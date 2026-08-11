import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  Shirt,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Contador dinâmico exibido na sidebar (ex.: OS em aberto) */
  badge?: 'openOrders' | 'pendingPayments' | 'invoiceErrors'
  end?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const navigation: NavSection[] = [
  {
    label: 'Operação',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
      { label: 'Atendimentos', to: '/atendimentos', icon: Receipt, badge: 'openOrders' },
      { label: 'Clientes', to: '/clientes', icon: Users },
      { label: 'Peças e Serviços', to: '/pecas-servicos', icon: Shirt },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'Pagamentos', to: '/pagamentos', icon: CreditCard, badge: 'pendingPayments' },
      { label: 'Faturamento', to: '/faturamento', icon: Building2 },
      { label: 'Notas Fiscais', to: '/notas-fiscais', icon: FileText, badge: 'invoiceErrors' },
      { label: 'Relatórios', to: '/relatorios', icon: BarChart3 },
    ],
  },
  {
    label: 'Sistema',
    items: [{ label: 'Configurações', to: '/configuracoes', icon: Settings }],
  },
]

/** Títulos e subtítulos exibidos no header por rota. */
export const pageMeta: Record<string, { title: string; description: string }> = {
  '/': { title: 'Dashboard', description: 'Visão geral da operação de hoje' },
  '/atendimentos': { title: 'Atendimentos', description: 'Todas as ordens de serviço da lavanderia' },
  '/atendimentos/novo': { title: 'Novo atendimento', description: 'Registro rápido no balcão' },
  '/clientes': { title: 'Clientes', description: 'Pessoas físicas e empresas atendidas' },
  '/pecas-servicos': {
    title: 'Peças e Serviços',
    description: 'Tabela de preços usada no atendimento',
  },
  '/pagamentos': { title: 'Pagamentos', description: 'Recebimentos e pendências financeiras' },
  '/faturamento': { title: 'Faturamento', description: 'Fechamentos de clientes empresariais' },
  '/notas-fiscais': { title: 'Notas Fiscais', description: 'Emissão e acompanhamento das NFS-e' },
  '/relatorios': { title: 'Relatórios', description: 'Indicadores do período selecionado' },
  '/configuracoes': { title: 'Configurações', description: 'Dados da empresa, equipe e operação' },
}
