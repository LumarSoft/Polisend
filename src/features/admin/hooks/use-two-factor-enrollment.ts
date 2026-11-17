import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { TwoFactorSetupResponse } from '@/types/api/two-factor'
import { twoFactorErrorCode, twoFactorErrorMessage } from '../lib/two-factor'
import { useTwoFactorActions } from './use-two-factor'

/** Where the activation is: scanning the QR and confirming a code, or reading the recovery codes (shown once). */
export type EnrollmentPhase = 'scan' | 'codes'

const ALREADY_ENABLED_MESSAGE = 'La verificación en dos pasos ya estaba activa en tu cuenta.'

function confirmErrorMessage(error: unknown): string {
  if (twoFactorErrorCode(error) === 'TWO_FACTOR_CODE_INVALID') {
    return 'El código no es válido. Revisá que la hora de tu teléfono esté en automático y escribí el código que muestra la app ahora.'
  }
  return twoFactorErrorMessage(error, 'No se pudo activar. Intentá de nuevo.')
}

/**
 * Turning on one's own two-step verification (Mi cuenta): `start` asks for a new secret (not on yet), `confirm` sends
 * the app's code and keeps the 10 recovery codes the API answers once. The secret and the codes live only in this
 * state, and `close` forgets them; closing before confirming leaves 2FA off (the unconfirmed secret is replaced by the
 * next setup).
 */
export function useTwoFactorEnrollment() {
  const queryClient = useQueryClient()
  const { setup, enable } = useTwoFactorActions()
  const [phase, setPhase] = useState<EnrollmentPhase>('scan')
  const [secret, setSecret] = useState<TwoFactorSetupResponse | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [alreadyEnabled, setAlreadyEnabled] = useState(false)

  const noteAlreadyEnabled = () => {
    setAlreadyEnabled(true)
    setError(ALREADY_ENABLED_MESSAGE)
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.profile })
  }

  const start = () => {
    setPhase('scan')
    setSecret(null)
    setError(null)
    setAlreadyEnabled(false)
    setup.mutate(undefined, {
      onSuccess: data => setSecret(data),
      onError: err => {
        if (twoFactorErrorCode(err) === 'TWO_FACTOR_ALREADY_ENABLED') noteAlreadyEnabled()
        else setError('No se pudo generar la clave para tu app. Intentá de nuevo.')
      },
    })
  }

  const confirm = (code: string) => {
    setError(null)
    enable.mutate(
      { code },
      {
        onSuccess: ({ recoveryCodes: codes }) => {
          setRecoveryCodes(codes)
          setSecret(null)
          setPhase('codes')
        },
        onError: err => {
          const errorCode = twoFactorErrorCode(err)
          if (errorCode === 'TWO_FACTOR_ALREADY_ENABLED') noteAlreadyEnabled()
          else if (errorCode === 'TWO_FACTOR_NOT_SET_UP') {
            // The key was replaced (another tab asked for one): a new QR, and say so.
            start()
            setError('La clave cambió. Escaneá el código nuevo y escribí el código que muestra la app.')
          } else setError(confirmErrorMessage(err))
        },
      },
    )
  }

  const close = () => {
    setSecret(null)
    setRecoveryCodes([])
    setError(null)
    setPhase('scan')
    setup.reset()
    enable.reset()
  }

  return {
    phase,
    secret,
    recoveryCodes,
    error,
    /** 2FA was already on (another tab): nothing to scan, only close. */
    alreadyEnabled,
    isPreparing: setup.isPending,
    isConfirming: enable.isPending,
    start,
    confirm,
    clearError: () => setError(null),
    close,
  }
}

export type TwoFactorEnrollment = ReturnType<typeof useTwoFactorEnrollment>
