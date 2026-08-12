import * as React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronsLeft, LogOut, PanelLeft, Plus, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { navigation } from '@/config/navigation'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { currentUser } from '@/data/system'
import { Avatar, AvatarFallback, Separator } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { BrandMark } from '@/components/shared/brand-mark'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

function useBadgeCounts() {
  const orders = useDataStore((state) => state.orders)
  const invoices = useDataStore((state) => state.invoices)

  return React.useMemo(
    () => ({
      openOrders: orders.filter(
        (order) => order.status === 'recebido' || order.status === 'em-processo',
      ).length,
      pendingPayments: orders.filter(
        (order) => order.paymentStatus === 'pendente' && order.status !== 'cancelado',
      ).length,
      invoiceErrors: invoices.filter((invoice) => invoice.status === 'erro').length,
    }),
    [orders, invoices],
  )
}

interface AppSidebarProps {
  /** No mobile a sidebar vive dentro de um drawer e nunca fica recolhida. */
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
}

export function AppSidebar({ variant = 'desktop', onNavigate }: AppSidebarProps) {
  const collapsed = useUIStore((state) => state.sidebarCollapsed) && variant === 'desktop'
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const badges = useBadgeCounts()
  const navigate = useNavigate()

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out',
        variant === 'desktop' ? (collapsed ? 'w-[76px]' : 'w-[272px]') : 'w-full',
      )}
    >
      {/* Marca */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4',
          collapsed && 'justify-center px-0',
        )}
      >
        <BrandMark title="AC Clean" className="size-9 drop-shadow-[0_0_12px_hsl(var(--primary)/0.18)]" />
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-tight tracking-tight">
              <span className="text-primary">ac.</span>
              <span className="text-foreground">clean</span>
            </p>
            <p className="truncate text-[10px] font-medium uppercase leading-tight tracking-[0.15em] text-sidebar-foreground/70">
              Lavanderia · Gestão
            </p>
          </div>
        ) : null}
      </div>

      {/* Ação principal */}
      <div className={cn('px-3 pb-1 pt-3', collapsed && 'px-2')}>
        <SimpleTooltip label="Novo atendimento" side="right" shortcut="N" hidden={!collapsed}>
          <Button
            className={cn('w-full gap-2', collapsed && 'px-0')}
            size={collapsed ? 'icon' : 'default'}
            onClick={() => {
              navigate('/atendimentos/novo')
              onNavigate?.()
            }}
          >
            <Plus className="size-4" />
            {!collapsed ? 'Novo atendimento' : null}
          </Button>
        </SimpleTooltip>
      </div>

      {/* Navegação */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-3">
        {navigation.map((section) => (
          <div key={section.label} className="mb-4 last:mb-0">
            {!collapsed ? (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                {section.label}
              </p>
            ) : (
              <Separator className="mx-auto mb-2 w-6 bg-sidebar-border" />
            )}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const count = item.badge ? badges[item.badge] : 0

                return (
                  <li key={item.to}>
                    <SimpleTooltip label={item.label} side="right" hidden={!collapsed}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            'group relative flex min-h-11 items-center gap-3 rounded-md px-2.5 py-2.5 text-[13px] font-medium transition-colors',
                            collapsed && 'justify-center px-0',
                            isActive
                              ? 'bg-primary/12 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)]'
                              : 'text-sidebar-foreground hover:bg-primary/7 hover:text-foreground',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive ? (
                              <motion.span
                                layoutId="sidebar-active"
                                className="absolute inset-y-1 left-0 w-[3px] rounded-r bg-gradient-to-b from-brand-sky to-primary shadow-[0_0_10px_hsl(var(--primary)/0.45)]"
                                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                              />
                            ) : null}
                            <Icon
                              className={cn(
                                'size-4 shrink-0 transition-colors',
                                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary',
                              )}
                            />
                            {!collapsed ? (
                              <>
                                <span className="flex-1 truncate">{item.label}</span>
                                {count > 0 ? (
                                  <span
                                    className={cn(
                                      'tabular rounded px-1.5 py-0.5 text-[10px] font-semibold',
                                      item.badge === 'invoiceErrors'
                                        ? 'bg-destructive/15 text-destructive'
                                        : 'bg-primary/10 text-primary',
                                    )}
                                  >
                                    {count}
                                  </span>
                                ) : null}
                              </>
                            ) : count > 0 ? (
                              <span
                                className={cn(
                                  'absolute right-2 top-1.5 size-1.5 rounded-full',
                                  item.badge === 'invoiceErrors' ? 'bg-destructive' : 'bg-primary',
                                )}
                              />
                            ) : null}
                          </>
                        )}
                      </NavLink>
                    </SimpleTooltip>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Usuário */}
      <div className={cn('border-t border-sidebar-border p-3', collapsed && 'px-2')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-primary/8',
                collapsed && 'justify-center',
              )}
            >
              <Avatar className="size-10">
                <AvatarFallback>{currentUser.initials}</AvatarFallback>
              </Avatar>
              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium leading-tight">{currentUser.name}</p>
                  <p className="truncate text-[11px] leading-tight text-muted-foreground">
                    {currentUser.role}
                  </p>
                </div>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>{currentUser.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                navigate('/configuracoes')
                onNavigate?.()
              }}
            >
              <Settings />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => toast.info('Sessão encerrada', { description: 'Até logo, Camila.' })}
            >
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {variant === 'desktop' ? (
          <SimpleTooltip
            label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            side="right"
            shortcut="B"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className={cn(
                'mt-2 w-full justify-start gap-2 text-muted-foreground',
                collapsed && 'justify-center px-0',
              )}
            >
              {collapsed ? (
                <PanelLeft className="size-4" />
              ) : (
                <>
                  <ChevronsLeft className="size-4" />
                  Recolher
                </>
              )}
            </Button>
          </SimpleTooltip>
        ) : null}
      </div>
    </aside>
  )
}
