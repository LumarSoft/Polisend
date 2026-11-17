import { ApiError } from '@/lib/api-client'

/** The API's few English refusals the network screens can meet, said in the panel's words. */
const SPANISH: Array<[RegExp, string]> = [
  [/^Email already in use$/, 'Ese correo ya está en uso.'],
  [/^You cannot access this zone$/, 'No tenés acceso a esa zona.'],
  [/^You cannot access this organization$/, 'No tenés acceso a ese principal.'],
  [/^Zone \d+ not found$/, 'Esa zona ya no existe.'],
  [/^Organization \d+ not found$/, 'Ese principal ya no existe.'],
  [/^Owner \d+ not found$/, 'Ese Owner ya no existe.'],
  [/^User( with id)? \d+ not found$/, 'Ese usuario ya no existe.'],
  [/^One or more zones do not exist$/, 'Alguna de las zonas elegidas ya no existe.'],
  [/^Only a SuperAdmin or an Admin can become an Owner$/, 'Solo un SuperAdmin o un Admin puede pasar a ser Owner.'],
  [/^Insufficient role$/, 'Tu rol no permite hacer esto.'],
  // A route the API in production does not have yet (the panel can ship first).
  [/^Cannot (GET|POST|PUT|PATCH|DELETE) /, 'Esta acción todavía no está disponible. Probá más tarde.'],
]

/**
 * What to tell the user about a failed request: the API's own message for a refusal (4xx; the network and platform
 * rules answer in Spanish), translated when it is one of the few English ones, else the fallback.
 */
export function apiErrorMessage(error: unknown, fallback = 'No se pudo guardar. Intentá de nuevo.'): string {
  if (!(error instanceof ApiError) || error.status < 400 || error.status >= 500) return fallback
  const known = SPANISH.find(([pattern]) => pattern.test(error.message))
  return known ? known[1] : error.message
}
