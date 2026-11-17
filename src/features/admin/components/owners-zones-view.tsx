'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FolderPlus, KeyRound, MoreHorizontal, Pencil, ShieldOff, Trash2, UserMinus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CreateZoneRequest, Zone } from '@/types/api/hierarchy'
import type { PlatformOwner, PlatformZone } from '@/types/api/platform'
import {
  usePlatformOwnerActions,
  usePlatformOwners,
  usePlatformZoneActions,
  usePlatformZones,
} from '../hooks/use-platform-structure'
import type { AccountAccessAction } from '../hooks/use-account-access'
import { useRole } from '../hooks/use-role'
import { apiErrorMessage } from '../lib/api-error-message'
import { AccountAccessDialog, TwoFactorBadge } from './account-access-dialog'
import { ConfirmActionDialog } from './confirm-action-dialog'
import { EditOwnerDialog, NewOwnerDialog } from './owner-form-dialog'
import { ZoneFormDialog } from './zone-form-dialog'

const HEAD = 'text-[11px] uppercase tracking-[0.12em] text-faint'
const PAGE = 'mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10'

function ownerName(owner: { name: string | null; email: string }): string {
  return owner.name ?? owner.email
}

/**
 * "Owners y zonas" (plan §6.4), the Developer's: the Owners with their zones and their own principal, and the
 * platform's zones. The platform never chooses or changes a password or an e-mail: a new Owner is invited by a mailed
 * link, and one who lost access gets a new link.
 */
export function OwnersZonesView() {
  const { isDeveloper, isLoading: roleLoading } = useRole()
  const owners = usePlatformOwners(isDeveloper)
  const zones = usePlatformZones(isDeveloper)
  const ownerActions = usePlatformOwnerActions()
  const zoneActions = usePlatformZoneActions()

  const [newOwnerOpen, setNewOwnerOpen] = useState(false)
  const [editing, setEditing] = useState<PlatformOwner | null>(null)
  const [access, setAccess] = useState<{ action: AccountAccessAction; owner: PlatformOwner } | null>(null)
  const [demoting, setDemoting] = useState<PlatformOwner | null>(null)
  const [zoneDialog, setZoneDialog] = useState<{ zone: Zone | null } | null>(null)
  const [zoneToDelete, setZoneToDelete] = useState<PlatformZone | null>(null)

  if (!roleLoading && !isDeveloper) {
    return (
      <div className={PAGE}>
        <p className="text-[14px] text-muted-foreground">Solo Developer (Lumar) gestiona los Owners y las zonas.</p>
      </div>
    )
  }

  const zoneList = zones.data ?? []

  const demote = () => {
    if (!demoting) return
    ownerActions.demoteOwner.mutate(demoting.id, {
      onSuccess: () => {
        toast.success(`${ownerName(demoting)} volvió a ser SuperAdmin de ${demoting.home.name}`)
        setDemoting(null)
      },
      onError: error => {
        toast.error(apiErrorMessage(error, 'No se pudo bajar a SuperAdmin.'))
        setDemoting(null)
      },
    })
  }

  const saveZone = (data: CreateZoneRequest) => {
    const current = zoneDialog?.zone
    const options = {
      onSuccess: () => {
        toast.success(current ? 'Zona actualizada' : `Zona creada: ${data.name}`)
        setZoneDialog(null)
      },
      onError: (error: unknown) => toast.error(apiErrorMessage(error, 'No se pudo guardar la zona.')),
    }
    if (current) zoneActions.updateZone.mutate({ id: current.id, data }, options)
    else zoneActions.createZone.mutate(data, options)
  }

  const deleteZone = () => {
    if (!zoneToDelete) return
    zoneActions.removeZone.mutate(zoneToDelete.id, {
      onSuccess: () => {
        toast.success(`Zona borrada: ${zoneToDelete.name}`)
        setZoneToDelete(null)
      },
      onError: error => {
        toast.error(apiErrorMessage(error, 'No se pudo borrar la zona.'))
        setZoneToDelete(null)
      },
    })
  }

  return (
    <div className={`${PAGE} flex flex-col gap-10`}>
      <div>
        <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">Plataforma · Lumar</div>
        <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">Owners y zonas</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] text-muted-foreground">
          Cada Owner maneja una o más zonas y ve sus principales, además del suyo propio. Las zonas agrupan principales;
          un principal se mueve de zona desde Organizaciones.
        </p>
      </div>

      {/* ── Owners ── */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[20px] tracking-[-0.02em] text-ink">Owners</h2>
            <p className="text-[13px] text-muted-foreground">
              Se crean por invitación: la persona elige su contraseña desde el enlace que le llega.
            </p>
          </div>
          <Button className="h-10" onClick={() => setNewOwnerOpen(true)}>
            <UserPlus className="size-4" /> Nuevo Owner
          </Button>
        </div>

        <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={`h-11 pl-5 ${HEAD}`}>Owner</TableHead>
                  <TableHead className={HEAD}>Principal propio</TableHead>
                  <TableHead className={HEAD}>Zonas</TableHead>
                  <TableHead className="w-12 pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="pl-5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                )}
                {owners.isError && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-[14px] text-destructive">
                      No se pudieron cargar los Owners.
                    </TableCell>
                  </TableRow>
                )}
                {owners.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-[14px] text-muted-foreground">
                      Todavía no hay Owners.
                    </TableCell>
                  </TableRow>
                )}
                {owners.data?.map(owner => (
                  <TableRow key={owner.id}>
                    <TableCell className="pl-5">
                      <div className="flex flex-col">
                        <span className="flex flex-wrap items-center gap-1.5 text-[14px] font-medium text-ink">
                          {ownerName(owner)}
                          <TwoFactorBadge enabled={owner.twoFactorEnabled} />
                        </span>
                        {owner.name && <span className="text-[12px] text-muted-foreground">{owner.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px]">
                      <Link href={`/admin/organizaciones/${owner.home.id}`} className="text-ink-3 hover:underline">
                        {owner.home.name}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {owner.zones.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {owner.zones.map(zone => (
                            <Badge key={zone.id} variant="outline" className="border-line-2 font-normal text-ink-3">
                              {zone.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12.5px] text-muted-foreground">Sin zonas: ve solo su principal</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Opciones de ${ownerName(owner)}`}
                          className="rounded-full p-1.5 text-muted-foreground outline-none hover:bg-secondary data-[state=open]:bg-secondary"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-auto min-w-56">
                          <DropdownMenuItem onSelect={() => setEditing(owner)}>
                            <Pencil className="size-4" /> Editar nombre y zonas
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setAccess({ action: 'password-setup', owner })}>
                            <KeyRound className="size-4" /> Mandar enlace para elegir contraseña
                          </DropdownMenuItem>
                          {owner.twoFactorEnabled && (
                            <DropdownMenuItem onSelect={() => setAccess({ action: 'reset-two-factor', owner })}>
                              <ShieldOff className="size-4" /> Reiniciar verificación en dos pasos
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setDemoting(owner)}>
                            <UserMinus className="size-4" /> Bajar a SuperAdmin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>

      {/* ── Zones ── */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[20px] tracking-[-0.02em] text-ink">Zonas</h2>
            <p className="text-[13px] text-muted-foreground">
              Una zona creada acá no tiene Owner hasta que se la asignes. Solo se borra una zona vacía.
            </p>
          </div>
          <Button variant="outline" className="h-10" onClick={() => setZoneDialog({ zone: null })}>
            <FolderPlus className="size-4" /> Nueva zona
          </Button>
        </div>

        <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={`h-11 pl-5 ${HEAD}`}>Zona</TableHead>
                  <TableHead className={HEAD}>Owners</TableHead>
                  <TableHead className={HEAD}>Principales</TableHead>
                  <TableHead className="w-24 pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="pl-5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                )}
                {zones.isError && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-[14px] text-destructive">
                      No se pudieron cargar las zonas.
                    </TableCell>
                  </TableRow>
                )}
                {zones.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-[14px] text-muted-foreground">
                      Todavía no hay zonas.
                    </TableCell>
                  </TableRow>
                )}
                {zoneList.map(zone => (
                  <TableRow key={zone.id}>
                    <TableCell className="pl-5">
                      <span className="text-[14px] font-medium text-ink">{zone.name}</span>
                      {zone.code && (
                        <span className="ml-2 font-mono text-[11.5px] text-muted-foreground">Triunfo {zone.code}</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal text-[13px] text-ink-3">
                      {zone.owners.length > 0 ? (
                        zone.owners.map(ownerName).join(', ')
                      ) : (
                        <span className="text-muted-foreground">Sin Owner</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {zone.principals.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {zone.principals.map(principal => (
                            <Badge
                              key={principal.id}
                              variant="outline"
                              className={`border-line-2 font-normal ${principal.isActive ? 'text-ink-3' : 'text-muted-foreground line-through'}`}
                              asChild
                            >
                              <Link href={`/admin/organizaciones/${principal.id}`}>{principal.name}</Link>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12.5px] text-muted-foreground">Vacía</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Editar la zona ${zone.name}`}
                          onClick={() => setZoneDialog({ zone })}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          aria-label={`Borrar la zona ${zone.name}`}
                          disabled={zone.principals.length > 0}
                          title={
                            zone.principals.length > 0
                              ? 'Solo se borra una zona vacía: mové sus principales desde Organizaciones'
                              : undefined
                          }
                          onClick={() => setZoneToDelete(zone)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>

      <NewOwnerDialog open={newOwnerOpen} onOpenChange={setNewOwnerOpen} zones={zoneList} />
      <EditOwnerDialog owner={editing} onOpenChange={open => !open && setEditing(null)} zones={zoneList} />

      <AccountAccessDialog
        scope="owner"
        action={access?.action ?? 'password-setup'}
        account={access?.owner ?? null}
        onClose={() => setAccess(null)}
      />

      <ConfirmActionDialog
        open={demoting !== null}
        onOpenChange={open => !open && setDemoting(null)}
        title={`¿Bajar a ${demoting ? ownerName(demoting) : ''} a SuperAdmin?`}
        confirmLabel="Bajar a SuperAdmin"
        destructive
        pending={ownerActions.demoteOwner.isPending}
        onConfirm={demote}
      >
        {demoting && (
          <p>
            Vuelve a ser SuperAdmin de {demoting.home.name} y deja de manejar sus zonas
            {demoting.zones.length > 0 ? ` (${demoting.zones.map(zone => zone.name).join(', ')})` : ''}. La cuenta no se
            borra.
          </p>
        )}
      </ConfirmActionDialog>

      <ZoneFormDialog
        open={zoneDialog !== null}
        onOpenChange={open => !open && setZoneDialog(null)}
        zone={zoneDialog?.zone ?? null}
        description={
          zoneDialog?.zone
            ? 'Cambiá el nombre o el código de Triunfo de la zona.'
            : 'Queda sin Owner hasta que se la asignes desde «Editar nombre y zonas».'
        }
        saving={zoneActions.createZone.isPending || zoneActions.updateZone.isPending}
        onSave={saveZone}
      />

      <ConfirmActionDialog
        open={zoneToDelete !== null}
        onOpenChange={open => !open && setZoneToDelete(null)}
        title={`¿Borrar la zona ${zoneToDelete?.name ?? ''}?`}
        confirmLabel="Borrar zona"
        destructive
        pending={zoneActions.removeZone.isPending}
        onConfirm={deleteZone}
      >
        <p>
          La zona está vacía.
          {zoneToDelete && zoneToDelete.owners.length > 0
            ? ` ${zoneToDelete.owners.map(ownerName).join(', ')} deja de tenerla.`
            : ''}
        </p>
      </ConfirmActionDialog>
    </div>
  )
}
