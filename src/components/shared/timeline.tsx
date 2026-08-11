import {
  Ban,
  CircleDot,
  FileText,
  MessageSquare,
  Package,
  Printer,
  Truck,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { dateTime, relative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TimelineEvent } from '@/types'

const iconMap: Record<TimelineEvent['type'], { icon: LucideIcon; tone: string }> = {
  criado: { icon: Package, tone: 'text-info bg-info/12' },
  status: { icon: CircleDot, tone: 'text-warning bg-warning/12' },
  pagamento: { icon: Wallet, tone: 'text-success bg-success/12' },
  nota: { icon: FileText, tone: 'text-primary bg-primary/12' },
  observacao: { icon: MessageSquare, tone: 'text-muted-foreground bg-muted' },
  entrega: { icon: Truck, tone: 'text-success bg-success/12' },
  impressao: { icon: Printer, tone: 'text-muted-foreground bg-muted' },
  cancelamento: { icon: Ban, tone: 'text-destructive bg-destructive/12' },
}

export function Timeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
  const ordered = [...events].sort((a, b) => b.at.localeCompare(a.at))

  return (
    <ol className={cn('relative space-y-4 pl-1', className)}>
      {ordered.map((item, index) => {
        const meta = iconMap[item.type]
        const Icon = meta.icon
        return (
          <li key={item.id} className="relative flex gap-3">
            {index < ordered.length - 1 ? (
              <span className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-border" />
            ) : null}
            <span
              className={cn('z-10 grid size-7 shrink-0 place-items-center rounded-full', meta.tone)}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-[13px] font-medium leading-5">{item.title}</p>
                <time
                  dateTime={item.at}
                  title={dateTime(item.at)}
                  className="shrink-0 text-[11px] text-muted-foreground"
                >
                  {relative(item.at)}
                </time>
              </div>
              {item.description ? (
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                {dateTime(item.at)} · {item.author}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
