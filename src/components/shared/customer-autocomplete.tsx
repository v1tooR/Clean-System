import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, CornerDownLeft, Search, UserPlus, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { customerDocument, customerDisplayName } from '@/store/selectors'
import { normalize, onlyDigits } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Customer } from '@/types'

interface CustomerAutocompleteProps {
  customers: Customer[]
  onSelect: (customer: Customer) => void
  onCreateNew: (query: string) => void
  autoFocus?: boolean
  placeholder?: string
}

export function searchCustomers(customers: Customer[], query: string) {
  const term = normalize(query)
  const digits = onlyDigits(query)
  if (!term) return []

  return customers
    .filter((customer) => {
      if (!customer.active) return false
      const haystack = [
        customer.name,
        customer.kind === 'PJ' ? customer.tradeName : '',
        customer.kind === 'PJ' ? customer.contactName : '',
        customer.email ?? '',
      ]
        .map(normalize)
        .join(' ')
      const documents = onlyDigits(`${customerDocument(customer)}${customer.phone}`)
      return haystack.includes(term) || (digits.length >= 3 && documents.includes(digits))
    })
    .slice(0, 6)
}

export function CustomerAutocomplete({
  customers,
  onSelect,
  onCreateNew,
  autoFocus,
  placeholder = 'Buscar por nome, CPF, CNPJ ou telefone…',
}: CustomerAutocompleteProps) {
  const [query, setQuery] = React.useState('')
  const [highlight, setHighlight] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const results = React.useMemo(() => searchCustomers(customers, query), [customers, query])
  const showPanel = query.trim().length > 0

  React.useEffect(() => setHighlight(0), [query])

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPanel) return
    const optionsCount = results.length + 1 // + "cadastrar novo"

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((value) => (value + 1) % optionsCount)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((value) => (value - 1 + optionsCount) % optionsCount)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (highlight < results.length) onSelect(results[highlight])
      else onCreateNew(query)
    } else if (event.key === 'Escape') {
      setQuery('')
    }
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-input bg-background/55 pl-10 pr-4 text-[15px] shadow-xs transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:bg-background/80 focus-visible:border-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
      />

      <AnimatePresence>
        {showPanel ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover p-1.5 shadow-lg"
          >
            {results.map((customer, index) => {
              const isCompany = customer.kind === 'PJ'
              return (
                <button
                  key={customer.id}
                  type="button"
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => onSelect(customer)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors',
                    highlight === index ? 'bg-primary/10 text-primary' : 'hover:bg-primary/7',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full',
                      isCompany ? 'bg-info/12 text-info' : 'bg-primary/12 text-primary',
                    )}
                  >
                    {isCompany ? <Building2 className="size-4" /> : <UserRound className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium">
                        {customerDisplayName(customer)}
                      </span>
                      <Badge variant={isCompany ? 'info' : 'neutral'} size="sm">
                        {customer.kind}
                      </Badge>
                    </span>
                    <span className="tabular block truncate text-[12px] text-muted-foreground">
                      {customerDocument(customer)} · {customer.phone}
                    </span>
                  </span>
                  {highlight === index ? (
                    <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : null}
                </button>
              )
            })}

            <button
              type="button"
              onMouseEnter={() => setHighlight(results.length)}
              onClick={() => onCreateNew(query)}
              className={cn(
                'mt-0.5 flex w-full items-center gap-3 rounded-md border-t border-border/70 px-2.5 py-2.5 text-left transition-colors',
                highlight === results.length ? 'bg-primary/10' : 'hover:bg-primary/7',
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success/12 text-success">
                <UserPlus className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium">Cadastrar novo cliente</span>
                <span className="block truncate text-[12px] text-muted-foreground">
                  {results.length === 0
                    ? `Nenhum cliente encontrado para “${query}”`
                    : 'Criar cadastro sem sair do atendimento'}
                </span>
              </span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
