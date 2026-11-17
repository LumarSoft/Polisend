import { apiRequest } from '@/lib/api-client'
import type { PasswordSetupInfo, PasswordSetupRequest } from '@/types/api/password-setup'

/**
 * The public page /admin/activar: no session, so no Authorization and no X-Acting-Principal. Never store the token.
 * A dead link is a 410 with code PASSWORD_SETUP_INVALID on either call.
 */
export const passwordSetupService = {
  info: (token: string): Promise<PasswordSetupInfo> =>
    apiRequest<PasswordSetupInfo>(`/auth/password-setup/${encodeURIComponent(token)}`),

  /** 204: the password is set, the link spent and every older session of the account ended. */
  complete: (data: PasswordSetupRequest): Promise<void> =>
    apiRequest<void>('/auth/password-setup', { method: 'POST', body: data }),
}
