import { apiRequest } from '@/lib/api-client'
import type { CreateZoneRequest, DeleteZoneResponse, UpdateZoneRequest, Zone } from '@/types/api/hierarchy'
import type {
  CreateOwnerRequest,
  CreateOwnerResponse,
  DemoteOwnerResponse,
  PlatformOwner,
  PlatformZone,
  UpdateOwnerRequest,
} from '@/types/api/platform'
import type { TwoFactorResetResponse } from '@/types/api/two-factor'

/** The Developer's "Owners y zonas" (`/platform/zones`, `/platform/owners`). Organizations: organizationsService. */
export const platformService = {
  zones: (token: string): Promise<PlatformZone[]> => apiRequest<PlatformZone[]>('/platform/zones', { token }),

  /** A zone created here has no Owner until one is given it. */
  createZone: (token: string, data: CreateZoneRequest): Promise<Zone> =>
    apiRequest<Zone>('/platform/zones', { method: 'POST', token, body: data }),

  updateZone: (token: string, id: number, data: UpdateZoneRequest): Promise<Zone> =>
    apiRequest<Zone>(`/platform/zones/${id}`, { method: 'PATCH', token, body: data }),

  /** Only an empty zone (409 otherwise). */
  removeZone: (token: string, id: number): Promise<DeleteZoneResponse> =>
    apiRequest<DeleteZoneResponse>(`/platform/zones/${id}`, { method: 'DELETE', token }),

  owners: (token: string): Promise<PlatformOwner[]> => apiRequest<PlatformOwner[]>('/platform/owners', { token }),

  /** Invites a new Owner or converts a SuperAdmin/Admin into one. */
  createOwner: (token: string, data: CreateOwnerRequest): Promise<CreateOwnerResponse> =>
    apiRequest<CreateOwnerResponse>('/platform/owners', { method: 'POST', token, body: data }),

  updateOwner: (token: string, id: number, data: UpdateOwnerRequest): Promise<PlatformOwner> =>
    apiRequest<PlatformOwner>(`/platform/owners/${id}`, { method: 'PATCH', token, body: data }),

  /** Back to SuperAdmin of its own principal (the account is not deleted). */
  demoteOwner: (token: string, id: number): Promise<DemoteOwnerResponse> =>
    apiRequest<DemoteOwnerResponse>(`/platform/owners/${id}`, { method: 'DELETE', token }),

  /** Mails the Owner a link to choose a new password (204). */
  sendOwnerPasswordSetup: (token: string, id: number): Promise<void> =>
    apiRequest<void>(`/platform/owners/${id}/password-setup`, { method: 'POST', token }),

  resetOwnerTwoFactor: (token: string, id: number): Promise<TwoFactorResetResponse> =>
    apiRequest<TwoFactorResetResponse>(`/platform/owners/${id}/2fa/reset`, { method: 'POST', token }),
}
