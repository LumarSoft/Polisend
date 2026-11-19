'use client'

import { LifeBuoy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSupport } from '../context/support-context'
import { useProfile } from '../hooks/use-profile'
import { ROLES, roleLabel } from '../lib/roles'

/**
 * Over every screen while an Owner is inside another user's panel giving support: whose panel it is, that what it does
 * is recorded as the Owner's, and the way back to its own panel. Nothing shows outside support.
 */
export function SupportBanner() {
  const { active, exit } = useSupport()
  const { data: profile } = useProfile()
  if (!active || !profile?.supportedBy) return null

  const who = profile.name || profile.email
  // An Admin that is SuperAdmin of a zone's groups is shown as SuperAdmin, as everywhere in the panel.
  const role = roleLabel(profile.managedGroups?.length ? ROLES.superAdmin : profile.role)
  const where = profile.organization?.displayName ?? profile.organization?.name
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-amber/40 bg-amber/15 px-4 py-2 text-[13px] text-ink"
    >
      <LifeBuoy className="size-4 shrink-0 text-ink-3" />
      <span className="min-w-0 flex-1">
        <span className="font-semibold">Modo soporte</span> · Estás en el panel de{' '}
        <span className="font-medium">{who}</span>
        <span className="text-ink-3">
          {' '}
          ({role}
          {where ? ` de ${where}` : ''})
        </span>
        . Lo que hagas queda registrado a tu nombre.
      </span>
      <Button size="sm" variant="outline" className="h-8 bg-background" onClick={exit}>
        Salir del soporte
      </Button>
    </div>
  )
}
