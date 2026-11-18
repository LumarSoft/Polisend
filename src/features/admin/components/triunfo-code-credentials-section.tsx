'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, KeyRound, Loader2, PlugZap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import type { CodeTriunfoCredentialStatus } from '@/types/api/triunfo'
import {
  useRemoveCodeTriunfoCredential,
  useSaveCodeTriunfoCredential,
  useTriunfoCodeCredentials,
} from '../hooks/use-triunfo-access'
import { md5Hex } from '../lib/md5'
import { TriunfoPasswordNote } from './triunfo-credential-form'

const errorMessage = (error: Error) =>
  error instanceof ApiError ? error.message : 'No se pudo guardar. Intentá de nuevo.'

/**
 * Each productor code's own TriunfoNet user: its token quotes from the numbers the code is responsible for and
 * downloads the documents of its policies. A code without one uses its principal's access. The SuperAdmin (and an
 * Owner in the principal) sees every code; an Admin only its own.
 */
export function TriunfoCodeCredentialsSection({ manager }: { manager: boolean }) {
  const { data: codes, isLoading, isError } = useTriunfoCodeCredentials(true)
  const [editing, setEditing] = useState<CodeTriunfoCredentialStatus | null>(null)

  return (
    <Card className="max-w-3xl border-line-2 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-[18px]">Usuario de TriunfoNet por productor</CardTitle>
        <CardDescription>
          {manager
            ? 'Cada productor puede cargar su propio usuario de TriunfoNet en su código. Con él se cotiza desde los números de los que es responsable y se bajan los documentos de sus pólizas. Un código sin usuario propio usa el acceso del principal.'
            : 'Cargá tu usuario de TriunfoNet en tu código: con él se cotiza desde tu número y se bajan los documentos de tus pólizas. Sin usuario propio se usa el acceso del principal.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-24" />}
        {isError && <p className="text-[14px] text-destructive">No se pudieron cargar los códigos.</p>}
        {codes && codes.length === 0 && (
          <p className="text-[13px] text-muted-foreground">No tenés códigos de productor asignados.</p>
        )}
        {codes && codes.length > 0 && (
          <ul className="divide-y divide-line-2 rounded-lg border border-line-2">
            {codes.map(code => (
              <li key={code.producerCodeId} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5">
                <div className="min-w-[160px] flex-1">
                  <div className="text-[13.5px] font-medium text-ink">
                    {code.code}
                    {!code.isActive && <span className="ml-2 text-[11px] text-muted-foreground">(inactivo)</span>}
                  </div>
                  {code.holderName && <div className="text-[12px] text-muted-foreground">{code.holderName}</div>}
                </div>
                <CodeStatus code={code} />
                <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setEditing(code)}>
                  <KeyRound className="size-3.5" />
                  {code.configured ? 'Cambiar' : 'Cargar'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={editing !== null} onOpenChange={open => !open && setEditing(null)}>
        {editing && (
          <CodeCredentialDialog key={editing.producerCodeId} code={editing} onDone={() => setEditing(null)} />
        )}
      </Dialog>
    </Card>
  )
}

function CodeStatus({ code }: { code: CodeTriunfoCredentialStatus }) {
  if (!code.configured) {
    return <span className="text-[12.5px] text-muted-foreground">Usa el acceso del principal</span>
  }
  const when = code.verifiedAt ? new Date(code.verifiedAt).toLocaleDateString('es-AR') : null
  return (
    <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
      Usuario {code.username}
      {when ? ` · validado el ${when}` : ''}
    </span>
  )
}

/** Loads or replaces one code's user; Triunfo is asked for a token with the code itself before saving it. */
function CodeCredentialDialog({ code, onDone }: { code: CodeTriunfoCredentialStatus; onDone: () => void }) {
  const save = useSaveCodeTriunfoCredential()
  const remove = useRemoveCodeTriunfoCredential()
  const [username, setUsername] = useState(code.username ?? '')
  const [password, setPassword] = useState('')
  const busy = save.isPending || remove.isPending

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate(
      { producerCodeId: code.producerCodeId, data: { username: username.trim(), password: md5Hex(password) } },
      {
        onSuccess: () => {
          toast.success(`Triunfo aceptó el usuario del productor ${code.code}`)
          onDone()
        },
        onError: error => toast.error(errorMessage(error)),
      },
    )
  }

  const removeIt = () =>
    remove.mutate(code.producerCodeId, {
      onSuccess: () => {
        toast.success(`El productor ${code.code} vuelve a usar el acceso del principal`)
        onDone()
      },
      onError: error => toast.error(errorMessage(error)),
    })

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Usuario de TriunfoNet del productor {code.code}</DialogTitle>
        <DialogDescription>
          {code.holderName ? `${code.holderName}. ` : ''}Se valida pidiéndole a Triunfo un permiso con este código.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="code-triunfo-usuario" className="text-[11px]">
            Usuario de TriunfoNet
          </Label>
          <Input
            id="code-triunfo-usuario"
            required
            autoComplete="off"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="code-triunfo-password" className="text-[11px]">
            Contraseña de TriunfoNet
          </Label>
          <Input
            id="code-triunfo-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="h-9"
          />
        </div>
        <TriunfoPasswordNote>
          Son el usuario y la contraseña con los que este productor entra a TriunfoNet: escribila tal cual, sin
          convertirla.
        </TriunfoPasswordNote>
        <div className="flex flex-wrap justify-end gap-2">
          {code.configured && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={removeIt}>
              Quitar y usar el del principal
            </Button>
          )}
          <Button type="submit" size="sm" disabled={busy}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
            {code.configured ? 'Reemplazar y validar' : 'Validar y guardar'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
