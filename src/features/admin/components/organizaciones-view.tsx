'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, KeyRound, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRole } from '../hooks/use-role'
import { useOrganizations, useOrganizationMutations } from '../hooks/use-organizations'
import { usePlatformZones } from '../hooks/use-platform-structure'
import { apiErrorMessage } from '../lib/api-error-message'
import { OrganizationZoneSelect } from './organizacion-zona'
import { PrincipalFormDialog, type PrincipalFormValues } from './principal-form-dialog'

/** The zone filter: every zone, one of them, or the organizations in none. */
const ALL_ZONES = 'all'
const NO_ZONE = 'none'

const HEAD = 'text-[11px] uppercase tracking-[0.12em] text-muted-foreground'

export function OrganizacionesView() {
  const router = useRouter()
  const { isDeveloper, isLoading: roleLoading } = useRole()
  const { data: orgs, isLoading } = useOrganizations(isDeveloper)
  const { data: zones = [] } = usePlatformZones(isDeveloper)
  const { create } = useOrganizationMutations()
  const [createOpen, setCreateOpen] = useState(false)
  const [zoneFilter, setZoneFilter] = useState<string>(ALL_ZONES)

  if (!roleLoading && !isDeveloper) {
    return (
      <div className="mx-auto w-full max-w-5xl px-5 py-16 text-center md:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <KeyRound className="size-5" />
          </div>
          <h1 className="font-display text-[22px] text-ink">Acceso restringido</h1>
          <p className="text-[14px] text-muted-foreground">Solo Developer (Lumar) gestiona las organizaciones.</p>
        </div>
      </div>
    )
  }

  const visible = (orgs ?? []).filter(org =>
    zoneFilter === ALL_ZONES ? true : zoneFilter === NO_ZONE ? !org.zone : String(org.zone?.id) === zoneFilter,
  )

  const createOrganization = (values: PrincipalFormValues) =>
    create.mutate(
      {
        name: values.name,
        zoneId: values.zoneId,
        ...(values.masterCode ? { masterCode: values.masterCode } : {}),
        ...(values.codes.length ? { codes: values.codes } : {}),
        ...(values.adminEmail ? { adminEmail: values.adminEmail } : {}),
      },
      {
        onSuccess: created => {
          toast.success(
            created.invitationSent && values.adminEmail
              ? `Principal ${created.name} creado. Le enviamos una invitación a ${values.adminEmail}.`
              : `Principal ${created.name} creado, sin usuarios todavía.`,
          )
          setCreateOpen(false)
          router.push(`/admin/organizaciones/${created.id}`)
        },
        onError: error => toast.error(apiErrorMessage(error, 'No se pudo crear la organización.')),
      },
    )

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">Plataforma · Lumar</div>
          <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">
            Organizaciones
          </h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Cada organización es un principal: sus códigos, sus números y sus usuarios. La zona decide qué Owners la
            ven.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-10">
          <Plus className="size-4" /> Nueva organización
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="org-zone-filter" className="text-[12.5px] text-muted-foreground">
          Zona
        </label>
        <select
          id="org-zone-filter"
          value={zoneFilter}
          onChange={event => setZoneFilter(event.target.value)}
          className="h-9 rounded-md border border-line-2 bg-paper px-2 text-[13px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-ember-ring"
        >
          <option value={ALL_ZONES}>Todas</option>
          {zones.map(zone => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
          <option value={NO_ZONE}>Sin zona</option>
        </select>
      </div>

      <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`h-11 pl-5 ${HEAD}`}>Organización</TableHead>
                <TableHead className={HEAD}>Zona</TableHead>
                <TableHead className={HEAD}>Códigos</TableHead>
                <TableHead className={HEAD}>Usuarios</TableHead>
                <TableHead className={HEAD}>Números</TableHead>
                <TableHead className="w-20 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-5">
                      <Skeleton className="h-4 w-44" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell className="pr-5">
                      <Skeleton className="ml-auto h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))}

              {orgs && visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                        <Building2 className="size-5" />
                      </div>
                      <p className="text-[14px] text-muted-foreground">
                        {orgs.length === 0 ? 'Todavía no hay organizaciones.' : 'Ninguna organización en esa zona.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {visible.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="pl-5">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-medium text-ink">{o.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {o.masterCode ? `master ${o.masterCode} · ` : ''}
                        {o.slug}
                        {!o.isActive && ' · inactiva'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <OrganizationZoneSelect organization={o} zones={zones} />
                  </TableCell>
                  <TableCell className="text-[13px] text-ink-3">{o.counts.codes}</TableCell>
                  <TableCell className="text-[13px] text-ink-3">{o.counts.users}</TableCell>
                  <TableCell className="text-[13px] text-ink-3">{o.counts.phoneNumbers}</TableCell>
                  <TableCell className="pr-5">
                    <div className="flex justify-end">
                      <Button asChild variant="ghost" size="sm" className="h-8">
                        <Link href={`/admin/organizaciones/${o.id}`}>Gestionar</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <PrincipalFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nueva organización"
        description="Un principal nuevo con sus productores. Su primer SuperAdmin, si lo cargás, entra por invitación."
        zones={zones}
        zoneRequired={false}
        masterRequired={false}
        withFirstAccount
        saving={create.isPending}
        submitLabel="Crear organización"
        onSubmit={createOrganization}
      />
    </div>
  )
}
