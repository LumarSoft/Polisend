'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { OrganizationZone } from '@/types/api/organizations'
import type { PlatformZone } from '@/types/api/platform'
import { useOrganizationMutations } from '../hooks/use-organizations'
import { apiErrorMessage } from '../lib/api-error-message'
import { ConfirmActionDialog } from './confirm-action-dialog'

const NONE = ''

function ownersOf(zone: PlatformZone | undefined): string {
  return zone?.owners.map(owner => owner.name ?? owner.email).join(', ') ?? ''
}

/**
 * The zone an organization sits in, as a selector (Organizaciones, list and detail). Moving it changes which Owners
 * reach it and mails everyone who reached it before or after, so it asks first.
 */
export function OrganizationZoneSelect({
  organization,
  zones,
  className = '',
}: {
  organization: { id: number; name: string; zone: OrganizationZone | null }
  zones: PlatformZone[]
  className?: string
}) {
  const { update } = useOrganizationMutations(organization.id)
  const [target, setTarget] = useState<number | null | undefined>(undefined)
  const current = organization.zone?.id ?? null
  const from = zones.find(zone => zone.id === current)
  const to = zones.find(zone => zone.id === target)

  const move = () => {
    if (target === undefined) return
    update.mutate(
      { id: organization.id, data: { zoneId: target } },
      {
        onSuccess: () => {
          toast.success(to ? `${organization.name} pasó a la zona ${to.name}` : `${organization.name} quedó sin zona`)
          setTarget(undefined)
        },
        onError: error => {
          toast.error(apiErrorMessage(error, 'No se pudo mover el principal.'))
          setTarget(undefined)
        },
      },
    )
  }

  return (
    <>
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <select
          aria-label={`Zona de ${organization.name}`}
          value={current === null ? NONE : String(current)}
          disabled={update.isPending}
          onChange={event => {
            const next = event.target.value === NONE ? null : Number(event.target.value)
            if (next !== current) setTarget(next)
          }}
          className="h-8 max-w-48 rounded-md border border-line-2 bg-paper px-2 text-[13px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-ember-ring"
        >
          <option value={NONE}>Sin zona</option>
          {/* A zone deleted since still shows as the current one until it is moved. */}
          {organization.zone && !from && <option value={String(organization.zone.id)}>{organization.zone.name}</option>}
          {zones.map(zone => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
        {update.isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </span>

      <ConfirmActionDialog
        open={target !== undefined}
        onOpenChange={open => !open && setTarget(undefined)}
        title={to ? `¿Mover ${organization.name} a ${to.name}?` : `¿Dejar ${organization.name} sin zona?`}
        confirmLabel={to ? 'Mover' : 'Dejar sin zona'}
        pending={update.isPending}
        onConfirm={move}
      >
        {to && (
          <p>
            {to.owners.length > 0
              ? `Pasa a verlo ${to.owners.length === 1 ? 'el Owner' : 'los Owners'} de ${to.name}: ${ownersOf(to)}.`
              : `${to.name} no tiene Owner todavía.`}
          </p>
        )}
        {from && from.owners.length > 0 && (
          <p>
            Deja de verlo {from.owners.length === 1 ? 'el Owner' : 'los Owners'} de {from.name}: {ownersOf(from)} (salvo
            que sea su principal propio).
          </p>
        )}
        <p>Les avisamos por mail a sus usuarios y a los Owners que lo veían o lo van a ver.</p>
      </ConfirmActionDialog>
    </>
  )
}
