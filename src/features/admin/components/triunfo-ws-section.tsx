'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, PlugZap, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import type { TriunfoWsCredentialStatus } from '@/types/api/triunfo'
import { useSaveTriunfoWsCredential, useTriunfoWsCredential } from '../hooks/use-triunfo-access'
import { md5Hex } from '../lib/md5'
import { TriunfoPasswordNote } from './triunfo-credential-form'

/**
 * The Owner's Triunfo web-service user ("WS…"), for the whole network: it reads the novedades of every zone. It
 * cannot get a token, so quoting and documents stay with each principal's and each productor's TriunfoNet user.
 */
export function TriunfoWsSection() {
  const { data: status, isLoading, isError } = useTriunfoWsCredential(true)

  return (
    <Card className="max-w-3xl border-line-2 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-[18px]">Usuario web service de tus zonas</CardTitle>
        <CardDescription>
          El usuario que Triunfo habilitó para tu red (empieza con WS). Trae las novedades de la cartera de todos los
          productores de tus zonas. No sirve para cotizar ni para bajar documentos: para eso cada principal y cada
          productor carga su usuario de TriunfoNet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {isLoading && <Skeleton className="h-32" />}
        {isError && <p className="text-[14px] text-destructive">No se pudo cargar el usuario web service.</p>}
        {status && (
          <>
            <WsStatusLine status={status} />
            <WsForm key={`${status.username ?? ''}|${status.verifiedCode ?? ''}`} status={status} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function WsStatusLine({ status }: { status: TriunfoWsCredentialStatus }) {
  if (!status.configured) {
    return (
      <p className="flex items-start gap-2 text-[13px] text-destructive">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        Todavía sin usuario web service: las novedades de tus zonas no se pueden traer.
      </p>
    )
  }
  const when = status.verifiedAt ? new Date(status.verifiedAt).toLocaleDateString('es-AR') : null
  return (
    <p className="flex items-start gap-2 text-[13px] text-muted-foreground">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      Usuario {status.username}
      {when ? ` · validado el ${when}` : ''}
      {status.verifiedCode ? ` con el productor ${status.verifiedCode}` : ''}
    </p>
  )
}

/** Loads or replaces the user; with one loaded, it comes filled in so only the password has to be typed. */
function WsForm({ status }: { status: TriunfoWsCredentialStatus }) {
  const save = useSaveTriunfoWsCredential()
  const [username, setUsername] = useState(status.username ?? '')
  const [password, setPassword] = useState('')
  const [productor, setProductor] = useState(status.verifiedCode ?? '')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate(
      { username: username.trim(), password: md5Hex(password), productor: productor.trim() },
      {
        onSuccess: () => {
          toast.success('Triunfo aceptó el usuario web service')
          setPassword('')
        },
        onError: error =>
          toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar. Intentá de nuevo.'),
      },
    )
  }

  return (
    <>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="triunfo-ws-usuario" className="text-[11px]">
            Usuario web service
          </Label>
          <Input
            id="triunfo-ws-usuario"
            required
            autoComplete="off"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="WS…"
            className="h-9 w-60"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="triunfo-ws-password" className="text-[11px]">
            Contraseña
          </Label>
          <Input
            id="triunfo-ws-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="h-9 w-48"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="triunfo-ws-productor" className="text-[11px]">
            Productor para validar
          </Label>
          <Input
            id="triunfo-ws-productor"
            inputMode="numeric"
            required
            value={productor}
            onChange={e => setProductor(e.target.value)}
            placeholder="Ej: 6130"
            className="h-9 w-32"
          />
        </div>
        <Button type="submit" size="sm" className="h-9" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
          {status.configured ? 'Actualizar y validar' : 'Validar y guardar'}
        </Button>
      </form>

      <TriunfoPasswordNote>
        Para validarlo se traen las novedades de un día de un productor de tus zonas: tiene que ser el código de un
        productor, no el de un zonal ni el de un organizador (Triunfo los rechaza). Si cambia la contraseña, cargá la
        nueva acá.
      </TriunfoPasswordNote>
    </>
  )
}
