import {
  ActingPrincipalMismatchError,
  apiRequest,
  apiRequestReportingPrincipal,
  reportActingPrincipalInvalid,
  reportSupportUserInvalid,
} from '@/lib/api-client'
import { isOwnerRole } from '@/features/admin/lib/roles'
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
   * answers the Owner's own principal with `actingInvalid`, and the panel falls back to it. An account that is no
   * longer an Owner (the Developer took it back to SuperAdmin) is taken as it is: the API ignores the principal it
   * sent, and this profile is what makes the panel stop sending one.
   */
  getProfile: async (token: string, forPrincipal?: number): Promise<AdminUser> => {
    const { data, actingPrincipalId } = await apiRequestReportingPrincipal<AdminUser>('/users/me', {
      token,
      forPrincipal,
    })
    // The user an Owner was giving support to can no longer be helped: the panel leaves support (SupportProvider).
    if (data.supportInvalid) reportSupportUserInvalid()
    if (actingPrincipalId !== null && isOwnerRole(data.role)) {
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
