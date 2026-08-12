import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useUIStore } from '@/store/ui-store'

export function ThemeToggle() {
  const theme = useUIStore((state) => state.theme)
  const toggleTheme = useUIStore((state) => state.toggleTheme)
  const nextThemeLabel = theme === 'dark' ? 'claro' : 'escuro'

  return (
    <SimpleTooltip label={`Ativar modo ${nextThemeLabel}`} side="bottom">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label={`Ativar modo ${nextThemeLabel}`}
        aria-pressed={theme === 'dark'}
        className="relative overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="grid place-items-center"
          >
            {theme === 'dark' ? <Sun className="text-brand-sky" /> : <Moon className="text-primary" />}
          </motion.span>
        </AnimatePresence>
      </Button>
    </SimpleTooltip>
  )
}
