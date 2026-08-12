import { ALargeSmall } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useUIStore } from '@/store/ui-store'

export function TextSizeToggle() {
  const textScale = useUIStore((state) => state.textScale)
  const setTextScale = useUIStore((state) => state.setTextScale)
  const toggleTextScale = useUIStore((state) => state.toggleTextScale)
  const isLarge = textScale === 'large'

  return (
    <>
      <div
        className="hidden h-11 items-stretch overflow-hidden rounded-md border border-border bg-card/55 shadow-xs 2xl:flex"
        role="group"
        aria-label="Tamanho do texto"
      >
        <button
          type="button"
          className="min-w-11 px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-default disabled:opacity-35"
          onClick={() => setTextScale('comfortable')}
          disabled={!isLarge}
          aria-label="Usar texto confortável"
        >
          A−
        </button>
        <span className="flex min-w-[108px] items-center justify-center border-x border-border px-3 text-xs font-semibold text-foreground">
          {isLarge ? 'Texto grande' : 'Texto confortável'}
        </span>
        <button
          type="button"
          className="min-w-11 px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-default disabled:opacity-35"
          onClick={() => setTextScale('large')}
          disabled={isLarge}
          aria-label="Usar texto grande"
        >
          A+
        </button>
      </div>

      <SimpleTooltip
        label={isLarge ? 'Voltar ao texto confortável' : 'Aumentar o texto'}
        side="bottom"
      >
        <Button
          variant={isLarge ? 'secondary' : 'ghost'}
          size="icon"
          className="2xl:hidden"
          onClick={toggleTextScale}
          aria-label={isLarge ? 'Voltar ao texto confortável' : 'Aumentar o texto'}
          aria-pressed={isLarge}
        >
          <ALargeSmall className="size-5" />
        </Button>
      </SimpleTooltip>
    </>
  )
}
