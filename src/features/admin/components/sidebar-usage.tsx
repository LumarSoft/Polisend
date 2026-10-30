'use client'

import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMonthUsage } from '../hooks/use-month-usage'
import { NEAR_LIMIT_PERCENT } from '../lib/month-usage'

const int = (n: number) => n.toLocaleString('es-AR')

/** The month's messages against the plan, above the user menu. Opens Facturación. */
export function SidebarUsage({ enabled }: { enabled: boolean }) {
  const usage = useMonthUsage(enabled)
  if (!usage) return null

  const tone = usage.percent >= NEAR_LIMIT_PERCENT || usage.nearLimit ? 'bg-amber' : 'bg-ember'
  const several = usage.numbers.length > 1

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/admin/facturacion"
          aria-label={`Mensajes de ${usage.monthLabel}: ${int(usage.used)} de ${int(usage.included)}`}
          className="block rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden"
        >
          <div className="flex items-baseline justify-between gap-2 text-[11px] leading-none">
            <span className="text-muted-foreground">Mensajes de {usage.monthLabel}</span>
            <span className="text-muted-foreground tabular-nums">
              <span className="font-semibold text-sidebar-foreground">{int(usage.used)}</span> / {int(usage.included)}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-2">
            <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${usage.percent}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] leading-none text-muted-foreground">
            {usage.remaining > 0 ? `Quedan ${int(usage.remaining)}` : 'Plan completo: sigue en el siguiente'}
            {several ? ` · ${usage.numbers.length} números` : ''}
          </p>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" align="end" className="max-w-64">
        {several ? (
          <ul className="space-y-0.5">
            {usage.numbers.map(n => (
              <li key={n.id} className="flex justify-between gap-3 tabular-nums">
                <span>{n.number}</span>
                <span>
                  {int(n.used)} de {int(n.included)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span>Si se pasa del plan, el número sube solo al siguiente. Detalle en Facturación.</span>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
