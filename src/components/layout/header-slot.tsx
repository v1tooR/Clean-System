import * as React from 'react'
import type { Crumb } from '@/components/shared/page-header'

export interface HeaderConfig {
  title?: string
  description?: string
  breadcrumbs?: Crumb[]
  actions?: React.ReactNode
}

interface HeaderSlotValue {
  config: HeaderConfig
  setConfig: (config: HeaderConfig) => void
}

const HeaderSlotContext = React.createContext<HeaderSlotValue | null>(null)

export function HeaderSlotProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<HeaderConfig>({})
  const value = React.useMemo(() => ({ config, setConfig }), [config])
  return <HeaderSlotContext.Provider value={value}>{children}</HeaderSlotContext.Provider>
}

export function useHeaderSlot() {
  const context = React.useContext(HeaderSlotContext)
  if (!context) throw new Error('useHeaderSlot precisa estar dentro de HeaderSlotProvider')
  return context
}

/**
 * Permite que cada página defina título, subtítulo e ação principal exibidos
 * no header do shell — mantendo um único ponto de leitura para o operador.
 */
export function usePageHeader(config: HeaderConfig, deps: React.DependencyList = []) {
  const { setConfig } = useHeaderSlot()

  React.useEffect(() => {
    setConfig(config)
    return () => setConfig({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
