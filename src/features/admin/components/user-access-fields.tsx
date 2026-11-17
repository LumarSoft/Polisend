'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Building2, Check, Loader2, Plus, Search, ShieldCheck, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { NetworkUserRole, Zone } from '@/types/api/hierarchy'
import type { CodeOption, NewPrincipalDraft } from '../hooks/use-network-user-form'
import { newCodeRow } from '../hooks/use-network-user-form'
import { isValidProducerCode, PRODUCER_CODE_HINT, type FormPrincipal } from '../lib/network-users'
import { ROLES } from '../lib/roles'

/** The pieces of the user form that say what an account reaches: its role, its principal and its codes (plan §6.3). */

const ROLE_CARDS: Array<{ role: NetworkUserRole; title: string; text: string; icon: typeof ShieldCheck }> = [
  {
    role: ROLES.superAdmin,
    title: 'SuperAdmin',
    text: 'Administra un principal, ve todos sus códigos y sus usuarios.',
    icon: ShieldCheck,
  },
  {
    role: ROLES.admin,
    title: 'Admin',
    text: 'Opera uno o más productores, ve solo los códigos que le asignes.',
    icon: UserRound,
  },
]

export function RoleCards({
  value,
  onChange,
  disabledNote,
}: {
  value: NetworkUserRole
  onChange: (role: NetworkUserRole) => void
  /** Set when the role cannot change (one's own): the reason, shown under the cards. */
  disabledNote?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label="Rol" className="grid gap-2 sm:grid-cols-2">
        {ROLE_CARDS.map(card => {
          const selected = value === card.role
          const Icon = card.icon
          return (
            <button
              key={card.role}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!!disabledNote}
              onClick={() => onChange(card.role)}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                selected ? 'border-ember-2 bg-ember-soft' : 'border-line-2 hover:bg-secondary/60',
              )}
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', selected ? 'text-ember-2' : 'text-muted-foreground')} />
              <span className="flex flex-col gap-0.5">
                <span className="text-[14px] font-medium text-ink">{card.title}</span>
                <span className="text-[12px] leading-snug text-muted-foreground">{card.text}</span>
              </span>
            </button>
          )
        })}
      </div>
      {disabledNote && <p className="text-[12px] text-muted-foreground">{disabledNote}</p>}
    </div>
  )
}

function principalOption(principal: FormPrincipal): ComboboxOption {
  const hint = [
    principal.zoneName,
    principal.isHome ? 'Tu principal' : null,
    principal.accounts === 0 ? 'Sin usuarios' : null,
    principal.isActive ? null : 'Inactivo',
  ]
    .filter(Boolean)
    .join(' · ')
  return { value: String(principal.id), label: principal.name, hint: hint || undefined }
}

export function PrincipalPicker({
  principals,
  value,
  onChange,
  label = 'Principal',
}: {
  principals: FormPrincipal[]
  value: number | null
  onChange: (id: number) => void
  label?: string
}) {
  return (
    <Combobox
      label={label}
      placeholder="Elegí un principal"
      searchPlaceholder="Buscar principal…"
      emptyText="No hay principales"
      value={value === null ? null : String(value)}
      options={principals.map(principalOption)}
      onChange={raw => onChange(Number(raw))}
      className="w-full"
    />
  )
}

/** A principal that cannot change (a SuperAdmin's own, or an existing user's). */
export function FixedPrincipal({ principal, note }: { principal: FormPrincipal | null; note?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line-2 bg-secondary/40 px-3 py-2.5">
      <Building2 className="size-4 text-muted-foreground" />
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-medium text-ink">{principal?.name ?? '…'}</div>
        {(principal?.zoneName || note) && (
          <div className="text-[11.5px] text-muted-foreground">
            {[principal?.zoneName, note].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    </div>
  )
}

export function PrincipalModeSwitch({
  value,
  onChange,
}: {
  value: 'existing' | 'new'
  onChange: (value: 'existing' | 'new') => void
}) {
  const option = (mode: 'existing' | 'new', label: ReactNode) => (
    <button
      type="button"
      role="radio"
      aria-checked={value === mode}
      onClick={() => onChange(mode)}
      className={cn(
        'h-9 rounded-md px-3 text-[13px] font-medium transition-colors',
        value === mode ? 'bg-background text-ink shadow-sm' : 'text-muted-foreground hover:text-ink',
      )}
    >
      {label}
    </button>
  )
  return (
    <div role="radiogroup" aria-label="Principal" className="inline-flex w-fit rounded-lg bg-secondary p-1">
      {option('existing', 'Principal existente')}
      {option(
        'new',
        <span className="inline-flex items-center gap-1">
          <Plus className="size-3.5" /> Nuevo principal
        </span>,
      )}
    </div>
  )
}

const NO_ZONE_VALUE = 'none'

/** "+ Nuevo principal": zona, nombre, código master y códigos con titular (POST /hierarchy/users `newPrincipal`). */
export function NewPrincipalFields({
  draft,
  onChange,
  zones,
  zoneRequired,
}: {
  draft: NewPrincipalDraft
  onChange: (draft: NewPrincipalDraft) => void
  zones: Zone[]
  /** The Owner puts it in one of its zones; the Developer may leave it out of every zone. */
  zoneRequired: boolean
}) {
  const zoneOptions: ComboboxOption[] = [
    ...(zoneRequired ? [] : [{ value: NO_ZONE_VALUE, label: 'Sin zona' }]),
    ...zones.map(zone => ({ value: String(zone.id), label: zone.name, hint: zone.code ?? undefined })),
  ]
  const setRow = (key: string, changes: Partial<{ code: string; holderName: string }>) =>
    onChange({ ...draft, codes: draft.codes.map(row => (row.key === key ? { ...row, ...changes } : row)) })
  const masterInvalid = draft.masterCode.trim() !== '' && !isValidProducerCode(draft.masterCode)

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line-2 p-4">
      {zoneRequired && zones.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Todavía no tenés zonas: creá una en Mi red antes de dar de alta un principal.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <Combobox
            label="Zona"
            placeholder={zoneRequired ? 'Elegí una zona' : 'Sin zona'}
            value={draft.zoneId === null ? (zoneRequired ? null : NO_ZONE_VALUE) : String(draft.zoneId)}
            options={zoneOptions}
            onChange={raw => onChange({ ...draft, zoneId: raw === NO_ZONE_VALUE ? null : Number(raw) })}
            className="w-full"
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-principal-name">Nombre del principal</Label>
          <Input
            id="new-principal-name"
            maxLength={120}
            placeholder="Broker del Litoral S.R.L."
            className="h-10"
            value={draft.name}
            onChange={e => onChange({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-principal-master">Código master</Label>
          <Input
            id="new-principal-master"
            maxLength={20}
            placeholder="11425"
            aria-invalid={masterInvalid}
            className="h-10"
            value={draft.masterCode}
            onChange={e => onChange({ ...draft, masterCode: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>
          Productores <span className="text-muted-foreground">(otros códigos, con su titular)</span>
        </Label>
        {draft.codes.map(row => (
          <div key={row.key} className="flex gap-2">
            <Input
              aria-label="Código"
              maxLength={20}
              placeholder="14831"
              aria-invalid={row.code.trim() !== '' && !isValidProducerCode(row.code)}
              className="h-9 w-32"
              value={row.code}
              onChange={e => setRow(row.key, { code: e.target.value })}
            />
            <Input
              aria-label="Titular"
              maxLength={120}
              placeholder="Titular (como figura en Triunfo)"
              className="h-9 flex-1"
              value={row.holderName}
              onChange={e => setRow(row.key, { holderName: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground"
              aria-label="Quitar código"
              onClick={() => onChange({ ...draft, codes: draft.codes.filter(r => r.key !== row.key) })}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-9 w-fit border-line-2"
          onClick={() => onChange({ ...draft, codes: [...draft.codes, newCodeRow()] })}
        >
          <Plus className="size-4" />
          Agregar código
        </Button>
        <p className="text-[12px] text-muted-foreground">
          {PRODUCER_CODE_HINT} El master queda a nombre del principal.
        </p>
      </div>
    </div>
  )
}

function CodeChip({ code, holderName, muted = false }: { code: string; holderName?: string | null; muted?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px]',
        muted ? 'border-line-2 text-muted-foreground' : 'border-line-2 bg-secondary/60 text-ink-3',
      )}
    >
      <span className="font-medium">{code}</span>
      {holderName && <span className="text-muted-foreground">· {holderName}</span>}
    </span>
  )
}

/** What a SuperAdmin will see: every active code of its principal, read only. */
export function PrincipalCodesPreview({
  codes,
  editCodes,
}: {
  codes: Array<{ code: string; holderName?: string | null }>
  /** "Editar códigos del principal": a link or an action, where the caller may do it. */
  editCodes?: { href: string } | { onClick: () => void }
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line-2 bg-secondary/30 p-3.5">
      <div className="text-[12.5px] font-medium text-ink">Códigos que va a ver</div>
      {codes.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">Todavía no tiene códigos.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {codes.map(code => (
            <CodeChip key={code.code} code={code.code} holderName={code.holderName} />
          ))}
        </div>
      )}
      <p className="text-[12px] text-muted-foreground">
        Son los códigos del principal: los ven todos sus SuperAdmin.
        {editCodes && ' '}
        {editCodes &&
          ('href' in editCodes ? (
            <Link href={editCodes.href} className="font-medium text-ember-2 hover:underline">
              Editar códigos del principal
            </Link>
          ) : (
            <button type="button" onClick={editCodes.onClick} className="font-medium text-ember-2 hover:underline">
              Editar códigos del principal
            </button>
          ))}
      </p>
    </div>
  )
}

/** "Códigos que ve": the Admin's codes, with a search box and "+ Crear código" (single code endpoint, left checked). */
export function CodesPicker({
  options,
  selected,
  onToggle,
  onCreate,
  creating,
  canCreate,
}: {
  options: CodeOption[]
  selected: number[]
  onToggle: (id: number) => void
  /** Resolves to an error message, or null when the code was created (and checked). */
  onCreate: (code: string, holderName: string) => Promise<string | null>
  creating: boolean
  canCreate: boolean
}) {
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [code, setCode] = useState('')
  const [holderName, setHolderName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const needle = query.trim().toLowerCase()
  const visible = needle
    ? options.filter(option => `${option.code} ${option.holderName ?? ''}`.toLowerCase().includes(needle))
    : options

  const create = async () => {
    if (!isValidProducerCode(code)) {
      setCreateError(`El código no es válido. ${PRODUCER_CODE_HINT}`)
      return
    }
    const error = await onCreate(code, holderName)
    setCreateError(error)
    if (!error) {
      setCode('')
      setHolderName('')
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {options.length > 6 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar código o titular…"
            className="h-9 pl-9 text-[13px]"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      )}
      <div className="max-h-52 overflow-y-auto rounded-md border border-line-2 p-1.5">
        {options.length === 0 && (
          <p className="px-1.5 py-2 text-[13px] text-muted-foreground">Este principal todavía no tiene códigos.</p>
        )}
        {options.length > 0 && visible.length === 0 && (
          <p className="px-1.5 py-2 text-[13px] text-muted-foreground">Ningún código coincide.</p>
        )}
        {visible.map(option => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1.5 hover:bg-secondary"
          >
            <input
              type="checkbox"
              className="size-4 accent-ember-2"
              checked={selected.includes(option.id)}
              onChange={() => onToggle(option.id)}
            />
            <span className="text-[13px] text-ink">
              <span className="font-medium">{option.code}</span>
              {option.holderName && <span className="text-muted-foreground"> · {option.holderName}</span>}
              {option.isMaster && <span className="text-muted-foreground"> · master</span>}
              {!option.isActive && <span className="text-amber-700 dark:text-amber"> · inactivo</span>}
            </span>
          </label>
        ))}
      </div>

      {canCreate &&
        (adding ? (
          <div className="flex flex-col gap-2 rounded-md border border-dashed border-line-2 p-2.5">
            <div className="flex flex-wrap gap-2">
              <Input
                aria-label="Código nuevo"
                autoFocus
                maxLength={20}
                placeholder="Código"
                className="h-9 w-32"
                value={code}
                onChange={e => setCode(e.target.value)}
              />
              <Input
                aria-label="Titular del código nuevo"
                maxLength={120}
                placeholder="Titular (como figura en Triunfo)"
                className="h-9 min-w-40 flex-1"
                value={holderName}
                onChange={e => setHolderName(e.target.value)}
              />
            </div>
            {createError && <p className="text-[12px] text-destructive">{createError}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-8"
                onClick={() => {
                  setAdding(false)
                  setCreateError(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="button" className="h-8" disabled={creating || !code.trim()} onClick={() => void create()}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Crear y marcar
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" className="h-9 w-fit border-line-2" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Crear código
          </Button>
        ))}
    </div>
  )
}
