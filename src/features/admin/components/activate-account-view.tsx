'use client'

import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Link2Off, Loader2, Lock, Mail, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PasswordSetupInfo } from '@/types/api/password-setup'
import { SESSION_ENDED_TOAST_ID, useAuth } from '../context/auth-context'
import { useAccountActivation } from '../hooks/use-account-activation'
import { dropLinkTokenFromUrl, readLinkToken } from '../lib/link-token'

const MIN_PASSWORD_LENGTH = 6
const INVALID_LINK_MESSAGE = 'El enlace no es válido o ya venció. Pedí uno nuevo a quien administra tu cuenta.'

const subscribeNothing = () => () => {}

/**
 * Whether this page load already ended the session the browser held when the link was opened. Module state, not
 * component state: the panel content remounts on every session change (src/app/admin/providers.tsx), and a remount
 * must not take a login made later in another tab for the opening session.
 */
let openingSessionChecked = false

/**
 * /admin/activar: the person chooses its password from a mailed link (an invitation or a reset). Public: no session
 * is used, and one held in this browser ends before the form shows (the account's older sessions end on success
 * anyway). Every string from the API is plain text. Never logs in: success leads to /admin/login.
 */
export function ActivateAccountView() {
  // Read in the browser only (undefined on the server and while hydrating).
  const token = useSyncExternalStore(subscribeNothing, readLinkToken, () => undefined)
  const { hydrated, isAuthenticated, logout } = useAuth()
  const activation = useAccountActivation(token ?? null)
  // Only the session this browser held when the link was opened ends, once. A login made afterwards in another tab
  // (this person's, after choosing the password, or anyone's) is not this page's to end, however long it stays open.
  const sessionCleared = hydrated && (!isAuthenticated || openingSessionChecked)

  // The token never stays in the address bar, the history or a bookmark: it lives only in memory from here on.
  useEffect(() => {
    if (token !== undefined) dropLinkTokenFromUrl()
  }, [token])

  useEffect(() => {
    if (!hydrated || openingSessionChecked) return
    openingSessionChecked = true
    if (isAuthenticated) logout()
  }, [hydrated, isAuthenticated, logout])

  // A dead session held in this browser announces itself on the way out; on this page it is noise.
  useEffect(() => {
    if (sessionCleared) toast.dismiss(SESSION_ENDED_TOAST_ID)
  }, [sessionCleared])

  const { state } = activation
  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas px-5 py-16">
      <div className="w-full max-w-[420px]">
        {token === undefined || !sessionCleared || state.kind === 'loading' ? (
          <div className="flex justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : state.kind === 'missing' || state.kind === 'invalid' ? (
          <Notice icon={<Link2Off className="size-5" />} title="Este enlace ya no sirve">
            <p>{INVALID_LINK_MESSAGE}</p>
            {state.kind === 'missing' && (
              <p className="mt-2">Si recargaste esta página, abrí de nuevo el enlace desde tu correo.</p>
            )}
          </Notice>
        ) : state.kind === 'unreachable' ? (
          <Notice icon={<AlertCircle className="size-5" />} title="No pudimos abrir el enlace">
            <p>Revisá tu conexión a internet y probá de nuevo.</p>
            <Button type="button" variant="outline" className="mt-5" onClick={activation.retry}>
              <RotateCw className="size-4" /> Probar de nuevo
            </Button>
          </Notice>
        ) : state.kind === 'done' ? (
          <Notice
            icon={<CheckCircle2 className="size-5" />}
            title="Listo: ya podés entrar con tu nueva contraseña"
            tone="success"
          >
            <p>
              Ingresá con <span className="font-medium text-ink">{state.info.email}</span> y la contraseña que elegiste.
            </p>
            <Button asChild className="mt-5 h-11 w-full text-[14px]">
              <Link href="/admin/login">Ir a iniciar sesión</Link>
            </Button>
          </Notice>
        ) : (
          <PasswordForm
            info={state.info}
            isSubmitting={activation.isSubmitting}
            submitError={activation.submitError}
            onChange={activation.clearSubmitError}
            onSubmit={activation.submit}
          />
        )}
      </div>
    </div>
  )
}

function greeting({ name, kind, organizationName }: PasswordSetupInfo): string {
  const hello = name ? `Hola ${name}` : 'Hola'
  return kind === 'reset'
    ? `${hello}, elegí una contraseña nueva para entrar a ${organizationName}.`
    : `${hello}, elegí tu contraseña para entrar a ${organizationName}.`
}

interface PasswordFormProps {
  info: PasswordSetupInfo
  isSubmitting: boolean
  submitError: string | null
  onChange: () => void
  onSubmit: (password: string) => void
}

function PasswordForm({ info, isSubmitting, submitError, onChange, onSubmit }: PasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH
  const mismatch = confirmation.length > 0 && confirmation !== password
  const valid = password.length >= MIN_PASSWORD_LENGTH && confirmation === password

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (valid && !isSubmitting) onSubmit(password)
  }

  return (
    <>
      <div className="mb-7 text-center">
        <BrandMark size={48} className="mx-auto mb-5 rounded-2xl shadow-md" />
        <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">
          Polisend — {info.organizationName}
        </div>
        <h1 className="font-display text-[28px] leading-tight text-ink">
          {info.kind === 'reset' ? 'Elegí una contraseña nueva' : 'Elegí tu contraseña para entrar'}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{greeting(info)}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-3xl border border-line-2 bg-paper p-7 shadow-[0_30px_70px_-30px_rgba(15,13,10,0.25)]"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="activate-email">Tu cuenta</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            {/* Read-only, for password managers to save the new password under the right account. */}
            <Input
              id="activate-email"
              type="email"
              autoComplete="username"
              readOnly
              className="h-11 bg-muted/40 pl-9 text-muted-foreground"
              value={info.email}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="activate-password">{info.kind === 'reset' ? 'Contraseña nueva' : 'Contraseña'}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="activate-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              required
              minLength={MIN_PASSWORD_LENGTH}
              className="h-11 pl-9 pr-10"
              aria-invalid={tooShort || undefined}
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                onChange()
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className={tooShort ? 'text-[12.5px] text-destructive' : 'text-[12.5px] text-muted-foreground'}>
            Al menos {MIN_PASSWORD_LENGTH} caracteres.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="activate-confirmation">Repetila</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="activate-confirmation"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className="h-11 pl-9"
              aria-invalid={mismatch || undefined}
              value={confirmation}
              onChange={e => {
                setConfirmation(e.target.value)
                onChange()
              }}
            />
          </div>
          {mismatch && <p className="text-[12.5px] text-destructive">Las dos contraseñas no coinciden.</p>}
        </div>

        {info.kind === 'reset' && (
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Hasta que la cambies, tu contraseña actual sigue funcionando. Si tenés la verificación en dos pasos activa,
            sigue activa.
          </p>
        )}

        {submitError && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <Button type="submit" disabled={!valid || isSubmitting} className="mt-1 h-11 w-full text-[14px]">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Guardando…
            </>
          ) : (
            'Guardar contraseña'
          )}
        </Button>
      </form>
    </>
  )
}

interface NoticeProps {
  icon: ReactNode
  title: string
  tone?: 'neutral' | 'success'
  children: ReactNode
}

function Notice({ icon, title, tone = 'neutral', children }: NoticeProps) {
  return (
    <div className="text-center">
      <BrandMark size={48} className="mx-auto mb-5 rounded-2xl shadow-md" />
      <div className="rounded-3xl border border-line-2 bg-paper p-7 shadow-[0_30px_70px_-30px_rgba(15,13,10,0.25)]">
        <div
          className={
            tone === 'success'
              ? 'mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground'
          }
        >
          {icon}
        </div>
        <h1 className="font-display text-[22px] leading-tight text-ink">{title}</h1>
        <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}
