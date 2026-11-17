import { apiRequest } from '@/lib/api-client'
import type { SaveTriunfoCredentialRequest, TriunfoCredentialStatus, TriunfoErrorRow } from '@/types/api/triunfo'

/** DEVELOPER: each organization's own Triunfo web-service access. */
export const platformTriunfoService = {
  status: (token: string, organizationId: number): Promise<TriunfoCredentialStatus> =>
    apiRequest<TriunfoCredentialStatus>(`/platform/organizations/${organizationId}/triunfo`, { token }),

  save: (token: string, organizationId: number, data: SaveTriunfoCredentialRequest): Promise<TriunfoCredentialStatus> =>
    apiRequest<TriunfoCredentialStatus>(`/platform/organizations/${organizationId}/triunfo`, {
      method: 'PUT',
      token,
      body: data,
    }),

  remove: (token: string, organizationId: number): Promise<TriunfoCredentialStatus> =>
    apiRequest<TriunfoCredentialStatus>(`/platform/organizations/${organizationId}/triunfo`, {
      method: 'DELETE',
      token,
    }),

  setQuoteFallback: (token: string, organizationId: number, enabled: boolean): Promise<TriunfoCredentialStatus> =>
    apiRequest<TriunfoCredentialStatus>(`/platform/organizations/${organizationId}/triunfo/quote-fallback`, {
      method: 'PUT',
      token,
      body: { enabled },
    }),

  errors: (token: string, organizationId: number): Promise<TriunfoErrorRow[]> =>
    apiRequest<TriunfoErrorRow[]>(`/platform/organizations/${organizationId}/triunfo/errors`, { token }),
}
