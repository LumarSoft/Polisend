import { ApiError } from '@/lib/api-client'
import type { TwoFactorErrorCode } from '@/types/api/two-factor'

/** The authenticator apps the panel names to the customer (any TOTP app works). */
export const AUTHENTICATOR_APPS = ['Google Authenticator', 'Microsoft Authenticator', 'Authy', '1Password'] as const

/** What to do without the phone, in the customer's words (Mi cuenta and the login's second step). */
export const LOST_PHONE_HELP =
  'Si perdés el teléfono, entrá con uno de tus códigos de recuperación. Si tampoco los tenés, pedile a quien administra tu cuenta que reinicie tu verificación en dos pasos.'

const APP_CODE_LENGTH = 6
const RECOVERY_CODE_LENGTH = 10

const TWO_FACTOR_ERROR_CODES: readonly TwoFactorErrorCode[] = [
  'TWO_FACTOR_CODE_INVALID',
  'TWO_FACTOR_CHALLENGE_EXPIRED',
  'TWO_FACTOR_LOCKED',
  'TWO_FACTOR_ALREADY_ENABLED',
  'TWO_FACTOR_NOT_SET_UP',
  'TWO_FACTOR_CREDENTIALS_INVALID',
  'TWO_FACTOR_NOT_ENABLED',
]

/** The API's two-step `code` of a failed call, or null for any other error. */
export function twoFactorErrorCode(error: unknown): TwoFactorErrorCode | null {
  if (!(error instanceof ApiError)) return null
  return TWO_FACTOR_ERROR_CODES.find(code => code === error.code) ?? null
}

/** The API's Spanish message of a two-step error (always written for the person), else the fallback. */
export function twoFactorErrorMessage(error: unknown, fallback: string): string {
  return twoFactorErrorCode(error) && error instanceof ApiError ? error.message : fallback
}

/** What the person typed in a field for the app's code: digits only, at most 6. */
export function appCodeInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, APP_CODE_LENGTH)
}

/** What the person typed in a field for a recovery code: letters, digits and dashes, upper case. */
export function recoveryCodeInput(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 32)
}

/** A field that takes either kind (disabling): up to 6 digits is the app's code, anything else a recovery code. */
export function anyCodeInput(value: string): string {
  const compact = value.replace(/\s/g, '')
  return /^\d{0,6}$/.test(compact) ? compact : recoveryCodeInput(value)
}

export function isAppCode(value: string): boolean {
  return new RegExp(`^\\d{${APP_CODE_LENGTH}}$`).test(value)
}

/** "ABCDE-FGHJK": 10 letters or digits; case and dashes do not matter. */
export function isRecoveryCode(value: string): boolean {
  return value.replace(/[^A-Za-z0-9]/g, '').length === RECOVERY_CODE_LENGTH && !isAppCode(value)
}

/** The key for manual entry in groups of four, as the apps show it. */
export function formatSecret(secret: string): string {
  return secret.replace(/(.{4})(?=.)/g, '$1 ')
}

/** The recovery codes as the downloaded or copied text: who they are for, how they work, one per line. */
export function recoveryCodesText(email: string, codes: string[]): string {
  return [
    'Polisend · Códigos de recuperación',
    `Cuenta: ${email}`,
    '',
    'Cada código sirve una sola vez para entrar sin tu app de autenticación.',
    'Guardalos en un lugar seguro: no se pueden volver a ver en el panel.',
    '',
    ...codes.map((code, index) => `${String(index + 1).padStart(2, ' ')}. ${code}`),
    '',
  ].join('\n')
}

export const RECOVERY_CODES_FILE_NAME = 'polisend-codigos-de-recuperacion.txt'
