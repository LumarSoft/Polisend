import { apiRequest } from '@/lib/api-client'
import type {
  CodeTriunfoCredentialStatus,
  SaveCodeTriunfoCredentialRequest,
  SaveTriunfoCredentialRequest,
  SaveTriunfoWsCredentialRequest,
  TriunfoAuthState,
  TriunfoCredentialStatus,
  TriunfoWsCredentialStatus,
} from '@/types/api/triunfo'

/** The office's Triunfo connection: whether it accepts the organization's credentials, and its own access. */
export const triunfoService = {
  status: (token: string): Promise<TriunfoAuthState> =>
    apiRequest<TriunfoAuthState>('/admin/triunfo/status', { token }),

  /** SUPERADMIN: the access of its own organization (never the password). */
  credential: (token: string): Promise<TriunfoCredentialStatus> =>
    apiRequest<TriunfoCredentialStatus>('/admin/triunfo/credential', { token }),

  saveCredential: (token: string, data: SaveTriunfoCredentialRequest): Promise<TriunfoCredentialStatus> =>
    apiRequest<TriunfoCredentialStatus>('/admin/triunfo/credential', { method: 'PUT', token, body: data }),

  /** The productor codes the user reaches, each with its own TriunfoNet user if it has one. */
  codes: (token: string): Promise<CodeTriunfoCredentialStatus[]> =>
    apiRequest<CodeTriunfoCredentialStatus[]>('/admin/triunfo/codes', { token }),

  saveCodeCredential: (
    token: string,
    producerCodeId: number,
    data: SaveCodeTriunfoCredentialRequest,
  ): Promise<CodeTriunfoCredentialStatus> =>
    apiRequest<CodeTriunfoCredentialStatus>(`/admin/triunfo/codes/${producerCodeId}/credential`, {
      method: 'PUT',
      token,
      body: data,
    }),

  removeCodeCredential: (token: string, producerCodeId: number): Promise<CodeTriunfoCredentialStatus> =>
    apiRequest<CodeTriunfoCredentialStatus>(`/admin/triunfo/codes/${producerCodeId}/credential`, {
      method: 'DELETE',
      token,
    }),

  /** OWNER: its web-service user, network-wide (not tied to the acting principal). */
  wsCredential: (token: string): Promise<TriunfoWsCredentialStatus> =>
    apiRequest<TriunfoWsCredentialStatus>('/hierarchy/triunfo-ws', { token }),

  saveWsCredential: (token: string, data: SaveTriunfoWsCredentialRequest): Promise<TriunfoWsCredentialStatus> =>
    apiRequest<TriunfoWsCredentialStatus>('/hierarchy/triunfo-ws', { method: 'PUT', token, body: data }),
}
