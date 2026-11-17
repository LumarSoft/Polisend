import { ApiError } from '@/lib/api-client'
import type { EmailRestorableError } from '@/types/api/hierarchy'

/**
 * What the Usuarios screen says when `/hierarchy/*` refuses something. Most refusals already come in Spanish (the
 * PLATFORM_* restrictions, the last SuperAdmin, a used e-mail) and are shown as they are; the few the API still says
 * in English get a Spanish line here.
 */

const ENGLISH_MESSAGES: Record<string, string> = {
  'Insufficient role': 'Tu rol no permite hacer esto.',
  'You cannot access this organization': 'No tenés acceso a ese principal.',
  'You cannot access this zone': 'No tenés acceso a esa zona.',
  'You cannot act on that organization': 'Ya no tenés acceso a ese principal.',
  'You cannot delete your own account': 'No podés eliminar tu propia cuenta.',
  'One or more producer codes do not belong to this organization': 'Alguno de los códigos no es de ese principal.',
  'Email already in use': 'Ese correo ya está en uso.',
}

const ENGLISH_PATTERNS: Array<[RegExp, string]> = [
  [/^User with id \d+ not found$/, 'Ese usuario ya no existe o no está a tu alcance.'],
  [/^Organization \d+ not found$/, 'Ese principal ya no existe.'],
  [/^Zone \d+ not found$/, 'Esa zona ya no existe.'],
  [/^Code \d+ not found/, 'Ese código ya no existe.'],
]

/** class-validator's English (`email must be an email`): the form already checks these, so a generic line is enough. */
const VALIDATION_MESSAGE = /\b(must|should)\b/

export function networkErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError) || error.status >= 500 || !error.message) return fallback
  const message = error.message
  const known = ENGLISH_MESSAGES[message] ?? ENGLISH_PATTERNS.find(([pattern]) => pattern.test(message))?.[1]
  if (known) return known
  if (error.status === 400 && VALIDATION_MESSAGE.test(message)) return 'Revisá los datos del formulario.'
  // No JSON body, or a route this API does not have yet ("Cannot POST /…").
  if (message.startsWith('Request failed with status') || /^Cannot [A-Z]+ \//.test(message)) return fallback
  return message
}

/** The deleted user a 409 offers to restore (`code: EMAIL_RESTORABLE`), or null. */
export function restorableUserIdOf(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.code !== 'EMAIL_RESTORABLE') return null
  const body = error.body as Partial<EmailRestorableError> | undefined
  return typeof body?.restorableUserId === 'number' ? body.restorableUserId : null
}
