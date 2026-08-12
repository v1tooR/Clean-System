import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck, CircleAlert, Info, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/misc'
import { EmptyState } from '@/components/shared/states'
import { useDataStore } from '@/store/data-store'
import { relative } from '@/lib/format'
import { cn } from '@/lib/utils'

const kindMeta = {
  atencao: { icon: CircleAlert, tone: 'text-warning bg-warning/12' },
  info: { icon: Info, tone: 'text-info bg-info/12' },
  sucesso: { icon: PartyPopper, tone: 'text-success bg-success/12' },
} as const

export function NotificationPopover() {
  const [open, setOpen] = React.useState(false)
  const notifications = useDataStore((state) => state.notifications)
  const markRead = useDataStore((state) => state.markNotificationRead)
  const markAllRead = useDataStore((state) => state.markAllNotificationsRead)
  const navigate = useNavigate()

  const unread = notifications.filter((item) => !item.read).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-4" />
          <AnimatePresence>
            {unread > 0 ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="tabular absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground"
              >
                {unread}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold">Notificações</p>
            <p className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} não lidas` : 'Tudo em dia'}
            </p>
          </div>
          {unread > 0 ? (
            <Button variant="ghost" size="sm" className="gap-1.5 text-[12px]" onClick={markAllRead}>
              <CheckCheck className="size-3.5" />
              Marcar todas
            </Button>
          ) : null}
        </div>
        <Separator />

        <div className="max-h-[380px] overflow-y-auto p-1.5">
          {notifications.length === 0 ? (
            <EmptyState compact icon={Bell} title="Sem notificações" />
          ) : (
            notifications.map((item) => {
              const meta = kindMeta[item.kind]
              const Icon = meta.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    markRead(item.id)
                    if (item.href) {
                      navigate(item.href)
                      setOpen(false)
                    }
                  }}
                  className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-primary/7"
                >
                  <span className={cn('mt-0.5 grid size-7 shrink-0 place-items-center rounded-full', meta.tone)}>
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex-1 truncate text-[13px]',
                          item.read ? 'font-normal text-muted-foreground' : 'font-medium',
                        )}
                      >
                        {item.title}
                      </span>
                      {!item.read ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
                      {item.description}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground/70">
                      {relative(item.at)}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
