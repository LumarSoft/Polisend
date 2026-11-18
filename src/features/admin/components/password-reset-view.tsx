'use client'

import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RotateCw,
} from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { readRememberedLoginEmail } from '../hooks/use-login'
import { usePasswordReset } from '../hooks/use-password-reset'

const MIN_PASSWORD_LENGTH = 6
const CODE_LENGTH = 6
const SENT_MESSAGE = 'Si el correo tiene una cuenta, te mandamos un código.'

const subscribeNothing = () => () => {}

const CARD =
  'flex flex-col gap-5 rounded-3xl border border-line-2 bg-paper p-7 shadow-[0_30px_70px_-30px_rgba(15,13,10,0.25)]'

/**
 * /admin/recuperar («¿Olvidaste tu contraseña?»): the e-mail, then the 6-digit code the API mails with the new
 * password, then back to the login. Public: no session is read or needed, and the page never logs in.
 */
export function PasswordResetView() {
  const reset = usePasswordReset()
  const { step } = reset

  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas px-5 py-16">
      <div className="w-full max-w-[420px]">
        {step.kind === 'done' ? (
          <div className="text-center">
            <BrandMark size={48} className="mx-auto mb-5 rounded-2xl shadow-md" />
            <div className="rounded-3xl border border-line-2 bg-paper p-7 shadow-[0_30px_70px_-30px_rgba(15,13,10,0.25)]">
              <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              <h1 className="font-display text-[22px] leading-tight text-ink">Listo, ya podés iniciar sesión</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Ingresá con <span className="font-medium text-ink">{step.email}</span> y tu contraseña nueva. Las
                sesiones que tenías abiertas se cerraron. Si tenés la verificación en dos pasos activa, el ingreso te
                pide el código de tu app como siempre.
              </p>
              <Button asChild className="mt-5 h-11 w-full text-[14px]">
                <Link href="/admin/login">Ir a iniciar sesión</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Header
              title={step.kind === 'email' ? '¿Olvidaste tu contraseña?' : 'Elegí una contraseña nueva'}
              subtitle={
                step.kind === 'email'
                  ? 'Escribí el correo con el que entrás al panel y te mandamos un código para elegir una nueva.'
                  : SENT_MESSAGE
              }
            />
            {step.kind === 'email' ? (
              <EmailStep
                defaultEmail={step.email}
                isSending={reset.isSending}
                error={reset.error}
                onChange={reset.clearError}
                onSubmit={reset.sendCode}
              />
            ) : (
              <CodeStep
                email={step.email}
                resent={reset.resent}
                resendIn={reset.resendIn}
                isSending={reset.isSending}
                isConfirming={reset.isConfirming}
                error={reset.error}
                onChange={reset.clearError}
                onResend={reset.resend}
                onChangeEmail={reset.changeEmail}
                onSubmit={reset.submitCode}
              />
            )}
            <p className="mt-6 text-center text-[13px]">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-ink"
              >
                <ArrowLeft className="size-3.5" />
                Volver a iniciar sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-7 text-center">
      <BrandMark size={48} className="mx-auto mb-5 rounded-2xl shadow-md" />
      <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">
        Polisend · Panel de administración
      </div>
      <h1 className="font-display text-[28px] leading-tight text-ink">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function ErrorLine({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

interface EmailStepProps {
  defaultEmail?: string
  isSending: boolean
  error: string | null
  onChange: () => void
  onSubmit: (email: string) => void
}

function EmailStep({ defaultEmail, isSending, error, onChange, onSubmit }: EmailStepProps) {
  // The e-mail typed in the login form (handed over in this tab's storage, never in the URL), until another is typed.
  const rememberedEmail = useSyncExternalStore(subscribeNothing, readRememberedLoginEmail, () => '')
  const [typedEmail, setEmail] = useState<string | null>(defaultEmail ?? null)
  const email = typedEmail ?? rememberedEmail

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(email)
  }

  return (
    <form onSubmit={handleSubmit} className={CARD}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-email">Correo electrónico</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-email"
            type="email"
            autoComplete="username"
            autoFocus
            required
            placeholder="nombre@tuproductora.com"
            className="h-11 pl-9"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              onChange()
            }}
          />
        </div>
      </div>

      {error && <ErrorLine>{error}</ErrorLine>}

      <Button type="submit" disabled={isSending || email.trim() === ''} className="h-11 w-full text-[14px]">
        {isSending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Enviando…
          </>
        ) : (
          'Mandame un código'
        )}
      </Button>
    </form>
  )
}

interface CodeStepProps {
  email: string
  resent: boolean
  resendIn: number
  isSending: boolean
  isConfirming: boolean
  error: string | null
  onChange: () => void
  onResend: () => void
  onChangeEmail: () => void
  onSubmit: (code: string, password: string) => void
}

function CodeStep({
  email,
  resent,
  resendIn,
  isSending,
  isConfirming,
  error,
  onChange,
  onResend,
  onChangeEmail,
  onSubmit,
}: CodeStepProps) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH
  const mismatch = confirmation.length > 0 && confirmation !== password
  const valid = code.length === CODE_LENGTH && password.length >= MIN_PASSWORD_LENGTH && confirmation === password

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (valid && !isConfirming) onSubmit(code, password)
  }

  return (
    <form onSubmit={handleSubmit} className={CARD}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-account">Tu cuenta</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          {/* Read-only, for password managers to save the new password under the right account. */}
          <Input
            id="reset-account"
            type="email"
            autoComplete="username"
            readOnly
            className="h-11 bg-muted/40 pl-9 text-muted-foreground"
            value={email}
          />
        </div>
        <button
          type="button"
          onClick={onChangeEmail}
          className="self-start text-[12.5px] text-muted-foreground underline-offset-2 hover:text-ink hover:underline"
        >
          Usar otro correo
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-code">Código del correo</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={CODE_LENGTH}
            placeholder="123456"
            className="h-11 pl-9 font-mono tracking-[0.3em]"
            value={code}
            onChange={e => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))
              onChange()
            }}
          />
        </div>
        <p className="text-[12.5px] text-muted-foreground">
          {resent ? 'Te mandamos un código nuevo: vale solo el último. ' : ''}Vence a los 15 minutos. Si no llega,
          revisá el correo no deseado.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-password">Contraseña nueva</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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
        <Label htmlFor="reset-confirmation">Repetila</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-confirmation"
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

      {error && <ErrorLine>{error}</ErrorLine>}

      <Button type="submit" disabled={!valid || isConfirming} className="h-11 w-full text-[14px]">
        {isConfirming ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Guardando…
          </>
        ) : (
          'Guardar contraseña'
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={resendIn > 0 || isSending}
        onClick={onResend}
        className="h-10 w-full border-line-2 text-[13px]"
      >
        {isSending ? <Loader2 className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
        {resendIn > 0 ? `Reenviar código en ${resendIn} s` : 'Reenviar código'}
      </Button>
    </form>
  )
}
