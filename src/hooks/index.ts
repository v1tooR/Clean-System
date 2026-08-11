import * as React from 'react'

/** Skeleton na primeira montagem — some quando os dados "chegam". */
export function useSimulatedLoading(delay = 420) {
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delay)
    return () => clearTimeout(timer)
  }, [delay])
  return loading
}

export function useDebouncedValue<T>(value: T, delay = 220) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  React.useEffect(() => {
    const list = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', handler)
    return () => list.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}

/** Atalhos globais — ignora digitação dentro de campos. */
export function useHotkey(
  combo: { key: string; meta?: boolean; shift?: boolean },
  handler: () => void,
) {
  const saved = React.useRef(handler)
  saved.current = handler

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'combobox')

      const metaMatch = combo.meta ? event.metaKey || event.ctrlKey : !event.metaKey && !event.ctrlKey
      const shiftMatch = combo.shift ? event.shiftKey : true

      if (event.key.toLowerCase() === combo.key.toLowerCase() && metaMatch && shiftMatch) {
        if (typing && !combo.meta) return
        event.preventDefault()
        saved.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [combo.key, combo.meta, combo.shift])
}

/** Contador regressivo simples (Pix). */
export function useCountdown(seconds: number, active: boolean) {
  const [remaining, setRemaining] = React.useState(seconds)

  React.useEffect(() => {
    if (!active) return
    setRemaining(seconds)
    const timer = setInterval(() => {
      setRemaining((value) => (value <= 1 ? 0 : value - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [seconds, active])

  return remaining
}
