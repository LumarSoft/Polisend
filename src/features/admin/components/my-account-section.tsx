'use client'

import { useState, type FormEvent } from 'react'
import { KeyRound, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import type { UpdateProfileRequest } from '@/types/api/auth'
import { useProfile } from '../hooks/use-profile'
import { useRole } from '../hooks/use-role'
import { useUpdateProfile } from '../hooks/use-update-profile'
import { TwoFactorCard } from './two-factor-card'

function AccountForm({ initialEmail, initialName }: { initialEmail: string; initialName: string }) {
  const updateProfile = useUpdateProfile()
  // The office sees its own people by name in Tareas; an Owner shows there as "Owner", and the Developer has no Tareas.
  const { isSuperAdmin, isAdmin } = useRole()

  const [email, setEmail] = useState(initialEmail)
  const [name, setName] = useState(initialName)
  const [password, setPassword] = useState('')

  const hasChanges = email !== initialEmail || name !== initialName || password.length > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const data: UpdateProfileRequest = {}
    if (email !== initialEmail) data.email = email
    if (name !== initialName) data.name = name
    if (password) data.password = password
    if (!hasChanges) return

    updateProfile.mutate(data, {
      onSuccess: () => {
        // A new password logs out (useUpdateProfile says why): nothing more to show here.
        if (data.password) return
        setPassword('')
        toast.success('Cambios guardados')
      },
      onError: error => {
        const message =
          error instanceof ApiError && error.status === 409
            ? 'Ese correo ya está en uso.'
            : 'No se pudo guardar. Intentá de nuevo.'
        toast.error(message)
      },
    })
  }

  return (
    <Card className="max-w-xl border-line-2 shadow-sm">
      <form onSubmit={handleSubmit} className="contents">
        <CardHeader>
          <CardTitle className="font-display text-[18px]">Datos de la cuenta</CardTitle>
          <CardDescription>Tu nombre, tu correo electrónico y tu contraseña de acceso.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-name">
              Nombre{' '}
              {(isSuperAdmin || isAdmin) && <span className="text-muted-foreground">(así te ven en Tareas)</span>}
            </Label>
            <Input
              id="settings-name"
              maxLength={80}
              placeholder="Mili"
              className="h-10"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="settings-email"
                type="email"
                required
                placeholder="nombre@gmail.com"
                className="h-10 pl-9"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="settings-password">
              Nueva contraseña <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="settings-password"
                type="password"
                minLength={6}
                autoComplete="new-password"
                placeholder="Dejá en blanco para no cambiarla"
                className="h-10 pl-9"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Al cambiarla se cierran todas tus sesiones, también esta: después ingresás de nuevo con la contraseña
              nueva.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!hasChanges || updateProfile.isPending} className="h-10">
            {updateProfile.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Guardando…
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function AccountSkeleton() {
  return (
    <Card className="max-w-xl border-line-2">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

/**
 * The logged-in user's own account, for every role: Configuración → Mi cuenta for the office and an Owner, and its
 * own page (/admin/cuenta) for the Developer, who has no Configuración. Only /users/me and /auth/2fa/*: no principal
 * data. The two-step card shows only when the API reports `twoFactorEnabled` (an API without 2FA leaves it out).
 */
export function MyAccountSection() {
  const { data: profile, isLoading, isError } = useProfile()
  if (isLoading) return <AccountSkeleton />
  if (isError || !profile) return <p className="text-[14px] text-destructive">No se pudo cargar tu perfil.</p>
  return (
    <div className="flex flex-col gap-5">
      <AccountForm key={profile.id} initialEmail={profile.email} initialName={profile.name ?? ''} />
      {typeof profile.twoFactorEnabled === 'boolean' && (
        <TwoFactorCard email={profile.email} enabled={profile.twoFactorEnabled} />
      )}
    </div>
  )
}
