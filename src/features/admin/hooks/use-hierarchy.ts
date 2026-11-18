import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'
import { hierarchyService } from '@/services/hierarchy.service'
import type {
  CreateNetworkUserRequest,
  CreatePrincipalCodeRequest,
  CreatePrincipalRequest,
  CreateZoneRequest,
  NetworkUsersQuery,
  RestoreNetworkUserRequest,
  UpdateNetworkUserRequest,
  UpdatePrincipalCodeRequest,
  UpdatePrincipalRequest,
  UpdateZoneRequest,
} from '@/types/api/hierarchy'
import { useActingPrincipal } from '../context/acting-principal-context'
import { useAuth } from '../context/auth-context'

/**
 * The network (`/hierarchy/*`) for the Developer, the Owner and the SuperAdmin. None of these follows the acting
 * principal: they list or touch every principal the caller reaches. Pass `enabled: false` where the role cannot call
 * them (an Admin gets 403 on all; a SuperAdmin on usage, zones and principals).
 */

/** The principals the caller reaches with their codes (the cascading filter's list, in "network" mode). */
export function useHierarchyPrincipals(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.hierarchy.principals,
    queryFn: () => hierarchyService.principals(token as string),
    enabled: !!token && enabled,
  })
}

/** "Mi red": zones → principals → codes with their counters. */
export function useNetworkTree(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.hierarchy.tree,
    queryFn: () => hierarchyService.tree(token as string),
    enabled: !!token && enabled,
  })
}

/** "Consumo de la red" (Owner, Developer): message counts of a month (default: the running one). */
export function useNetworkUsage(period?: string, enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.hierarchy.usage(period),
    queryFn: () => hierarchyService.usage(token as string, period),
    enabled: !!token && enabled,
    placeholderData: keepPreviousData,
  })
}

/** The SuperAdmins and Admins of the principals the caller reaches. */
export function useNetworkUsers(query: NetworkUsersQuery = {}, enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.hierarchy.users(query),
    queryFn: () => hierarchyService.users(token as string, query),
    enabled: !!token && enabled,
    placeholderData: keepPreviousData,
  })
}

/**
 * Refreshes everything that shows the network after a change: this principal's cache and the cascading filter's list,
 * which the acting-principal provider keeps outside it.
 */
export function useRefreshNetwork(): () => void {
  const queryClient = useQueryClient()
  const { refreshPrincipals } = useActingPrincipal()
  return () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy.all })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platform.organizations })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platform.zones })
    void refreshPrincipals()
  }
}

/** Zones of the caller (Owner: its own; Developer: any). */
export function useZoneActions() {
  const { token } = useAuth()
  const refresh = useRefreshNetwork()
  return {
    createZone: useMutation({
      mutationFn: (data: CreateZoneRequest) => hierarchyService.createZone(token as string, data),
      onSuccess: refresh,
    }),
    updateZone: useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdateZoneRequest }) =>
        hierarchyService.updateZone(token as string, id, data),
      onSuccess: refresh,
    }),
    removeZone: useMutation({
      mutationFn: (id: number) => hierarchyService.removeZone(token as string, id),
      onSuccess: refresh,
    }),
  }
}

/** Principals (Owner in its zones, Developer anywhere). */
export function usePrincipalActions() {
  const { token } = useAuth()
  const refresh = useRefreshNetwork()
  return {
    createPrincipal: useMutation({
      mutationFn: (data: CreatePrincipalRequest) => hierarchyService.createPrincipal(token as string, data),
      onSuccess: refresh,
    }),
    updatePrincipal: useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdatePrincipalRequest }) =>
        hierarchyService.updatePrincipal(token as string, id, data),
      onSuccess: refresh,
    }),
  }
}

/** The single place where producer codes are created and edited (Developer, Owner, SuperAdmin). */
export function usePrincipalCodeActions() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const refreshNetwork = useRefreshNetwork()
  const refresh = () => {
    refreshNetwork()
    // The principal's own code lists (scope filter, user form) read /users/producer-codes.
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.producerCodes })
  }
  return {
    createCode: useMutation({
      mutationFn: ({ principalId, data }: { principalId: number; data: CreatePrincipalCodeRequest }) =>
        hierarchyService.createCode(token as string, principalId, data),
      onSuccess: refresh,
    }),
    updateCode: useMutation({
      mutationFn: ({
        principalId,
        codeId,
        data,
      }: {
        principalId: number
        codeId: number
        data: UpdatePrincipalCodeRequest
      }) => hierarchyService.updateCode(token as string, principalId, codeId, data),
      onSuccess: refresh,
    }),
    createGroup: useMutation({
      mutationFn: ({ principalId, name }: { principalId: number; name: string }) =>
        hierarchyService.createGroup(token as string, principalId, { name }),
      onSuccess: refreshNetwork,
    }),
    renameGroup: useMutation({
      mutationFn: ({ principalId, groupId, name }: { principalId: number; groupId: number; name: string }) =>
        hierarchyService.renameGroup(token as string, principalId, groupId, { name }),
      onSuccess: refreshNetwork,
    }),
    mergeGroup: useMutation({
      mutationFn: ({
        principalId,
        groupId,
        intoGroupId,
      }: {
        principalId: number
        groupId: number
        intoGroupId: number
      }) => hierarchyService.mergeGroup(token as string, principalId, groupId, intoGroupId),
      onSuccess: refreshNetwork,
    }),
    removeGroup: useMutation({
      mutationFn: ({ principalId, groupId }: { principalId: number; groupId: number }) =>
        hierarchyService.removeGroup(token as string, principalId, groupId),
      onSuccess: refreshNetwork,
    }),
  }
}

/** Users of the network: create (with a new principal, for Owner/Developer), edit, delete, restore, links, 2FA reset. */
export function useNetworkUserActions() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const refreshNetwork = useRefreshNetwork()
  const refreshUsers = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy.usersAll })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy.tree })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users })
    // The Developer's Organizaciones (list and detail) count each principal's SuperAdmins and Admins.
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platform.organizations })
  }
  return {
    /** A `newPrincipal` also creates a principal: the whole network refreshes. */
    createUser: useMutation({
      mutationFn: (data: CreateNetworkUserRequest) => hierarchyService.createUser(token as string, data),
      onSuccess: (_user, data) => (data.newPrincipal ? refreshNetwork() : refreshUsers()),
    }),
    updateUser: useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdateNetworkUserRequest }) =>
        hierarchyService.updateUser(token as string, id, data),
      onSuccess: refreshUsers,
    }),
    removeUser: useMutation({
      mutationFn: (id: number) => hierarchyService.removeUser(token as string, id),
      onSuccess: refreshUsers,
    }),
    restoreUser: useMutation({
      mutationFn: ({ id, data }: { id: number; data: RestoreNetworkUserRequest }) =>
        hierarchyService.restoreUser(token as string, id, data),
      onSuccess: refreshUsers,
    }),
    sendPasswordSetup: useMutation({
      mutationFn: (id: number) => hierarchyService.sendPasswordSetup(token as string, id),
    }),
    resetTwoFactor: useMutation({
      mutationFn: (id: number) => hierarchyService.resetTwoFactor(token as string, id),
      onSuccess: refreshUsers,
    }),
  }
}
