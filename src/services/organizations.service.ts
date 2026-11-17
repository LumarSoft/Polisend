import { apiRequest } from '@/lib/api-client'
import type {
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  CreateProducerCodeRequest,
  OrganizationDetail,
  OrganizationSummary,
  SetOrganizationPlanResponse,
  UpdateOrganizationRequest,
  UpdateOrganizationResponse,
  UpdateProducerCodeRequest,
} from '@/types/api/organizations'
import type { PrincipalCode } from '@/types/api/hierarchy'

export const organizationsService = {
  list: (token: string): Promise<OrganizationSummary[]> =>
    apiRequest<OrganizationSummary[]>('/platform/organizations', { token }),

  detail: (token: string, id: number): Promise<OrganizationDetail> =>
    apiRequest<OrganizationDetail>(`/platform/organizations/${id}`, { token }),

  uploadLogo: (token: string, id: number, file: File): Promise<{ logoUrl: string }> => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest<{ logoUrl: string }>(`/platform/organizations/${id}/logo`, { method: 'POST', token, body })
  },

  removeLogo: (token: string, id: number): Promise<{ logoUrl: null }> =>
    apiRequest<{ logoUrl: null }>(`/platform/organizations/${id}/logo`, { method: 'DELETE', token }),

  /** The first SuperAdmin, if `adminEmail` comes, is invited by a mailed link (`invitationSent`). */
  create: (token: string, data: CreateOrganizationRequest): Promise<CreateOrganizationResponse> =>
    apiRequest<CreateOrganizationResponse>('/platform/organizations', { method: 'POST', token, body: data }),

  /** Switches it on or off and moves it between zones. */
  update: (token: string, id: number, data: UpdateOrganizationRequest): Promise<UpdateOrganizationResponse> =>
    apiRequest<UpdateOrganizationResponse>(`/platform/organizations/${id}`, { method: 'PATCH', token, body: data }),

  setActive: (token: string, id: number, isActive: boolean): Promise<UpdateOrganizationResponse> =>
    apiRequest<UpdateOrganizationResponse>(`/platform/organizations/${id}`, {
      method: 'PATCH',
      token,
      body: { isActive },
    }),

  /** The plan the organization has with no number and its new numbers start on; null = automatic. */
  setPlan: (token: string, id: number, planId: number | null): Promise<SetOrganizationPlanResponse> =>
    apiRequest<SetOrganizationPlanResponse>(`/platform/organizations/${id}/plan`, {
      method: 'PATCH',
      token,
      body: { planId },
    }),

  /** Answers the plain code (no cartera counts): the detail's counts come from refetching it. */
  addCode: (token: string, id: number, data: CreateProducerCodeRequest): Promise<PrincipalCode> =>
    apiRequest<PrincipalCode>(`/platform/organizations/${id}/codes`, { method: 'POST', token, body: data }),

  updateCode: (token: string, id: number, codeId: number, data: UpdateProducerCodeRequest): Promise<PrincipalCode> =>
    apiRequest<PrincipalCode>(`/platform/organizations/${id}/codes/${codeId}`, {
      method: 'PATCH',
      token,
      body: data,
    }),
}
