import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, FileText, Plus, Receipt, UserRound } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { StatusBadge } from '@/components/shared/status-badge'
import { navigation } from '@/config/navigation'
import { useDataStore } from '@/store/data-store'
import { useUIStore } from '@/store/ui-store'
import { currency, dateShort } from '@/lib/format'
import { customerDisplayName, customerDocument } from '@/store/selectors'

export function CommandMenu() {
  const open = useUIStore((state) => state.commandOpen)
  const setOpen = useUIStore((state) => state.setCommandOpen)
  const openOrder = useUIStore((state) => state.openOrder)
  const openCustomer = useUIStore((state) => state.openCustomer)
  const orders = useDataStore((state) => state.orders)
  const customers = useDataStore((state) => state.customers)
  const navigate = useNavigate()

  const recentOrders = React.useMemo(() => orders.slice(0, 40), [orders])
  const activeCustomers = React.useMemo(
    () => customers.filter((customer) => customer.active).slice(0, 40),
    [customers],
  )

  function run(action: () => void) {
    setOpen(false)
    // deixa o diálogo fechar antes de navegar/abrir drawer
    setTimeout(action, 60)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar OS, cliente, página ou ação…" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Ações rápidas">
          <CommandItem
            value="novo atendimento criar os"
            onSelect={() => run(() => navigate('/atendimentos/novo'))}
          >
            <Plus />
            Novo atendimento
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="novo cliente cadastro"
            onSelect={() => run(() => navigate('/clientes?novo=1'))}
          >
            <UserRound />
            Cadastrar cliente
          </CommandItem>
          <CommandItem
            value="notas fiscais pendentes nfse"
            onSelect={() => run(() => navigate('/notas-fiscais'))}
          >
            <FileText />
            Notas fiscais
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Atendimentos recentes">
          {recentOrders.map((order) => (
            <CommandItem
              key={order.id}
              value={`os ${order.code} ${order.customerName} ${order.pickupCode}`}
              onSelect={() =>
                run(() => {
                  navigate('/atendimentos')
                  openOrder(order.id)
                })
              }
            >
              <Receipt />
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="tabular font-medium">OS {order.code}</span>
                <span className="truncate text-muted-foreground">{order.customerName}</span>
              </span>
              <span className="tabular hidden text-[12px] text-muted-foreground sm:inline">
                {dateShort(order.createdAt)} · {currency(order.total)}
              </span>
              <StatusBadge kind="order" status={order.status} showIcon={false} size="sm" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Clientes">
          {activeCustomers.map((customer) => (
            <CommandItem
              key={customer.id}
              value={`cliente ${customerDisplayName(customer)} ${customerDocument(customer)} ${customer.phone}`}
              onSelect={() =>
                run(() => {
                  navigate('/clientes')
                  openCustomer(customer.id)
                })
              }
            >
              {customer.kind === 'PJ' ? <Building2 /> : <UserRound />}
              <span className="min-w-0 flex-1 truncate">{customerDisplayName(customer)}</span>
              <span className="tabular text-[12px] text-muted-foreground">
                {customerDocument(customer)}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegar">
          {navigation.flatMap((section) =>
            section.items.map((item) => (
              <CommandItem
                key={item.to}
                value={`ir para ${item.label}`}
                onSelect={() => run(() => navigate(item.to))}
              >
                <item.icon />
                {item.label}
              </CommandItem>
            )),
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
