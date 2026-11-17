'use client'

import { useState, type FormEvent } from 'react'
import { AlertCircle, ArrowLeft, KeyRound, Loader2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { appCodeInput, isAppCode, isRecoveryCode, recoveryCodeInput } from '../lib/two-factor'

interface LoginTwoFactorStepProps {
  isSubmitting: boolean
  errorMessage: string | null
  onSubmit: (code: string) => void
  onClearError: () => void
  /** Back to the password (another account, or start over). */
  onBack: () => void
}

type CodeKind = 'app' | 'recovery'

/**
 * The login's second step for an account with two-step verification: the app's 6 digits (sent as soon as the sixth
 * is typed) or one of the recovery codes.
 */
export function LoginTwoFactorStep({
  isSubmitting,
  errorMessage,
  onSubmit,
  onClearError,
  onBack,
}: LoginTwoFactorStepProps) {
  const [kind, setKind] = useState<CodeKind>('app')
  const [code, setCode] = useState('')
  const valid = kind === 'app' ? isAppCode(code) : isRecoveryCode(code)

  const send = (value: string) => {
    onSubmit(value)
    // A wrong app code is retyped from scratch; a recovery code stays to fix a typo.
    if (kind === 'app') setCode('')
  }

  const handleChange = (raw: string) => {
    const next = kind === 'app' ? appCodeInput(raw) : recoveryCodeInput(raw)
    setCode(next)
    onClearError()
    if (kind === 'app' && isAppCode(next) && !isSubmitting) send(next)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (valid && !isSubmitting) send(code)
  }

  const switchKind = () => {
    setKind(kind === 'app' ? 'recovery' : 'app')
    setCode('')
    onClearError()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-3xl border border-line-2 bg-paper p-7 shadow-[0_30px_70px_-30px_rgba(15,13,10,0.25)]"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="two-factor-code">
          {kind === 'app' ? 'Código de tu app de autenticación' : 'Código de recuperación'}
        </Label>
        <div className="relative">
          {kind === 'app' ? (
            <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          ) : (
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            key={kind}
            id="two-factor-code"
            autoFocus
            required
            readOnly={isSubmitting}
            autoComplete={kind === 'app' ? 'one-time-code' : 'off'}
            inputMode={kind === 'app' ? 'numeric' : 'text'}
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={kind === 'app' ? '123456' : 'ABCDE-FGHJK'}
            className="h-11 pl-9 font-mono text-[15px] tracking-[0.2em]"
            value={code}
            onChange={e => handleChange(e.target.value)}
          />
        </div>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          {kind === 'app'
            ? 'Abrí tu app de autenticación y escribí los 6 números que muestra para Polisend.'
            : 'Es uno de los 10 códigos que guardaste al activar la verificación. Cada uno sirve una sola vez.'}
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button type="submit" disabled={!valid || isSubmitting} className="h-11 w-full text-[14px]">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Verificando…
          </>
        ) : (
          'Verificar e ingresar'
        )}
      </Button>

      <div className="flex flex-col items-center gap-2 text-[13px]">
        <button
          type="button"
          onClick={switchKind}
          className="font-medium text-ember-2 underline-offset-4 transition-colors hover:underline"
        >
          {kind === 'app' ? 'Usar un código de recuperación' : 'Usar el código de la app'}
        </button>
        {kind === 'recovery' && (
          <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
            ¿Tampoco tenés los códigos? Pedile a quien administra tu cuenta que reinicie tu verificación en dos pasos.
          </p>
        )}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver a la contraseña
        </button>
      </div>
    </form>
  )
}
