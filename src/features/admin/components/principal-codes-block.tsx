'use client'
import Link from 'next/link'

import { useState, type FormEvent } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CodeGroup, NetworkTreeCode } from '@/types/api/hierarchy'
import { usePrincipalCodeActions } from '../hooks/use-hierarchy'
import { isHiddenCode, useShowHiddenCodes, visibleCodes } from '../hooks/use-hidden-codes'
import { apiErrorMessage } from '../lib/api-error-message'
import { CODE_HINT, isValidCode } from '../lib/producer-code'

const HEAD = 'text-[11px] uppercase tracking-[0.12em] text-faint'

export interface PrincipalCodesBlockProps {
  /** The principal whose codes these are. */
  principalId: number
  /** Its codes as `GET /hierarchy/tree` lists them (inactive ones too, each with the Admins who see it). */
  codes: NetworkTreeCode[]
  /** Its code groups (`GET /hierarchy/tree`); none = a flat list. */
  groups?: CodeGroup[]
  /** Shows only this code (the Productor filter); null = all. */
  onlyCodeId?: number | null
  /** The Developer moves the master mark; nobody else may. */
  canSetMaster?: boolean
}

/**
 * The productores of a principal (plan §6.2/§6.3): each code with its holder, whether it is active and the Admins who
 * see it ("sin usuario" if none), plus creating a code, editing its holder and switching it on or off. Everything goes
 * through the single code endpoint (`/hierarchy/principals/:id/codes`), so it works the same for the Developer, the
 * Owner and the SuperAdmin. Used by "Mi red" and by Usuarios' "Productores" tab.
 *
 * A principal with hundreds of codes (a zone's) orders them in groups (18/11/2026): one per Triunfo organizer to begin
 * with, then whatever the Owner makes of them. A code is dragged onto a group (or "Sin grupo"), or moved with its
 * "Grupo" selector; groups are created, renamed and deleted here.
 */
export function PrincipalCodesBlock({
  principalId,
  codes,
  groups = [],
  onlyCodeId = null,
  canSetMaster = false,
}: PrincipalCodesBlockProps) {
  const [showHidden] = useShowHiddenCodes()
  const [search, setSearch] = useState('')
  // Inactive and Triunfo-blocked codes only with the preference on (Configuración › Cuenta), or when filtered to one.
  const shown = onlyCodeId === null ? visibleCodes(codes, showHidden) : codes.filter(code => code.id === onlyCodeId)
  const hidden = onlyCodeId === null && !showHidden ? codes.filter(isHiddenCode).length : 0
  const term = search.trim().toLowerCase()
  const visible = term
    ? shown.filter(
        code => code.code.toLowerCase().includes(term) || (code.holderName ?? '').toLowerCase().includes(term),
      )
    : shown
  const grouped = onlyCodeId === null && (groups.length > 0 || codes.length > 20)

  return (
    <div className="flex flex-col gap-3">
      {grouped && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar código o titular"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar código o titular"
              className="h-9 w-64 pl-8 text-[13px]"
            />
          </div>
          <NewGroupForm principalId={principalId} />
        </div>
      )}
      {grouped ? (
        <div className="flex flex-col gap-2">
          {groups.map(group => (
            <GroupSection
              key={group.id}
              principalId={principalId}
              group={group}
              groups={groups}
              codes={visible.filter(code => code.groupId === group.id)}
              searching={term.length > 0}
              canSetMaster={canSetMaster}
            />
          ))}
          <GroupSection
            principalId={principalId}
            group={null}
            groups={groups}
            codes={visible.filter(code => !groups.some(group => group.id === code.groupId))}
            searching={term.length > 0}
            canSetMaster={canSetMaster}
            startOpen={groups.length === 0}
          />
        </div>
      ) : (
        <CodesTable
          principalId={principalId}
          codes={visible}
          groups={groups}
          canSetMaster={canSetMaster}
          empty={
            hidden > 0 ? 'Todos sus códigos están inactivos o bloqueados.' : 'Este principal todavía no tiene códigos.'
          }
        />
      )}
      {hidden > 0 && (
        <p className="text-[12.5px] text-muted-foreground">
          {hidden === 1 ? 'Hay 1 código inactivo o bloqueado' : `Hay ${hidden} códigos inactivos o bloqueados`} que no
          se muestran. Para verlos, activá «Mostrar códigos inactivos y bloqueados» en{' '}
          <Link href="/admin/configuracion" className="font-medium text-ember-2 underline-offset-2 hover:underline">
            Configuración › Cuenta
          </Link>
          .
        </p>
      )}
      {onlyCodeId === null && <NewCodeForm principalId={principalId} />}
    </div>
  )
}

/** The data a dragged code row carries. */
const DRAG_TYPE = 'application/x-polisend-code'

/** Moves a code to a group (null = "Sin grupo"), with its toast. */
function useMoveCode(principalId: number) {
  const { updateCode } = usePrincipalCodeActions()
  return (codeId: number, group: CodeGroup | null) =>
    updateCode.mutate(
      { principalId, codeId, data: { groupId: group?.id ?? null } },
      {
        onSuccess: moved =>
          toast.success(group ? `${moved.code} pasó a «${group.name}»` : `${moved.code} quedó sin grupo`),
        onError: error => toast.error(apiErrorMessage(error, 'No se pudo mover el código.')),
      },
    )
}

/** A group (or "Sin grupo") that opens and closes, takes dropped codes, and is renamed or deleted from its header. */
function GroupSection({
  principalId,
  group,
  groups,
  codes,
  searching,
  canSetMaster,
  startOpen = false,
}: {
  principalId: number
  group: CodeGroup | null
  groups: CodeGroup[]
  codes: NetworkTreeCode[]
  searching: boolean
  canSetMaster: boolean
  startOpen?: boolean
}) {
  const { renameGroup, removeGroup } = usePrincipalCodeActions()
  const move = useMoveCode(principalId)
  const [open, setOpen] = useState(startOpen)
  const [over, setOver] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(group?.name ?? '')
  // A search shows only the groups with matches, opened.
  if (searching && codes.length === 0) return null
  const expanded = open || searching
  const Chevron = expanded ? ChevronDown : ChevronRight

  const rename = (event: FormEvent) => {
    event.preventDefault()
    if (!group || !name.trim()) return
    renameGroup.mutate(
      { principalId, groupId: group.id, name: name.trim() },
      {
        onSuccess: () => {
          toast.success('Grupo renombrado')
          setRenaming(false)
        },
        onError: error => toast.error(apiErrorMessage(error, 'No se pudo renombrar el grupo.')),
      },
    )
  }

  const remove = () => {
    if (!group) return
    if (!window.confirm(`¿Borrar el grupo «${group.name}»? Sus ${codes.length} códigos quedan sin grupo.`)) return
    removeGroup.mutate(
      { principalId, groupId: group.id },
      {
        onSuccess: () => toast.success('Grupo borrado: sus códigos quedaron sin grupo'),
        onError: error => toast.error(apiErrorMessage(error, 'No se pudo borrar el grupo.')),
      },
    )
  }

  return (
    <div
      className={`rounded-lg border transition-colors ${over ? 'border-ember-ring bg-ember-soft' : 'border-line-2'}`}
      onDragOver={event => {
        if (!event.dataTransfer.types.includes(DRAG_TYPE)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={event => {
        setOver(false)
        const codeId = Number(event.dataTransfer.getData(DRAG_TYPE))
        if (!codeId) return
        event.preventDefault()
        move(codeId, group)
      }}
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          aria-expanded={expanded}
        >
          <Chevron className="size-4 shrink-0 text-muted-foreground" />
          {group ? (
            <FolderOpen className="size-4 shrink-0 text-ember-2" />
          ) : (
            <Folder className="size-4 shrink-0 text-muted-foreground" />
          )}
          {renaming ? null : (
            <span className="truncate text-[13.5px] font-medium text-ink">{group ? group.name : 'Sin grupo'}</span>
          )}
          {!renaming && (
            <span className="shrink-0 text-[12px] text-muted-foreground">
              {codes.length === 1 ? '1 código' : `${codes.length} códigos`}
              {group?.organizerCode ? ` · organizador ${group.organizerCode}` : ''}
            </span>
          )}
        </button>
        {renaming && group && (
          <form onSubmit={rename} className="flex items-center gap-1">
            <Input
              aria-label="Nombre del grupo"
              value={name}
              maxLength={120}
              onChange={event => setName(event.target.value)}
              className="h-8 w-64 text-[13px]"
              autoFocus
            />
            <Button type="submit" size="icon" variant="ghost" className="size-8" disabled={renameGroup.isPending}>
              <Check className="size-4" />
              <span className="sr-only">Guardar nombre</span>
            </Button>
            <Button type="button" size="icon" variant="ghost" className="size-8" onClick={() => setRenaming(false)}>
              <X className="size-4" />
              <span className="sr-only">Cancelar</span>
            </Button>
          </form>
        )}
        {group && !renaming && (
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => {
                setName(group.name)
                setRenaming(true)
              }}
            >
              <Pencil className="size-3.5" />
              <span className="sr-only">Renombrar grupo</span>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={remove}
              disabled={removeGroup.isPending}
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only">Borrar grupo</span>
            </Button>
          </div>
        )}
      </div>
      {expanded && (
        <div className="border-t border-line-2">
          <CodesTable
            principalId={principalId}
            codes={codes}
            groups={groups}
            canSetMaster={canSetMaster}
            bare
            empty={group ? 'Arrastrá códigos hasta acá para sumarlos al grupo.' : 'Todos los códigos tienen grupo.'}
          />
        </div>
      )}
    </div>
  )
}

/** The codes as a table: the flat list of a small principal, or the inside of a group. */
function CodesTable({
  principalId,
  codes,
  groups,
  canSetMaster,
  empty,
  bare = false,
}: {
  principalId: number
  codes: NetworkTreeCode[]
  groups: CodeGroup[]
  canSetMaster: boolean
  empty: string
  bare?: boolean
}) {
  return (
    <div className={bare ? 'overflow-x-auto' : 'overflow-x-auto rounded-lg border border-line-2'}>
      <Table className="min-w-[620px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`pl-4 ${HEAD}`}>Código</TableHead>
            <TableHead className={HEAD}>Titular</TableHead>
            <TableHead className={HEAD}>Lo ven</TableHead>
            <TableHead className="w-0 pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map(code => (
            <CodeRow key={code.id} principalId={principalId} code={code} groups={groups} canSetMaster={canSetMaster} />
          ))}
          {codes.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-5 text-center text-[13px] text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

/** A new, empty group: codes are dragged into it afterwards. */
function NewGroupForm({ principalId }: { principalId: number }) {
  const { createGroup } = usePrincipalCodeActions()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    createGroup.mutate(
      { principalId, name: name.trim() },
      {
        onSuccess: created => {
          toast.success(`Grupo «${created.name}» creado: arrastrá códigos hasta él`)
          setName('')
          setAdding(false)
        },
        onError: error => toast.error(apiErrorMessage(error, 'No se pudo crear el grupo.')),
      },
    )
  }

  if (!adding) {
    return (
      <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setAdding(true)}>
        <FolderPlus className="size-4" />
        Nuevo grupo
      </Button>
    )
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-1">
      <Input
        aria-label="Nombre del grupo nuevo"
        value={name}
        maxLength={120}
        onChange={event => setName(event.target.value)}
        placeholder="Nombre del grupo"
        className="h-9 w-56 text-[13px]"
        autoFocus
      />
      <Button type="submit" size="sm" className="h-9" disabled={createGroup.isPending || !name.trim()}>
        {createGroup.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Crear'}
      </Button>
      <Button type="button" size="icon" variant="ghost" className="size-9" onClick={() => setAdding(false)}>
        <X className="size-4" />
        <span className="sr-only">Cancelar</span>
      </Button>
    </form>
  )
}

function CodeRow({
  principalId,
  code,
  groups,
  canSetMaster,
}: {
  principalId: number
  code: NetworkTreeCode
  groups: CodeGroup[]
  canSetMaster: boolean
}) {
  const { updateCode } = usePrincipalCodeActions()
  const move = useMoveCode(principalId)
  const [editing, setEditing] = useState(false)
  const [holder, setHolder] = useState(code.holderName ?? '')

  const save = (data: { holderName?: string; isActive?: boolean; isMaster?: true }, done: string) =>
    updateCode.mutate(
      { principalId, codeId: code.id, data },
      {
        onSuccess: () => {
          toast.success(done)
          setEditing(false)
        },
        onError: error => toast.error(apiErrorMessage(error, 'No se pudo actualizar el código.')),
      },
    )

  const saveHolder = (event: FormEvent) => {
    event.preventDefault()
    save({ holderName: holder.trim() }, 'Titular actualizado')
  }

  return (
    <TableRow
      className={`${code.isActive ? '' : 'opacity-70'} ${groups.length > 0 ? 'cursor-grab active:cursor-grabbing' : ''}`}
      draggable={groups.length > 0}
      onDragStart={event => {
        event.dataTransfer.setData(DRAG_TYPE, String(code.id))
        event.dataTransfer.effectAllowed = 'move'
      }}
    >
      <TableCell className="pl-4 align-top">
        <div className="flex flex-wrap items-center gap-1.5">
          {groups.length > 0 && <GripVertical className="size-3.5 shrink-0 text-muted-foreground" />}
          <span className="font-mono text-[13px] font-medium text-ink">{code.code}</span>
          {code.isMaster && (
            <Badge variant="secondary" className="text-[10px]">
              master
            </Badge>
          )}
          {!code.isActive && (
            <Badge variant="outline" className="border-line-2 text-[10px] text-muted-foreground">
              inactivo
            </Badge>
          )}
          {code.triunfoBlocked && (
            <Badge variant="outline" className="border-line-2 text-[10px] text-muted-foreground">
              bloqueado en Triunfo
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="align-top">
        {editing ? (
          <form onSubmit={saveHolder} className="flex items-center gap-1">
            <Input
              aria-label={`Titular del código ${code.code}`}
              value={holder}
              maxLength={120}
              onChange={event => setHolder(event.target.value)}
              className="h-8 w-56 text-[13px]"
              autoFocus
              onFocus={event => event.target.select()}
            />
            <Button type="submit" size="icon" variant="ghost" className="size-8" disabled={updateCode.isPending}>
              {updateCode.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              <span className="sr-only">Guardar titular</span>
            </Button>
            <Button type="button" size="icon" variant="ghost" className="size-8" onClick={() => setEditing(false)}>
              <X className="size-4" />
              <span className="sr-only">Cancelar</span>
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setHolder(code.holderName ?? '')
              setEditing(true)
            }}
            className="group flex items-center gap-1.5 text-left text-[13px] text-ink-3 hover:text-ink"
          >
            {code.holderName ?? <span className="text-muted-foreground">Sin titular</span>}
            <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            <span className="sr-only">Editar titular</span>
          </button>
        )}
      </TableCell>
      <TableCell className="align-top text-[12.5px]">
        {code.admins.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {code.admins.map(admin => (
              <Badge key={admin.id} variant="outline" className="border-line-2 font-normal text-ink-3">
                {admin.name ?? `Usuario ${admin.id}`}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">sin usuario</span>
        )}
      </TableCell>
      <TableCell className="pr-4 text-right align-top">
        <div className="flex items-center justify-end gap-1">
          {groups.length > 0 && (
            <select
              aria-label={`Grupo del código ${code.code}`}
              value={code.groupId ?? ''}
              onChange={event => {
                const id = event.target.value ? Number(event.target.value) : null
                move(code.id, groups.find(group => group.id === id) ?? null)
              }}
              className="h-7 max-w-40 rounded-md border border-line-2 bg-background px-1.5 text-[12px] text-ink-3"
            >
              <option value="">Sin grupo</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
          {canSetMaster && !code.isMaster && code.isActive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px]"
              disabled={updateCode.isPending}
              onClick={() => save({ isMaster: true }, `${code.code} es ahora el código master`)}
            >
              Marcar master
            </Button>
          )}
          {!code.isMaster && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px]"
              disabled={updateCode.isPending}
              onClick={() =>
                save({ isActive: !code.isActive }, code.isActive ? 'Código desactivado' : 'Código activado')
              }
            >
              {code.isActive ? 'Desactivar' : 'Activar'}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function NewCodeForm({ principalId }: { principalId: number }) {
  const { createCode } = usePrincipalCodeActions()
  const [code, setCode] = useState('')
  const [holder, setHolder] = useState('')
  const trimmed = code.trim()
  const invalid = trimmed.length > 0 && !isValidCode(trimmed)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!trimmed || invalid) return
    createCode.mutate(
      { principalId, data: { code: trimmed, ...(holder.trim() ? { holderName: holder.trim() } : {}) } },
      {
        onSuccess: created => {
          toast.success(`Código ${created.code} agregado`)
          setCode('')
          setHolder('')
        },
        onError: error => toast.error(apiErrorMessage(error, 'No se pudo agregar el código.')),
      },
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Código nuevo"
          value={code}
          maxLength={20}
          onChange={event => setCode(event.target.value)}
          placeholder="Código"
          className="h-9 w-32 font-mono"
        />
        <Input
          aria-label="Titular del código nuevo"
          value={holder}
          maxLength={120}
          onChange={event => setHolder(event.target.value)}
          placeholder="Titular (opcional)"
          className="h-9 min-w-0 flex-1 sm:max-w-xs"
        />
        <Button type="submit" variant="outline" size="sm" className="h-9" disabled={!trimmed || createCode.isPending}>
          {createCode.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Agregar código
        </Button>
      </div>
      {invalid && <p className="text-[12px] text-destructive">{CODE_HINT}</p>}
    </form>
  )
}
