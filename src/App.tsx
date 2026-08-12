import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { OrdersPage } from '@/features/orders/orders-page'
import { NewOrderPage } from '@/features/new-order/new-order-page'
import { CustomersPage } from '@/features/customers/customers-page'
import { CatalogPage } from '@/features/catalog/catalog-page'
import { PaymentsPage } from '@/features/payments/payments-page'
import { BillingPage } from '@/features/billing/billing-page'
import { InvoicesPage } from '@/features/invoices/invoices-page'
import { ReportsPage } from '@/features/reports/reports-page'
import { SettingsPage } from '@/features/settings/settings-page'
import { NotFoundPage } from '@/features/misc/not-found-page'
import { RouteErrorPage } from '@/features/misc/route-error-page'
import { useUIStore } from '@/store/ui-store'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'atendimentos', element: <OrdersPage /> },
      { path: 'atendimentos/novo', element: <NewOrderPage /> },
      { path: 'clientes', element: <CustomersPage /> },
      { path: 'pecas-servicos', element: <CatalogPage /> },
      { path: 'pagamentos', element: <PaymentsPage /> },
      { path: 'faturamento', element: <BillingPage /> },
      { path: 'notas-fiscais', element: <InvoicesPage /> },
      { path: 'relatorios', element: <ReportsPage /> },
      { path: 'configuracoes', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function App() {
  const theme = useUIStore((state) => state.theme)

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        theme={theme}
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast:
              'group border-border bg-card text-foreground shadow-lg rounded-lg text-[13px] items-start',
            description: 'text-muted-foreground text-[12px]',
            actionButton: 'bg-primary text-primary-foreground rounded-md',
          },
        }}
      />
    </>
  )
}
