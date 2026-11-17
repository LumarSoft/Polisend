import { ApiError } from '@/lib/api-client'
import type { EmailRestorableError } from '@/types/api/hierarchy'

/** The API's 400 for a code that is not of the account's principal. */
const CODES_OF_ANOTHER_PRINCIPAL = 'One or more producer codes do not belong to this organization'

/**
 * What the network screens (Mi red, Usuarios, Owners y zonas, Organizaciones, the account actions) say when the API
 * refuses something. Most refusals already come in Spanish (the PLATFORM_* restrictions, the last SuperAdmin, a used
 * e-mail, "No podés…") and are shown as they are; the few the API still says in English get a Spanish line here.
 */
const SPANISH: Array<[RegExp, string]> = [
  [/^Email already in use$/, 'Ese correo ya está en uso.'],
  [/^Insufficient role$/, 'Tu rol no permite hacer esto.'],
  [/^You cannot access this zone$/, 'No tenés acceso a esa zona.'],
  [/^You cannot access this organization$/, 'No tenés acceso a ese principal.'],
  [/^You cannot act on that organization$/, 'Ya no tenés acceso a ese principal.'],
  [/^You cannot delete your own account$/, 'No podés eliminar tu propia cuenta.'],
  [new RegExp(`^${CODES_OF_ANOTHER_PRINCIPAL}$`), 'Alguno de los códigos no es de ese principal.'],
  [/^One or more zones do not exist$/, 'Alguna de las zonas elegidas ya no existe.'],
  [/^Only a SuperAdmin or an Admin can become an Owner$/, 'Solo un SuperAdmin o un Admin puede pasar a ser Owner.'],
  [/^Zone \d+ not found$/, 'Esa zona ya no existe.'],
  [/^Organization \d+ not found$/, 'Ese principal ya no existe.'],
  [/^Owner \d+ not found$/, 'Ese Owner ya no existe.'],
  [/^User( with id)? \d+ not found$/, 'Ese usuario ya no existe o no está a tu alcance.'],
  [/^Code \d+ not found/, 'Ese código ya no existe.'],
  // An API without the Developer's move of an account to another principal (decision of 17/11).
  [/\bproperty producerId should not exist\b/, 'Este servidor todavía no permite pasar un usuario a otro principal.'],
  // A route the API in production does not have yet (the panel can ship first).
  [/^Cannot (GET|POST|PUT|PATCH|DELETE) \//, 'Esta acción todavía no está disponible. Probá más tarde.'],
]

/** class-validator's English (`email must be an email`): the forms already check these, so a generic line is enough. */
const VALIDATION_MESSAGE = /\b(must|should)\b/

/**
 * The line to show for a failed request: the API's own message for a refusal (4xx), translated when it is one of the
 * few English ones, else the fallback (5xx, network errors, a response without a message).
 */
export function apiErrorMessage(error: unknown, fallback = 'No se pudo guardar. Intentá de nuevo.'): string {
  if (!(error instanceof ApiError) || error.status < 400 || error.status >= 500 || !error.message) return fallback
  const message = error.message
  const known = SPANISH.find(([pattern]) => pattern.test(message))
  if (known) return known[1]
  if (error.status === 400 && VALIDATION_MESSAGE.test(message)) return 'Revisá los datos del formulario.'
  // No JSON body: nothing worth showing.
  if (message.startsWith('Request failed with status')) return fallback
  return message
}

/** A 400 because a code sent is not of the account's principal (on a restore: the account was in another one). */
export function isCodesOfAnotherPrincipal(error: unknown): boolean {
  return error instanceof ApiError && error.status === 400 && error.message === CODES_OF_ANOTHER_PRINCIPAL
}

/** The deleted user a 409 offers to restore (`code: EMAIL_RESTORABLE`), or null. */
export function restorableUserIdOf(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.code !== 'EMAIL_RESTORABLE') return null
  const body = error.body as Partial<EmailRestorableError> | undefined
  return typeof body?.restorableUserId === 'number' ? body.restorableUserId : null
}
