import { apiRequest } from '@/lib/api-client'
import type {
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  PasswordResetResponse,
} from '@/types/api/password-reset'

/**
 * The public page /admin/recuperar: no session, so no Authorization and no X-Acting-Principal. Neither the e-mail nor
 * the code is ever stored or put in a URL.
 */
export const passwordResetService = {
  /** 202 always: the answer never says whether the e-mail has an account. */
  request: (data: PasswordResetRequest): Promise<PasswordResetResponse> =>
    apiRequest<PasswordResetResponse>('/auth/password-reset/request', { method: 'POST', body: data }),

  /**
   * 200: the password is set and every older session of the account ended. 400 PASSWORD_RESET_INVALID otherwise; 429
   * when this connection sent too many.
   */
  confirm: (data: PasswordResetConfirmRequest): Promise<PasswordResetResponse> =>
    apiRequest<PasswordResetResponse>('/auth/password-reset/confirm', { method: 'POST', body: data }),
}
