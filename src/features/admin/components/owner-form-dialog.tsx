'use client'

import { useState, type FormEvent } from 'react'
import { Loader2, Mail, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PlatformOwner, PlatformZone } from '@/types/api/platform'
import { useNetworkUsers } from '../hooks/use-hierarchy'
import { useOrganizations } from '../hooks/use-organizations'
import { usePlatformOwnerActions } from '../hooks/use-platform-structure'
import { apiErrorMessage } from '../lib/api-error-message'
import { roleLabel } from '../lib/roles'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The zones an Owner manages: every zone of the platform, with who has it today. */
export function ZoneChecklist({
  zones,
  value,
  onChange,
  ownerId = null,
}: {
  zones: PlatformZone[]
  value: number[]
  onChange: (ids: number[]) => void
  /** The Owner being edited: its own name is left out of each zone's Owners. */
  ownerId?: number | null
}) {
  if (zones.length === 0) {
    return (
      <p className="text-[12.5px] text-muted-foreground">
        Todavía no hay zonas. Creá una en «Zonas»; sin zonas, el Owner ve solo su principal propio.
      </p>
    )
  }
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter(z => z !== id) : [...value, id])
  return (
    <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border border-line-2 p-1.5">
      {zones.map(zone => {
        const others = zone.owners.filter(owner => owner.id !== ownerId)
        return (
          <label
            key={zone.id}
            className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-[13px] hover:bg-secondary/60"
          >
            <input
              type="checkbox"
              checked={value.includes(zone.id)}
              onChange={() => toggle(zone.id)}
              className="mt-0.5 size-4 accent-[var(--color-ember)]"
            />
            <span className="flex min-w-0 flex-col">
              <span className="text-ink">
                {zone.name}
                {zone.code && <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">{zone.code}</span>}
              </span>
              <span className="text-[11.5px] text-muted-foreground">
                {zone.principals.length === 1 ? '1 principal' : `${zone.principals.length} principales`}
                {others.length > 0 && ` · ya la tiene ${others.map(o => o.name ?? o.email).join(', ')}`}
              </span>
            </span>
          </label>
        )
      })}
    </div>
  )
}

type CreateMode = 'invite' | 'convert'

/** "Nuevo Owner": invite a new person (no password: a mailed link) or convert a SuperAdmin or Admin. */
export function NewOwnerDialog({
  open,
  onOpenChange,
  zones,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  zones: PlatformZone[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">Nuevo Owner</DialogTitle>
          <DialogDescription>
            Un Owner es el dueño de una red: ve y opera los principales de sus zonas y su principal propio, de a uno, y
            nunca ve importes.
          </DialogDescription>
        </DialogHeader>
        {open && <NewOwnerForm zones={zones} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function NewOwnerForm({ zones, onDone }: { zones: PlatformZone[]; onDone: () => void }) {
  const { createOwner } = usePlatformOwnerActions()
  const [mode, setMode] = useState<CreateMode>('invite')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [homeId, setHomeId] = useState<number | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [zoneIds, setZoneIds] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)

  const { data: organizations = [], isLoading: orgsLoading } = useOrganizations(mode === 'invite')
  const { data: users = [], isLoading: usersLoading } = useNetworkUsers({}, mode === 'convert')

  const errors =
    mode === 'invite'
      ? {
          name: name.trim() ? null : 'Falta el nombre.',
          email: EMAIL_PATTERN.test(email.trim()) ? null : 'Revisá el correo.',
          home: homeId === null ? 'Elegí su principal propio.' : null,
        }
      : { user: userId === null ? 'Elegí la cuenta que pasa a ser Owner.' : null }
  const invalid = Object.values(errors).some(Boolean)
  const show = (message: string | null | undefined) =>
    submitted && message ? <p className="text-[12px] text-destructive">{message}</p> : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (invalid) return
    const data =
      mode === 'invite'
        ? { name: name.trim(), email: email.trim(), homeProducerId: homeId as number, zoneIds }
        : { existingUserId: userId as number, zoneIds }
    createOwner.mutate(data, {
      onSuccess: owner => {
        toast.success(
          owner.invitationSent
            ? `Le enviamos una invitación a ${owner.email} para que elija su contraseña`
            : `${owner.name ?? owner.email} ahora es Owner`,
        )
        onDone()
      },
      onError: error => toast.error(apiErrorMessage(error, 'No se pudo crear el Owner.')),
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 py-2" noValidate>
      <Tabs
        value={mode}
        onValueChange={value => {
          setMode(value as CreateMode)
          setSubmitted(false)
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="invite" className="flex-1">
            <Mail className="size-3.5" /> Invitar a una persona
          </TabsTrigger>
          <TabsTrigger value="convert" className="flex-1">
            <UserCog className="size-3.5" /> Convertir un usuario existente
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === 'invite' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="owner-name">Nombre</Label>
              <Input
                id="owner-name"
                maxLength={80}
                value={name}
                onChange={event => setName(event.target.value)}
                autoFocus
              />
              {show(errors.name)}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="owner-email">Correo</Label>
              <Input
                id="owner-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="persona@empresa.com"
              />
              {show(errors.email)}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Combobox
              label="Principal propio"
              placeholder={orgsLoading ? 'Cargando…' : 'Elegí un principal'}
              value={homeId === null ? null : String(homeId)}
              options={organizations.map(org => ({
                value: String(org.id),
                label: org.name,
                hint: org.zone?.name ?? 'Sin zona',
              }))}
              onChange={value => setHomeId(Number(value))}
              disabled={orgsLoading}
              className="w-full"
            />
            <p className="text-[12px] text-muted-foreground">
              Su organización: la ve aunque no esté en una de sus zonas.
            </p>
            {show(errors.home)}
          </div>
          <p className="flex items-start gap-1.5 rounded-lg bg-secondary/50 px-3 py-2 text-[12.5px] text-ink-3">
            <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            No elegís contraseña: le llega una invitación a su correo para que elija la suya (vence en 72 horas). Los
            principales que va a ver reciben un aviso.
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <Combobox
              label="Cuenta"
              placeholder={usersLoading ? 'Cargando…' : 'Elegí un SuperAdmin o un Admin'}
              value={userId === null ? null : String(userId)}
              options={users.map(user => ({
                value: String(user.id),
                label: user.name ? `${user.name} · ${user.email}` : user.email,
                hint: `${roleLabel(user.role)} de ${user.principal.name}`,
              }))}
              onChange={value => setUserId(Number(value))}
              disabled={usersLoading}
              className="w-full"
            />
            {show(errors.user)}
          </div>
          <p className="rounded-lg bg-secondary/50 px-3 py-2 text-[12.5px] text-ink-3">
            Conserva su contraseña y su organización como principal propio, y deja de tener códigos asignados: como
            Owner ve todos los de sus principales.
          </p>
        </>
      )}

      <div className="flex flex-col gap-2">
        <Label>Zonas</Label>
        <ZoneChecklist zones={zones} value={zoneIds} onChange={setZoneIds} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createOwner.isPending}>
          {createOwner.isPending && <Loader2 className="size-4 animate-spin" />}
          {mode === 'invite' ? 'Enviar invitación' : 'Convertir en Owner'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Rename an Owner and replace its zones. Its e-mail and password are its own: the platform sends a link instead. */
export function EditOwnerDialog({
  owner,
  onOpenChange,
  zones,
}: {
  owner: PlatformOwner | null
  onOpenChange: (open: boolean) => void
  zones: PlatformZone[]
}) {
  return (
    <Dialog open={owner !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">Editar Owner</DialogTitle>
          <DialogDescription>Su nombre y las zonas que maneja.</DialogDescription>
        </DialogHeader>
        {owner && <EditOwnerForm owner={owner} zones={zones} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function EditOwnerForm({ owner, zones, onDone }: { owner: PlatformOwner; zones: PlatformZone[]; onDone: () => void }) {
  const { updateOwner } = usePlatformOwnerActions()
  const [name, setName] = useState(owner.name ?? '')
  const [zoneIds, setZoneIds] = useState<number[]>(owner.zones.map(zone => zone.id))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    updateOwner.mutate(
      { id: owner.id, data: { name: name.trim(), zoneIds } },
      {
        onSuccess: () => {
          toast.success('Owner actualizado')
          onDone()
        },
        onError: error => toast.error(apiErrorMessage(error, 'No se pudo guardar el Owner.')),
      },
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-owner-name">Nombre</Label>
        <Input
          id="edit-owner-name"
          required
          maxLength={80}
          value={name}
          onChange={event => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-medium text-ink">Correo</span>
        <span className="text-[13px] text-ink-3">{owner.email}</span>
        <span className="text-[12px] text-muted-foreground">
          El correo y la contraseña son de la persona: si perdió el acceso, mandale un enlace para elegir contraseña.
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Zonas</Label>
        <ZoneChecklist zones={zones} value={zoneIds} onChange={setZoneIds} ownerId={owner.id} />
        <p className="text-[12px] text-muted-foreground">
          Su principal propio ({owner.home.name}) lo sigue viendo siempre. Los principales que empiece a ver reciben un
          aviso.
        </p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={updateOwner.isPending}>
          {updateOwner.isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar
        </Button>
      </DialogFooter>
    </form>
  )
}
