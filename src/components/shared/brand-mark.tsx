import * as React from 'react'
import { cn } from '@/lib/utils'

interface BrandMarkProps extends React.SVGAttributes<SVGSVGElement> {
  title?: string
}

/** Marca compacta inspirada no tambor, na agua e nas bolhas da AC Clean. */
export function BrandMark({ className, title, ...props }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      className={cn('size-9 shrink-0', className)}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="24" cy="24" r="20" className="fill-primary/10" />
      <path
        d="M39.2 17.3A17 17 0 1 0 27.4 40.5c-8.8-.1-16-7.2-16-16 0-8.9 7.2-16.1 16.1-16.1 5 0 9.4 2.3 12.5 5.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        className="text-brand-deep"
      />
      <path
        d="M12.6 25.7c2.6-2.3 5.1-2.6 7.3-.9 2.3 1.8 1.6 5.2 3.4 7.4 2.5 3.1 8.1 2.7 12.4-1.4 3.2-3 5-7.4 5.2-11.5l2.8 3.7c-.2 10.8-8.6 19.5-19.2 19.5-9.8 0-17.9-7.4-19-16.9 2.4 1.1 4.8 1.1 7.1.1Z"
        className="fill-brand-sky/90"
      />
      <circle cx="19.3" cy="20.1" r="2.6" className="fill-primary" />
      <circle cx="27.1" cy="15" r="1.7" className="fill-brand-sky" />
      <circle cx="29.5" cy="24.4" r="1.35" className="fill-primary" />
    </svg>
  )
}
