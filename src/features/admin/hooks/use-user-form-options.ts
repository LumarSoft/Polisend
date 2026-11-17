import { principalsOfTree, zonesOfTree } from '../lib/network-users'
import { useNetworkTree } from './use-hierarchy'

/**
 * What the user form chooses from: the caller's principals with their codes and accounts, and the zones a new
 * principal can go to (both from `GET /hierarchy/tree`). The Developer gets every principal of the platform.
 */
export function useUserFormOptions(enabled = true) {
  const tree = useNetworkTree(enabled)
  return {
    principals: principalsOfTree(tree.data),
    zones: zonesOfTree(tree.data),
    isLoading: tree.isLoading,
    isError: tree.isError,
  }
}
