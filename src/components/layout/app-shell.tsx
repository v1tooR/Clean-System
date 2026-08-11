import * as React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { CommandMenu } from './command-menu'
import { HeaderSlotProvider } from './header-slot'
import { OrderDetailDrawer } from '@/features/orders/order-detail-drawer'
import { CustomerDetailDrawer } from '@/features/customers/customer-detail-drawer'
import { useUIStore } from '@/store/ui-store'
import { useHotkey } from '@/hooks'

function ShellContent() {
  const mobileNavOpen = useUIStore((state) => state.mobileNavOpen)
  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen)
  const setCommandOpen = useUIStore((state) => state.setCommandOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const navigate = useNavigate()
  const location = useLocation()
  const mainRef = React.useRef<HTMLElement>(null)

  useHotkey({ key: 'k', meta: true }, () => setCommandOpen(true))
  useHotkey({ key: 'b' }, toggleSidebar)
  useHotkey({ key: 'n' }, () => navigate('/atendimentos/novo'))

  // Rolagem volta ao topo a cada troca de página
  React.useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[268px] p-0 sm:max-w-[268px]" hideClose>
          <AppSidebar variant="mobile" onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main ref={mainRef} className="app-canvas flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 lg:px-6 lg:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandMenu />
      <OrderDetailDrawer />
      <CustomerDetailDrawer />
    </div>
  )
}

export function AppShell() {
  return (
    <TooltipProvider delayDuration={280} skipDelayDuration={120}>
      <HeaderSlotProvider>
        <ShellContent />
      </HeaderSlotProvider>
    </TooltipProvider>
  )
}
