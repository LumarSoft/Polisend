'use client'

import { useState, type FormEvent } from 'react'
import { Ellipsis, Loader2, Plus, Power, SquarePen } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { NetworkTreeCode, NetworkTreePrincipal } from '@/types/api/hierarchy'
import { usePrincipalCodeActions } from '../hooks/use-hierarchy'
import { networkErrorMessage } from '../lib/network-user-errors'
import { isValidProducerCode, PRODUCER_CODE_HINT } from '../lib/network-users'

const HEAD = 'text-[11px] uppercase tracking-[0.12em] text-muted-foreground'

/** Creating a code, or editing a code's holder. */
function CodeDialog({
  principalId,
  code,
  open,
  onOpenChange,
}: {
  principalId: number
  /** Null = a new code. */
  code: NetworkTreeCode | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { createCode, updateCode } = usePrincipalCodeActions()
  const [value, setValue] = useState(code?.code ?? '')
  const [holderName, setHolderName] = useState(code?.holderName ?? '')
  const [error, setError] = useState<string | null>(null)
  const pending = createCode.isPending || updateCode.isPending

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const onError = (err: unknown) => setError(networkErrorMessage(err, 'No se pudo guardar el código.'))
    if (code) {
      updateCode.mutate(
        { principalId, codeId: code.id, data: { holderName: holderName.trim() } },
        {
          onSuccess: () => {
            toast.success(`Código ${code.code} actualizado`)
            onOpenChange(false)
          },
          onError,
        },
      )
      return
    }
    if (!isValidProducerCode(value)) {
      setError(`El código no es válido. ${PRODUCER_CODE_HINT}`)
      return
    }
    createCode.mutate(
      { principalId, data: { code: value.trim(), ...(holderName.trim() ? { holderName: holderName.trim() } : {}) } },
      {
        onSuccess: created => {
          toast.success(`Código ${created.code} creado`, {
            description: 'Ya lo podés asignar a un Admin desde Usuarios.',
          })
          onOpenChange(false)
        },
        onError,
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">
            {code ? `Código ${code.code}` : 'Nuevo código de productor'}
          </DialogTitle>
          <DialogDescription>
            {code
              ? 'El titular es como figura el productor en Triunfo.'
              : 'Un código de Triunfo con su titular. Su cartera, sus números y sus Admin quedan atados a ese código.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {!code && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="principal-code-value">Código</Label>
              <Input
                id="principal-code-value"
                required
                maxLength={20}
                placeholder="14831"
                className="h-10"
                value={value}
                onChange={e => setValue(e.target.value)}
              />
              <p className="text-[12px] text-muted-foreground">{PRODUCER_CODE_HINT}</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="principal-code-holder">Titular</Label>
            <Input
              id="principal-code-holder"
              maxLength={120}
              placeholder="Como figura en Triunfo"
              className="h-10"
              value={holderName}
              onChange={e => setHolderName(e.target.value)}
            />
          </div>
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {code ? 'Guardar' : 'Crear código'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * The productores (producer codes) of one principal: code, holder, which Admins see it, active or not; create a code,
 * edit its holder, turn it on or off. The SuperAdmin's "Productores" tab in Usuarios. (Mi red, built in parallel, has
 * its own block; the integrator may make both share one.)
 */
export function PrincipalCodesBlock({
  principal,
  isLoading,
}: {
  principal: NetworkTreePrincipal | null
  isLoading: boolean
}) {
  const { updateCode } = usePrincipalCodeActions()
  const [dialog, setDialog] = useState<{ code: NetworkTreeCode | null } | null>(null)

  const toggleActive = (code: NetworkTreeCode) => {
    if (!principal) return
    updateCode.mutate(
      { principalId: principal.id, codeId: code.id, data: { isActive: !code.isActive } },
      {
        onSuccess: () => toast.success(`Código ${code.code} ${code.isActive ? 'desactivado' : 'activado'}`),
        onError: error => toast.error(networkErrorMessage(error, 'No se pudo cambiar el código.')),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-xl text-[13.5px] text-muted-foreground">
          Los códigos de Triunfo de {principal?.name ?? 'tu principal'}. Los SuperAdmin ven todos; cada Admin ve los que
          le marques en Usuarios.
        </p>
        <Button onClick={() => setDialog({ code: null })} className="h-10" disabled={!principal}>
          <Plus className="size-4" />
          Nuevo código
        </Button>
      </div>

      <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={`h-11 pl-5 ${HEAD}`}>Código</TableHead>
              <TableHead className={HEAD}>Titular</TableHead>
              <TableHead className={`hidden md:table-cell ${HEAD}`}>Lo ven</TableHead>
              <TableHead className={HEAD}>Estado</TableHead>
              <TableHead className="w-12 pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j} className={j === 0 ? 'pl-5' : undefined}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {principal?.codes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-[14px] text-muted-foreground">
                  Todavía no hay códigos.
                </TableCell>
              </TableRow>
            )}
            {principal?.codes.map(code => (
              <TableRow key={code.id}>
                <TableCell className="py-3 pl-5">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-ink">{code.code}</span>
                    {code.isMaster && (
                      <Badge variant="secondary" className="font-normal text-ink-3">
                        master
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-ink-3">{code.holderName ?? '—'}</TableCell>
                <TableCell className="hidden text-[12.5px] md:table-cell">
                  {code.admins.length === 0 ? (
                    <span className="text-muted-foreground">Sin usuario (solo los SuperAdmin)</span>
                  ) : (
                    <span className="text-ink-3">{code.admins.map(admin => admin.name ?? 'Admin').join(', ')}</span>
                  )}
                </TableCell>
                <TableCell>
                  {code.isActive ? (
                    <span className="text-[12.5px] text-emerald-700 dark:text-emerald-400">Activo</span>
                  ) : (
                    <span className="text-[12.5px] text-muted-foreground">Inactivo</span>
                  )}
                </TableCell>
                <TableCell className="pr-5">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                          <Ellipsis className="size-4" />
                          <span className="sr-only">Acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setDialog({ code })}>
                          <SquarePen />
                          Editar titular
                        </DropdownMenuItem>
                        {!code.isMaster && (
                          <DropdownMenuItem onClick={() => toggleActive(code)} disabled={updateCode.isPending}>
                            <Power />
                            {code.isActive ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {principal && dialog && (
        <CodeDialog
          key={dialog.code?.id ?? 'new'}
          principalId={principal.id}
          code={dialog.code}
          open
          onOpenChange={open => !open && setDialog(null)}
        />
      )}
    </div>
  )
}
