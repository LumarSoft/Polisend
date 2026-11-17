import { useState } from 'react'
import { ApiError } from '@/lib/api-client'
import {
  PASSWORD_SETUP_INVALID,
  PASSWORD_SETUP_TOKEN_PATTERN,
  type PasswordSetupInfo,
} from '@/types/api/password-setup'
import { rememberLoginEmail } from './use-login'
import { useCompletePasswordSetup, usePasswordSetupInfo } from './use-password-setup'

/** What /admin/activar shows. */
export type ActivationState =
  | { kind: 'missing' }
  | { kind: 'invalid' }
  | { kind: 'loading' }
  | { kind: 'unreachable' }
  | { kind: 'form'; info: PasswordSetupInfo }
  | { kind: 'done'; info: PasswordSetupInfo }

/** The API no longer accepts the link: unknown, used, replaced or expired (410 on either call). */
function isDeadLink(error: unknown): boolean {
  return error instanceof ApiError && error.code === PASSWORD_SETUP_INVALID
}

/** Reading the link: a token the API cannot read (400) is as dead as a 410. */
function isUnreadableLink(error: unknown): boolean {
  return isDeadLink(error) || (error instanceof ApiError && error.status === 400)
}

function submitErrorMessage(error: unknown): string {
  return error instanceof ApiError && error.status === 400
    ? 'Revisá la contraseña: tiene que tener al menos 6 caracteres.'
    : 'No se pudo guardar la contraseña. Intentá de nuevo.'
}

/**
 * The public page of a password-setup link: reads it, sends the chosen password once, and never logs in (the person
 * goes to /admin/login with the e-mail prefilled). The token lives only in memory: the page takes it out of the URL.
 */
export function useAccountActivation(token: string | null) {
  const wellFormed = token !== null && PASSWORD_SETUP_TOKEN_PATTERN.test(token)
  const infoQuery = usePasswordSetupInfo(wellFormed ? token : null)
  const complete = useCompletePasswordSetup()
  const [done, setDone] = useState(false)
  const [spent, setSpent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const info = infoQuery.data
  const state: ActivationState =
    token === null || token === ''
      ? { kind: 'missing' }
      : !wellFormed || spent || (infoQuery.isError && isUnreadableLink(infoQuery.error))
        ? { kind: 'invalid' }
        : infoQuery.isError
          ? { kind: 'unreachable' }
          : !info
            ? { kind: 'loading' }
            : done
              ? { kind: 'done', info }
              : { kind: 'form', info }

  const submit = (password: string) => {
    if (!wellFormed || token === null || !info || complete.isPending) return
    setSubmitError(null)
    complete.mutate(
      { token, password },
      {
        onSuccess: () => {
          rememberLoginEmail(info.email)
          setDone(true)
        },
        onError: error => {
          // The token was well formed, so a 400 here is about the password.
          if (isDeadLink(error)) setSpent(true)
          else setSubmitError(submitErrorMessage(error))
        },
      },
    )
  }

  return {
    state,
    submit,
    isSubmitting: complete.isPending,
    submitError,
    clearSubmitError: () => setSubmitError(null),
    retry: () => void infoQuery.refetch(),
  }
}
