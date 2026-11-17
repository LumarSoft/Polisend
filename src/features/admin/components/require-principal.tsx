'use client'

import type { ReactNode } from 'react'
import { Building2 } from 'lucide-react'
import { useActingPrincipal } from '../context/acting-principal-context'
import { NO_ZONE } from '../lib/network'
import { NetworkFilter } from './network-filter'

/**
 * Work screens show one principal at a time. For an Owner whose zone change left the principal unset, this shows
 * «Elegí un principal de la zona X» (with the filter to choose it, unless the screen shows it already) instead of the screen's content; for everyone else,
 * and once a principal is chosen, it renders its children untouched.
 */
export function RequirePrincipal({
  children,
  showFilter = true,
}: {
  children: ReactNode
  /** Off where the screen already shows the cascading filter above. */
  showFilter?: boolean
}) {
  const { isOwnerSession, hasPrincipal, zone } = useActingPrincipal()
  if (!isOwnerSession || hasPrincipal) return children

  const title = zone && zone.key !== NO_ZONE ? `Elegí un principal de la zona ${zone.name}` : 'Elegí un principal'
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-5 py-16 text-center md:px-8">
      <div className="flex size-12 items-center justify-center rounded-full bg-ember-soft text-ember-2">
        <Building2 className="size-5" />
      </div>
      <div>
        <h2 className="font-display text-[22px] tracking-[-0.02em] text-ink">{title}</h2>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Las pantallas de trabajo muestran un principal por vez: elegilo para ver sus datos.
        </p>
      </div>
      {showFilter && <NetworkFilter showProducer={false} className="justify-center" />}
    </div>
  )
}
