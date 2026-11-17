import { useNetworkUserActions } from './use-hierarchy'
import { usePlatformOwnerActions } from './use-platform-structure'

/**
 * Whose account: 'network' = a SuperAdmin or Admin (`/hierarchy/users/:id/…`, called by its SuperAdmin, its Owner or
 * the Developer), 'owner' = an Owner (`/platform/owners/:id/…`, Developer only).
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

/** The mutation behind an access action of Usuarios (`network`) or Owners y zonas (`owner`). */
export function useAccountAccess(scope: AccountAccessScope, action: AccountAccessAction) {
  const network = useNetworkUserActions()
  const owners = usePlatformOwnerActions()
  const actions = scope === 'owner' ? owners : network
  return action === 'password-setup' ? actions.sendPasswordSetup : actions.resetTwoFactor
}
