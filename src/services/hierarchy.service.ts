import { apiRequest } from '@/lib/api-client'
import { queryString } from '@/lib/query-string'
import type {
  CreateNetworkUserRequest,
  CreateNetworkUserResponse,
  CreatePrincipalCodeRequest,
  CreatePrincipalRequest,
  CreateZoneRequest,
  DeleteNetworkUserResponse,
  DeleteZoneResponse,
  HierarchyPrincipal,
  NetworkTree,
  NetworkUsage,
  NetworkUser,
  NetworkUserRow,
  NetworkUsersQuery,
  PrincipalCode,
  RestoreNetworkUserRequest,
  RestoreNetworkUserResponse,
  UpdateNetworkUserRequest,
  UpdatePrincipalCodeRequest,
  UpdatePrincipalRequest,
  UpdatePrincipalResponse,
  UpdateZoneRequest,
  Zone,
} from '@/types/api/hierarchy'
import type { TwoFactorResetResponse } from '@/types/api/two-factor'

/**
 * The network under `/hierarchy/*` (Developer, Owner, SuperAdmin): structure, users and the network's consumption.
 * Not tied to the acting principal: each route checks the principal or zone it touches.
 */
export const hierarchyService = {
  /** The cascading filter's data: the principals the caller reaches, each with its active codes. */
  principals: (token: string): Promise<HierarchyPrincipal[]> =>
    apiRequest<HierarchyPrincipal[]>('/hierarchy/principals', { token }),

  /** "Mi red": zones → principals → codes, with counters (no amounts). */
  tree: (token: string): Promise<NetworkTree> => apiRequest<NetworkTree>('/hierarchy/tree', { token }),

  /** "Consumo de la red" (Owner, Developer): message counts by zone → principal → number. */
  usage: (token: string, period?: string): Promise<NetworkUsage> =>
    apiRequest<NetworkUsage>(`/hierarchy/usage${queryString({ period })}`, { token }),

  createZone: (token: string, data: CreateZoneRequest): Promise<Zone> =>
    apiRequest<Zone>('/hierarchy/zones', { method: 'POST', token, body: data }),

  updateZone: (token: string, id: number, data: UpdateZoneRequest): Promise<Zone> =>
    apiRequest<Zone>(`/hierarchy/zones/${id}`, { method: 'PATCH', token, body: data }),

  /** Only an empty zone (409 otherwise). */
  removeZone: (token: string, id: number): Promise<DeleteZoneResponse> =>
    apiRequest<DeleteZoneResponse>(`/hierarchy/zones/${id}`, { method: 'DELETE', token }),

  createPrincipal: (token: string, data: CreatePrincipalRequest): Promise<HierarchyPrincipal> =>
    apiRequest<HierarchyPrincipal>('/hierarchy/principals', { method: 'POST', token, body: data }),

  updatePrincipal: (token: string, id: number, data: UpdatePrincipalRequest): Promise<UpdatePrincipalResponse> =>
    apiRequest<UpdatePrincipalResponse>(`/hierarchy/principals/${id}`, { method: 'PATCH', token, body: data }),

  /** The single place where producer codes are created. */
  createCode: (token: string, principalId: number, data: CreatePrincipalCodeRequest): Promise<PrincipalCode> =>
    apiRequest<PrincipalCode>(`/hierarchy/principals/${principalId}/codes`, { method: 'POST', token, body: data }),

  /** The single place where producer codes are edited. */
  updateCode: (
    token: string,
    principalId: number,
    codeId: number,
    data: UpdatePrincipalCodeRequest,
  ): Promise<PrincipalCode> =>
    apiRequest<PrincipalCode>(`/hierarchy/principals/${principalId}/codes/${codeId}`, {
      method: 'PATCH',
      token,
      body: data,
    }),

  /** An Owner also gets read-only rows (`readOnly: true`): Lumarsoft's accounts and the Owners of its zones. */
  users: (token: string, query: NetworkUsersQuery = {}): Promise<NetworkUserRow[]> =>
    apiRequest<NetworkUserRow[]>(`/hierarchy/users${queryString({ ...query })}`, { token }),

  /** 409 with code EMAIL_RESTORABLE (`restorableUserId` in the ApiError's body) offers `restoreUser`. */
  createUser: (token: string, data: CreateNetworkUserRequest): Promise<CreateNetworkUserResponse> =>
    apiRequest<CreateNetworkUserResponse>('/hierarchy/users', { method: 'POST', token, body: data }),

  updateUser: (token: string, id: number, data: UpdateNetworkUserRequest): Promise<NetworkUser> =>
    apiRequest<NetworkUser>(`/hierarchy/users/${id}`, { method: 'PATCH', token, body: data }),

  removeUser: (token: string, id: number): Promise<DeleteNetworkUserResponse> =>
    apiRequest<DeleteNetworkUserResponse>(`/hierarchy/users/${id}`, { method: 'DELETE', token }),

  /** Without a password the API mails the account a link to choose one (`invitationSent`). */
  restoreUser: (token: string, id: number, data: RestoreNetworkUserRequest): Promise<RestoreNetworkUserResponse> =>
    apiRequest<RestoreNetworkUserResponse>(`/hierarchy/users/${id}/restore`, { method: 'POST', token, body: data }),

  /** Mails the account a link to choose a new password (204; the link never comes back). */
  sendPasswordSetup: (token: string, id: number): Promise<void> =>
    apiRequest<void>(`/hierarchy/users/${id}/password-setup`, { method: 'POST', token }),

  /** Lost phone: the account's next login asks only for the password. */
  resetTwoFactor: (token: string, id: number): Promise<TwoFactorResetResponse> =>
    apiRequest<TwoFactorResetResponse>(`/hierarchy/users/${id}/2fa/reset`, { method: 'POST', token }),
}
