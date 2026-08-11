import * as React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Menu, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/misc'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationPopover } from './notification-popover'
import { useHeaderSlot } from './header-slot'
import { pageMeta } from '@/config/navigation'
import { useUIStore } from '@/store/ui-store'
import { currentUser } from '@/data/system'
import { dateLong } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { config } = useHeaderSlot()
  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen)
  const setCommandOpen = useUIStore((state) => state.setCommandOpen)

  const fallback = pageMeta[location.pathname] ?? { title: 'Clean System', description: '' }
  const title = config.title ?? fallback.title
  const description = config.description ?? fallback.description
  const isNewOrder = location.pathname === '/atendimentos/novo'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-4" />
        </Button>

        <div className="min-w-0 flex-1">
          {config.breadcrumbs && config.breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-1 text-[11px] leading-4">
              {config.breadcrumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb.label}-${index}`}>
                  {index > 0 ? <ChevronRight className="size-3 text-muted-foreground/50" /> : null}
                  {crumb.to ? (
                    <Link
                      to={crumb.to}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground/80">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          ) : null}
          <div className="flex items-baseline gap-2.5">
            <h1 className="truncate text-[15px] font-semibold leading-6 tracking-tight">{title}</h1>
            {description ? (
              <p className="hidden truncate text-[12px] text-muted-foreground lg:block">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {/* Busca global */}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className={cn(
            'hidden h-9 w-56 items-center gap-2 rounded-md border border-border bg-card/60 px-3 text-[13px] text-muted-foreground transition-colors hover:border-border/90 hover:bg-card lg:flex xl:w-72',
          )}
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Buscar OS, cliente…</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            Ctrl K
          </kbd>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setCommandOpen(true)}
          aria-label="Buscar"
        >
          <Search className="size-4" />
        </Button>

        <NotificationPopover />

        {config.actions ? (
          <div className="flex items-center gap-2">{config.actions}</div>
        ) : !isNewOrder ? (
          <Button onClick={() => navigate('/atendimentos/novo')} className="gap-2">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Novo atendimento</span>
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 hidden rounded-full transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring md:block"
              aria-label="Menu do usuário"
            >
              <Avatar className="size-8">
                <AvatarFallback>{currentUser.initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <span className="block text-[13px] font-medium text-foreground">{currentUser.name}</span>
              <span className="block text-[11px] font-normal text-muted-foreground">
                {currentUser.role} · {dateLong(new Date())}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setCommandOpen(true)}>
              <Search />
              Busca global
              <DropdownMenuShortcut>Ctrl K</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/configuracoes')}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => toast.info('Sessão encerrada', { description: 'Até logo, Camila.' })}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
