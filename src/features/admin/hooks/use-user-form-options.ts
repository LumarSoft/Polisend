import { principalsOfTree, zonesOfTree, type FormPrincipal } from '../lib/network-users'
import { useNetworkTree } from './use-hierarchy'
import { usePlatformOwners } from './use-platform-structure'
import { useRole } from './use-role'

/**
 * What the user form chooses from: the caller's principals with their codes and accounts, and the zones a new
 * principal can go to (both from `GET /hierarchy/tree`). For the Developer, also which principals are an Owner's own:
 * the platform only invites the first account of a principal that has nobody and is no Owner's own.
 */
export function useUserFormOptions(enabled = true) {
  const { isDeveloper } = useRole()
  const tree = useNetworkTree(enabled)
  const owners = usePlatformOwners(enabled && isDeveloper)
  const ownerHomes = new Set((owners.data ?? []).map(owner => owner.home.id))

  /** Whether the platform may create an account in it (PLATFORM_CANNOT_ADD_USERS_HERE otherwise). */
  const platformMayAddTo = (principal: FormPrincipal): boolean =>
    principal.accounts === 0 && !ownerHomes.has(principal.id)

  return {
    principals: principalsOfTree(tree.data),
    zones: zonesOfTree(tree.data),
    isLoading: tree.isLoading || (isDeveloper && owners.isLoading),
    isError: tree.isError,
    platformMayAddTo,
  }
}
