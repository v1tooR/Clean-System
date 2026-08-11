import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  commandOpen: boolean
  /** OS aberta no Detail Drawer — compartilhada entre Dashboard, Atendimentos e Busca. */
  openOrderId: string | null
  openCustomerId: string | null

  toggleSidebar: () => void
  setSidebarCollapsed: (value: boolean) => void
  setMobileNavOpen: (value: boolean) => void
  setCommandOpen: (value: boolean) => void
  openOrder: (id: string | null) => void
  openCustomer: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandOpen: false,
  openOrderId: null,
  openCustomerId: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setMobileNavOpen: (value) => set({ mobileNavOpen: value }),
  setCommandOpen: (value) => set({ commandOpen: value }),
  openOrder: (id) => set({ openOrderId: id }),
  openCustomer: (id) => set({ openCustomerId: id }),
}))
