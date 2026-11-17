import { ApiError } from '@/lib/api-client'
import { useNetworkUserActions } from './use-hierarchy'
import { usePlatformOwnerActions } from './use-platform-structure'

/**
 * Whose account: 'network' = a SuperAdmin or Admin (`/hierarchy/users/:id/…`, called by its Owner or SuperAdmin; the
 * Developer may send a link but never resets 2FA), 'owner' = an Owner (`/platform/owners/:id/…`, Developer only).
 */
export type AccountAccessScope = 'network' | 'owner'

/** «Mandar enlace para elegir contraseña» or «Reiniciar verificación en dos pasos». */
export type AccountAccessAction = 'password-setup' | 'reset-two-factor'

/** The account the action is about, as Usuarios and Owners list it. */
export interface AccountAccessTarget {
  id: number
  email: string
  name?: string | null
}

/** The Spanish message for a refused access action (the API's own when it wrote one for the person). */
export function accountAccessErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'No se pudo completar. Intentá de nuevo.'
  // PLATFORM_CANNOT_RESET_TWO_FACTOR and the other platform restrictions carry a Spanish message, as does the refusal
  // to reset one's own 2FA ("No podés reiniciar tu propia verificación…").
  if (error.code?.startsWith('PLATFORM_CANNOT_') || error.message.startsWith('No podés')) return error.message
  if (error.status === 403) return 'No tenés permiso para hacer esto con esa cuenta.'
  if (error.status === 404) return 'Esa cuenta ya no está disponible. Actualizá la lista.'
  return 'No se pudo completar. Intentá de nuevo.'
}

/** The mutation behind an access action of Usuarios (`network`) or Owners y zonas (`owner`). */
export function useAccountAccess(scope: AccountAccessScope, action: AccountAccessAction) {
  const network = useNetworkUserActions()
  const owners = usePlatformOwnerActions()
  const actions = scope === 'owner' ? owners : network
  return action === 'password-setup' ? actions.sendPasswordSetup : actions.resetTwoFactor
}
