import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import { adminAuthService } from '@/services/admin-auth.service'
import { isTwoFactorChallenge, type LoginRequest, type LoginTwoFactorRequest } from '@/types/api/auth'
import { useAuth } from '../context/auth-context'
import { twoFactorErrorCode } from '../lib/two-factor'

/** The login's steps: the password, then (accounts with two-step verification) the app's code. */
export type LoginStep = { kind: 'password' } | { kind: 'two-factor'; challengeToken: string }

const GENERIC_ERROR = 'No se pudo iniciar sesión. Intentá de nuevo.'

function passwordErrorMessage(error: unknown): string {
  // Right password, but 5 wrong codes in the last minutes: the API says how long to wait.
  if (twoFactorErrorCode(error) === 'TWO_FACTOR_LOCKED' && error instanceof ApiError) return error.message
  return error instanceof ApiError && error.status === 401 ? 'Email o contraseña incorrectos.' : GENERIC_ERROR
}

function codeErrorMessage(error: unknown): string {
  const code = twoFactorErrorCode(error)
  if (code === 'TWO_FACTOR_CODE_INVALID') {
    return 'El código no es válido. Revisá que sea el que muestra tu app ahora y probá de nuevo.'
  }
  // Expired, burnt by the 5th wrong code, reset or turned off since: the API's message says to start over.
  if ((code === 'TWO_FACTOR_CHALLENGE_EXPIRED' || code === 'TWO_FACTOR_LOCKED') && error instanceof ApiError) {
    return error.message
  }
  if (error instanceof ApiError && error.status === 400) {
    return 'Revisá el código: son los 6 números de tu app o un código de recuperación como ABCDE-FGHJK.'
  }
  return GENERIC_ERROR
}

/** The second step is over: the next try needs the password again. */
function endsChallenge(error: unknown): boolean {
  const code = twoFactorErrorCode(error)
  return code === 'TWO_FACTOR_CHALLENGE_EXPIRED' || code === 'TWO_FACTOR_LOCKED'
}

/**
 * Everything the login form submits, in one place. A session is stored here and the form sends the person to its
 * role's home (`homePathFor`) once the profile says who it is. An account with two-step verification answers a
 * challenge instead: `step` becomes 'two-factor' with its `challengeToken`, and `submitCode` sends the app's code or a
 * recovery code with it. A wrong code keeps the step (the same challenge may retry); an expired or burnt challenge
 * goes back to the password with the API's explanation.
 */
export function useLoginSubmit() {
  const { login } = useAuth()
  const [step, setStep] = useState<LoginStep>({ kind: 'password' })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const passwordLogin = useMutation({ mutationFn: (data: LoginRequest) => adminAuthService.login(data) })
  const codeLogin = useMutation({ mutationFn: (data: LoginTwoFactorRequest) => adminAuthService.loginTwoFactor(data) })

  const openSession = (accessToken: string) => {
    forgetRememberedLoginEmail()
    login(accessToken)
  }

  const submitPassword = (credentials: LoginRequest) => {
    setErrorMessage(null)
    passwordLogin.mutate(credentials, {
      onSuccess: response => {
        if (isTwoFactorChallenge(response)) {
          setStep({ kind: 'two-factor', challengeToken: response.challengeToken })
          return
        }
        openSession(response.access_token)
      },
      onError: error => setErrorMessage(passwordErrorMessage(error)),
    })
  }

  /** The app's 6 digits or a recovery code (spent by this use). */
  const submitCode = (code: string) => {
    if (step.kind !== 'two-factor') return
    setErrorMessage(null)
    codeLogin.mutate(
      { challengeToken: step.challengeToken, code },
      {
        onSuccess: response => openSession(response.access_token),
        onError: error => {
          if (endsChallenge(error)) setStep({ kind: 'password' })
          setErrorMessage(codeErrorMessage(error))
        },
      },
    )
  }

  return {
    step,
    submitPassword,
    submitCode,
    isSubmitting: passwordLogin.isPending || codeLogin.isPending,
    errorMessage,
    clearError: () => setErrorMessage(null),
    /** Back to the password (an expired challenge, or the person wants to start over). */
    restart: () => {
      setStep({ kind: 'password' })
      setErrorMessage(null)
    },
  }
}

const LOGIN_EMAIL_KEY = 'panel.login.email'

/** /admin/activar, /admin/recuperar and a password change hand the e-mail to the login form this way (never in the URL). */
export function rememberLoginEmail(email: string): void {
  try {
    sessionStorage.setItem(LOGIN_EMAIL_KEY, email)
  } catch {
    // Blocked storage: the person types it.
  }
}

/** The e-mail /admin/activar left for the login form, or ''. */
export function readRememberedLoginEmail(): string {
  try {
    return sessionStorage.getItem(LOGIN_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

export function forgetRememberedLoginEmail(): void {
  try {
    sessionStorage.removeItem(LOGIN_EMAIL_KEY)
  } catch {
    // Nothing to forget.
  }
}
