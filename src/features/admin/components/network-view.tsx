'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderPlus, MapPinned, Network, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { NetworkTree, NetworkTreePrincipal, NetworkTreeZone, Zone } from '@/types/api/hierarchy'
import { useActingPrincipal } from '../context/acting-principal-context'
import { useNetworkTree, usePrincipalActions, useZoneActions } from '../hooks/use-hierarchy'
import { useRole } from '../hooks/use-role'
import { apiErrorMessage } from '../lib/api-error-message'
import { NO_ZONE, noZoneLabel, type ZoneKey } from '../lib/network'
import { ConfirmActionDialog } from './confirm-action-dialog'
import { EMPTY_NETWORK_FILTER, NetworkFilter, type NetworkListFilterValue } from './network-filter'
import { NetworkPrincipalCard } from './network-principal-card'
import { PrincipalFormDialog, type PrincipalFormValues } from './principal-form-dialog'
import { ZoneFormDialog } from './zone-form-dialog'

/** A block of "Mi red": one of the Owner's zones, or its own principal when it is in none of them. */
interface NetworkGroup {
  key: ZoneKey
  name: string
  zone: NetworkTreeZone | null
  principals: NetworkTreePrincipal[]
}

function groupsOf(tree: NetworkTree): NetworkGroup[] {
  const groups: NetworkGroup[] = tree.zones.map(zone => ({
    key: zone.id,
    name: zone.name,
    zone,
    principals: zone.principals,
  }))
  if (tree.home) groups.push({ key: NO_ZONE, name: noZoneLabel(false), zone: null, principals: [tree.home] })
  return groups
}

/** The three filter levels over the tree: a zone, a principal; the productor narrows its codes. */
function filterGroups(groups: NetworkGroup[], filter: NetworkListFilterValue): NetworkGroup[] {
  return groups
    .filter(group => filter.zoneKey === null || group.key === filter.zoneKey)
    .map(group =>
      filter.principalId === null
        ? group
        : { ...group, principals: group.principals.filter(p => p.id === filter.principalId) },
    )
    .filter(group => filter.principalId === null || group.principals.length > 0)
}

const PAGE = 'mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-10'

/**
 * "Mi red" (plan §6.2), the Owner's home: Zona → Principal → Productores with the counters of `GET /hierarchy/tree`
 * (message counts, never an amount). From here it creates zones, principals and codes, enters a principal (makes it
 * the active one) and goes to its users.
 */
export function NetworkView() {
  const router = useRouter()
  const { isOwner, isLoading: roleLoading } = useRole()
  const acting = useActingPrincipal()
  const { data: tree, isLoading, isError } = useNetworkTree(isOwner)
  const { createZone, updateZone, removeZone } = useZoneActions()
  const { createPrincipal } = usePrincipalActions()

  const [filter, setFilter] = useState<NetworkListFilterValue>(EMPTY_NETWORK_FILTER)
  const [zoneDialog, setZoneDialog] = useState<{ zone: Zone | null } | null>(null)
  const [principalDialog, setPrincipalDialog] = useState<{ zoneId: number | null } | null>(null)
  const [zoneToDelete, setZoneToDelete] = useState<NetworkTreeZone | null>(null)

  if (!roleLoading && !isOwner) {
    return (
      <div className={PAGE}>
        <p className="text-[14px] text-muted-foreground">«Mi red» es la pantalla de los Owners.</p>
      </div>
    )
  }

  const zones = tree?.zones ?? []
  const groups = tree ? filterGroups(groupsOf(tree), filter) : []
  const hasZones = zones.length > 0

  const enter = (principal: NetworkTreePrincipal) => {
    acting.selectPrincipal(principal.id)
    router.push('/admin')
  }

  const saveZone = (data: { name: string; code?: string | null }) => {
    const editing = zoneDialog?.zone
    const options = {
      onSuccess: () => {
        toast.success(editing ? 'Zona actualizada' : `Zona creada: ${data.name}`)
        setZoneDialog(null)
      },
      onError: (error: unknown) => toast.error(apiErrorMessage(error, 'No se pudo guardar la zona.')),
    }
    if (editing) updateZone.mutate({ id: editing.id, data }, options)
    else createZone.mutate(data, options)
  }

  const savePrincipal = (values: PrincipalFormValues) => {
    if (values.zoneId === null) return
    createPrincipal.mutate(
      { zoneId: values.zoneId, name: values.name, masterCode: values.masterCode, codes: values.codes },
      {
        onSuccess: created => {
          toast.success(`Principal ${created.name} creado. Ahora podés crearle un SuperAdmin desde Usuarios.`)
          setPrincipalDialog(null)
        },
        onError: error => toast.error(apiErrorMessage(error, 'No se pudo crear el principal.')),
      },
    )
  }

  const deleteZone = () => {
    if (!zoneToDelete) return
    removeZone.mutate(zoneToDelete.id, {
      onSuccess: () => {
        toast.success(`Zona borrada: ${zoneToDelete.name}`)
        if (filter.zoneKey === zoneToDelete.id) setFilter(EMPTY_NETWORK_FILTER)
        setZoneToDelete(null)
      },
      onError: error => {
        toast.error(apiErrorMessage(error, 'No se pudo borrar la zona.'))
        setZoneToDelete(null)
      },
    })
  }

  return (
    <div className={PAGE}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">Mi red</div>
          <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">Mi red</h1>
          <p className="mt-1.5 max-w-2xl text-[14px] text-muted-foreground">
            Tus zonas, sus principales y sus productores. Entrá a un principal para trabajar en su cartera como su
            SuperAdmin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10" onClick={() => setZoneDialog({ zone: null })}>
            <FolderPlus className="size-4" /> Nueva zona
          </Button>
          <Button
            className="h-10"
            disabled={!hasZones}
            title={hasZones ? undefined : 'Primero creá una zona'}
            onClick={() => setPrincipalDialog({ zoneId: null })}
          >
            <Plus className="size-4" /> Nuevo principal
          </Button>
        </div>
      </div>

      {tree && (hasZones || tree.home) && (
        <NetworkFilter mode="network" value={filter} onChange={setFilter} className="mb-5" />
      )}

      {isError && <p className="mb-4 text-[14px] text-destructive">No se pudo cargar tu red.</p>}

      {isLoading || roleLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        tree && (
          <div className="flex flex-col gap-8">
            {!hasZones && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-2 px-6 py-10 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-ember-soft text-ember-2">
                  <MapPinned className="size-5" />
                </div>
                <h2 className="font-display text-[20px] tracking-[-0.02em] text-ink">Todavía no tenés zonas</h2>
                <p className="max-w-md text-[13.5px] text-muted-foreground">
                  Una zona agrupa principales. Creá la primera para sumar principales a tu red; mientras tanto ves tu
                  principal propio.
                </p>
                <Button variant="outline" onClick={() => setZoneDialog({ zone: null })}>
                  <FolderPlus className="size-4" /> Nueva zona
                </Button>
              </div>
            )}

            {groups.map(group => (
              <section key={String(group.key)} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-2 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Network className="size-4 text-ember-2" />
                    <h2 className="font-display text-[19px] tracking-[-0.02em] text-ink">{group.name}</h2>
                    {group.zone?.code && (
                      <Badge variant="outline" className="border-line-2 font-mono text-[11px] text-ink-3">
                        Triunfo {group.zone.code}
                      </Badge>
                    )}
                    <span className="text-[12px] text-muted-foreground">
                      {group.principals.length === 1 ? '1 principal' : `${group.principals.length} principales`}
                    </span>
                  </div>
                  {group.zone && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[12.5px]"
                        onClick={() => setPrincipalDialog({ zoneId: group.zone?.id ?? null })}
                      >
                        <Plus className="size-3.5" /> Nuevo principal
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Editar la zona ${group.name}`}
                        onClick={() => group.zone && setZoneDialog({ zone: group.zone })}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        aria-label={`Borrar la zona ${group.name}`}
                        disabled={group.zone.principals.length > 0}
                        title={
                          group.zone.principals.length > 0
                            ? 'Solo se borra una zona vacía: mové sus principales antes'
                            : undefined
                        }
                        onClick={() => group.zone && setZoneToDelete(group.zone)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {group.principals.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line-2 px-4 py-6 text-center text-[13px] text-muted-foreground">
                    Esta zona todavía no tiene principales.
                  </p>
                ) : (
                  group.principals.map(principal => (
                    <NetworkPrincipalCard
                      key={principal.id}
                      principal={principal}
                      onlyCodeId={filter.principalId === principal.id ? filter.producerCodeId : null}
                      isActing={acting.hasPrincipal && acting.actingPrincipalId === principal.id}
                      canEnter={acting.principals.some(p => p.id === principal.id)}
                      onEnter={() => enter(principal)}
                    />
                  ))
                )}
              </section>
            ))}

            {hasZones && groups.length === 0 && (
              <p className="py-10 text-center text-[14px] text-muted-foreground">Nada coincide con el filtro.</p>
            )}
          </div>
        )
      )}

      <ZoneFormDialog
        open={zoneDialog !== null}
        onOpenChange={open => !open && setZoneDialog(null)}
        zone={zoneDialog?.zone ?? null}
        description={
          zoneDialog?.zone
            ? 'Cambiá el nombre o el código de Triunfo de la zona.'
            : 'Queda a tu cargo. Después creá sus principales o pedile a la plataforma que mueva uno existente.'
        }
        saving={createZone.isPending || updateZone.isPending}
        onSave={saveZone}
      />

      <PrincipalFormDialog
        open={principalDialog !== null}
        onOpenChange={open => !open && setPrincipalDialog(null)}
        title="Nuevo principal"
        description="Un principal es una organización con sus productores. Se crea sin usuarios: después le creás su SuperAdmin desde Usuarios."
        zones={zones}
        zoneRequired
        defaultZoneId={principalDialog?.zoneId ?? null}
        masterRequired
        saving={createPrincipal.isPending}
        submitLabel="Crear principal"
        onSubmit={savePrincipal}
      />

      <ConfirmActionDialog
        open={zoneToDelete !== null}
        onOpenChange={open => !open && setZoneToDelete(null)}
        title={`¿Borrar la zona ${zoneToDelete?.name ?? ''}?`}
        confirmLabel="Borrar zona"
        destructive
        pending={removeZone.isPending}
        onConfirm={deleteZone}
      >
        <p>La zona está vacía. Si la comparte otro Owner, solo la plataforma puede borrarla.</p>
      </ConfirmActionDialog>
    </div>
  )
}
