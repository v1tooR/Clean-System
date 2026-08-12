import { create } from 'zustand'

export type ColorTheme = 'light' | 'dark'
export type TextScale = 'comfortable' | 'large'

const THEME_STORAGE_KEY = 'ac-clean-theme'
const TEXT_SCALE_STORAGE_KEY = 'ac-clean-text-scale'

function getInitialTheme(): ColorTheme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function syncTheme(theme: ColorTheme, animate = true, persist = true) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  if (animate) root.classList.add('theme-transition')
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // O tema continua funcional mesmo quando o navegador bloqueia armazenamento local.
    }
  }

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  themeColor?.setAttribute('content', theme === 'dark' ? '#08181f' : '#ffffff')

  if (animate) window.setTimeout(() => root.classList.remove('theme-transition'), 240)
}

function getInitialTextScale(): TextScale {
  if (typeof document === 'undefined') return 'comfortable'
  return document.documentElement.dataset.textScale === 'large' ? 'large' : 'comfortable'
}

function syncTextScale(textScale: TextScale, persist = true) {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.textScale = textScale
  if (persist) {
    try {
      window.localStorage.setItem(TEXT_SCALE_STORAGE_KEY, textScale)
    } catch {
      // A escala continua funcional mesmo quando o navegador bloqueia armazenamento local.
    }
  }
}

const initialTheme = getInitialTheme()
const initialTextScale = getInitialTextScale()
syncTheme(initialTheme, false, false)
syncTextScale(initialTextScale, false)

interface UIState {
  theme: ColorTheme
  textScale: TextScale
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  commandOpen: boolean
  /** OS aberta no Detail Drawer — compartilhada entre Dashboard, Atendimentos e Busca. */
  openOrderId: string | null
  openCustomerId: string | null

  setTheme: (theme: ColorTheme) => void
  toggleTheme: () => void
  setTextScale: (textScale: TextScale) => void
  toggleTextScale: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (value: boolean) => void
  setMobileNavOpen: (value: boolean) => void
  setCommandOpen: (value: boolean) => void
  openOrder: (id: string | null) => void
  openCustomer: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: initialTheme,
  textScale: initialTextScale,
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandOpen: false,
  openOrderId: null,
  openCustomerId: null,

  setTheme: (theme) => {
    syncTheme(theme)
    set({ theme })
  },
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'dark' ? 'light' : 'dark'
      syncTheme(theme)
      return { theme }
    }),
  setTextScale: (textScale) => {
    syncTextScale(textScale)
    set({ textScale })
  },
  toggleTextScale: () =>
    set((state) => {
      const textScale = state.textScale === 'large' ? 'comfortable' : 'large'
      syncTextScale(textScale)
      return { textScale }
    }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setMobileNavOpen: (value) => set({ mobileNavOpen: value }),
  setCommandOpen: (value) => set({ commandOpen: value }),
  openOrder: (id) => set({ openOrderId: id }),
  openCustomer: (id) => set({ openCustomerId: id }),
}))
