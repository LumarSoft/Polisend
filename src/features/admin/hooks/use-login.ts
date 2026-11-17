import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-client'
import { adminAuthService } from '@/services/admin-auth.service'
import { isTwoFactorChallenge, type LoginRequest } from '@/types/api/auth'
import { useAuth } from '../context/auth-context'

/** The login's steps: the password, then (accounts with two-step verification) the app's code. */
export type LoginStep = { kind: 'password' } | { kind: 'two-factor'; challengeToken: string }

function loginErrorMessage(error: unknown): string {
  return error instanceof ApiError && error.status === 401
    ? 'Email o contraseña incorrectos.'
    : 'No se pudo iniciar sesión. Intentá de nuevo.'
}

/**
 * Everything the login form submits, in one place. A session is stored here and the form sends the person to its
 * role's home (`homePathFor`) once the profile says who it is. An account with two-step verification answers a
 * challenge instead: `step` becomes 'two-factor' with its `challengeToken`, for the second step
 * (`adminAuthService.loginTwoFactor`) that the authenticator work adds here.
 */
export function useLoginSubmit() {
  const { login } = useAuth()
  const [step, setStep] = useState<LoginStep>({ kind: 'password' })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const passwordLogin = useMutation({ mutationFn: (data: LoginRequest) => adminAuthService.login(data) })

  const submitPassword = (credentials: LoginRequest) => {
    setErrorMessage(null)
    passwordLogin.mutate(credentials, {
      onSuccess: response => {
        if (isTwoFactorChallenge(response)) {
          setStep({ kind: 'two-factor', challengeToken: response.challengeToken })
          return
        }
        forgetRememberedLoginEmail()
        login(response.access_token)
      },
      onError: error => setErrorMessage(loginErrorMessage(error)),
    })
  }

  return {
    step,
    submitPassword,
    isSubmitting: passwordLogin.isPending,
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

/** /admin/activar hands the e-mail to the login form this way (never in the URL). */
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
