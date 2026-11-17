import { apiRequest } from '@/lib/api-client'
import type {
  TwoFactorDisableRequest,
  TwoFactorDisableResponse,
  TwoFactorEnableRequest,
  TwoFactorEnableResponse,
  TwoFactorSetupResponse,
} from '@/types/api/two-factor'

/**
 * The logged-in user's own two-step verification (Configuración → Mi cuenta). Resetting someone else's lives with
 * whoever manages the account: `hierarchyService.resetTwoFactor` and `platformService.resetOwnerTwoFactor`.
 */
export const twoFactorService = {
  /** A new secret, not on yet; calling it again replaces one that was never confirmed. */
  setup: (token: string): Promise<TwoFactorSetupResponse> =>
    apiRequest<TwoFactorSetupResponse>('/auth/2fa/setup', { method: 'POST', token }),

  enable: (token: string, data: TwoFactorEnableRequest): Promise<TwoFactorEnableResponse> =>
    apiRequest<TwoFactorEnableResponse>('/auth/2fa/enable', { method: 'POST', token, body: data }),

  disable: (token: string, data: TwoFactorDisableRequest): Promise<TwoFactorDisableResponse> =>
    apiRequest<TwoFactorDisableResponse>('/auth/2fa/disable', { method: 'POST', token, body: data }),
}
