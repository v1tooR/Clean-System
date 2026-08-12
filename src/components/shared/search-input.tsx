import * as React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  containerClassName?: string
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, className, containerClassName, placeholder, ...props }, ref) => {
    return (
      <div className={cn('relative flex-1', containerClassName)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? 'Buscar…'}
          className={cn(
            'h-11 w-full rounded-md border border-input bg-background/55 pl-10 pr-10 text-sm shadow-xs transition-[border-color,box-shadow,background-color]',
            'placeholder:text-muted-foreground/70',
            'hover:border-primary/30 focus-visible:bg-background/80 focus-visible:border-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
            className,
          )}
          {...props}
        />
        {value ? (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => {
              onChange('')
              onClear?.()
            }}
            className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
    )
  },
)
SearchInput.displayName = 'SearchInput'
