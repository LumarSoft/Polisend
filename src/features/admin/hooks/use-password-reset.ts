import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import { passwordResetService } from '@/services/password-reset.service'
import {
  PASSWORD_RESET_CODE_PATTERN,
  PASSWORD_RESET_INVALID,
  PASSWORD_RESET_RESEND_SECONDS,
  type PasswordResetConfirmRequest,
} from '@/types/api/password-reset'
import { rememberLoginEmail } from './use-login'

/** What /admin/recuperar shows: the e-mail, then the mailed code with the new password, then the way to the login. */
export type PasswordResetStep =
  /** `email`: the one typed before «Usar otro correo», to fix a typo instead of typing it again. */
  { kind: 'email'; email?: string } | { kind: 'code'; email: string } | { kind: 'done'; email: string }

const CONNECTION_ERROR = 'No se pudo enviar. Revisá tu conexión e intentá de nuevo.'

function requestErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 429) {
    return 'Hiciste muchos pedidos seguidos. Esperá unos minutos y probá de nuevo.'
  }
  if (error instanceof ApiError && error.status === 400) return 'Revisá el correo: no parece una dirección válida.'
  return CONNECTION_ERROR
}

function confirmErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === PASSWORD_RESET_INVALID) {
    return 'El código no es válido o venció. Revisalo, o pedí uno nuevo con «Reenviar código».'
  }
  if (error instanceof ApiError && error.status === 429) {
    return 'Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.'
  }
  // The code's format is checked before sending, so any other 400 is about the password.
  if (error instanceof ApiError && error.status === 400) {
    return 'Revisá la contraseña: tiene que tener al menos 6 caracteres.'
  }
  return 'No se pudo guardar la contraseña. Intentá de nuevo.'
}

/** Seconds until «Reenviar código» may send again; counts down once a second while above zero. */
function useResendCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0)
  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft(left => left - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])
  return { secondsLeft, restart: () => setSecondsLeft(PASSWORD_RESET_RESEND_SECONDS) }
}

/**
 * The public page /admin/recuperar. The API answers the e-mail step the same way whether the account exists or not,
 * so the page always moves on to the code with a neutral message. Nothing is retried on its own and nothing is kept
 * after the page: the e-mail lives in memory and, on success, goes to the login form like /admin/activar's does.
 */
export function usePasswordReset() {
  const [step, setStep] = useState<PasswordResetStep>({ kind: 'email' })
  const [error, setError] = useState<string | null>(null)
  /** A code was sent again from the code step: the page says so once. */
  const [resent, setResent] = useState(false)
  const countdown = useResendCountdown()
  const request = useMutation({ mutationFn: (email: string) => passwordResetService.request({ email }) })
  const confirm = useMutation({
    mutationFn: (data: PasswordResetConfirmRequest) => passwordResetService.confirm(data),
  })

  const sendCode = (rawEmail: string) => {
    const email = rawEmail.trim()
    if (!email || request.isPending) return
    setError(null)
    request.mutate(email, {
      onSuccess: () => {
        setResent(step.kind === 'code')
        setStep({ kind: 'code', email })
        countdown.restart()
      },
      onError: failure => setError(requestErrorMessage(failure)),
    })
  }

  const submitCode = (code: string, password: string) => {
    if (step.kind !== 'code' || confirm.isPending) return
    if (!PASSWORD_RESET_CODE_PATTERN.test(code)) {
      setError('El código son los 6 números que te llegaron por correo.')
      return
    }
    setError(null)
    const { email } = step
    confirm.mutate(
      { email, code, password },
      {
        onSuccess: () => {
          rememberLoginEmail(email)
          setStep({ kind: 'done', email })
        },
        onError: failure => setError(confirmErrorMessage(failure)),
      },
    )
  }

  return {
    step,
    error,
    resent,
    clearError: () => setError(null),
    sendCode,
    /** Sends a new code to the same e-mail, once the countdown is over. */
    resend: () => {
      if (step.kind === 'code' && countdown.secondsLeft <= 0) sendCode(step.email)
    },
    resendIn: countdown.secondsLeft,
    submitCode,
    /** Back to the e-mail step (a typo in the address). */
    changeEmail: () => {
      setError(null)
      setResent(false)
      setStep({ kind: 'email', email: step.kind === 'code' ? step.email : undefined })
    },
    isSending: request.isPending,
    isConfirming: confirm.isPending,
  }
}
