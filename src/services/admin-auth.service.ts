import {
  ActingPrincipalMismatchError,
  apiRequest,
  apiRequestReportingPrincipal,
  reportActingPrincipalInvalid,
} from '@/lib/api-client'
import type {
  AdminUser,
  LoginRequest,
  LoginResponse,
  LoginSession,
  LoginTwoFactorRequest,
  UpdateProfileRequest,
} from '@/types/api/auth'

export const adminAuthService = {
  /** A session, or the two-step challenge when the account has it on (see `isTwoFactorChallenge`). */
  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: data }),

  /** Second step of a login with two-step verification. */
  loginTwoFactor: (data: LoginTwoFactorRequest): Promise<LoginSession> =>
    apiRequest<LoginSession>('/auth/login/2fa', { method: 'POST', body: data }),

  /**
   * The account and, for an Owner, the acting principal it sent. A refused principal is not a 403 here: the API
   * answers the Owner's own principal with `actingInvalid`, and the panel falls back to it.
   */
  getProfile: async (token: string): Promise<AdminUser> => {
    const { data, actingPrincipalId } = await apiRequestReportingPrincipal<AdminUser>('/users/me', { token })
    if (actingPrincipalId !== null) {
      if (data.actingInvalid) reportActingPrincipalInvalid(actingPrincipalId)
      else if (data.actingProducerId !== actingPrincipalId) {
        throw new ActingPrincipalMismatchError(actingPrincipalId, String(data.actingProducerId ?? ''))
      }
    }
    return data
  },

  updateProfile: (token: string, data: UpdateProfileRequest): Promise<AdminUser> =>
    apiRequest<AdminUser>('/users/me', { method: 'PATCH', token, body: data }),
}
