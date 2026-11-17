'use client'

import { useState, type FormEvent } from 'react'
import { Check, Loader2, Pencil, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { NetworkTreeCode } from '@/types/api/hierarchy'
import { usePrincipalCodeActions } from '../hooks/use-hierarchy'
import { apiErrorMessage } from '../lib/api-error-message'
import { CODE_HINT, isValidCode } from '../lib/producer-code'

const HEAD = 'text-[11px] uppercase tracking-[0.12em] text-faint'

export interface PrincipalCodesBlockProps {
  /** The principal whose codes these are. */
  principalId: number
  /** Its codes as `GET /hierarchy/tree` lists them (inactive ones too, each with the Admins who see it). */
  codes: NetworkTreeCode[]
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
 */
export function PrincipalCodesBlock({
  principalId,
  codes,
  onlyCodeId = null,
  canSetMaster = false,
}: PrincipalCodesBlockProps) {
  const visible = onlyCodeId === null ? codes : codes.filter(code => code.id === onlyCodeId)
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-line-2">
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
            {visible.map(code => (
              <CodeRow key={code.id} principalId={principalId} code={code} canSetMaster={canSetMaster} />
            ))}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-5 text-center text-[13px] text-muted-foreground">
                  Este principal todavía no tiene códigos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {onlyCodeId === null && <NewCodeForm principalId={principalId} />}
    </div>
  )
}

function CodeRow({
  principalId,
  code,
  canSetMaster,
}: {
  principalId: number
  code: NetworkTreeCode
  canSetMaster: boolean
}) {
  const { updateCode } = usePrincipalCodeActions()
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
    <TableRow className={code.isActive ? undefined : 'opacity-70'}>
      <TableCell className="pl-4 align-top">
        <div className="flex flex-wrap items-center gap-1.5">
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
        <div className="flex justify-end gap-1">
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
