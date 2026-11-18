import { apiRequest } from '@/lib/api-client'
import type { BotProfile, ProducerConfig, UpdateBotProfileRequest, UpdateConfigRequest } from '@/types/api/config'

export const adminConfigService = {
  get: (token: string): Promise<ProducerConfig> => apiRequest<ProducerConfig>('/admin/config', { token }),

  update: (token: string, data: UpdateConfigRequest): Promise<ProducerConfig> =>
    apiRequest<ProducerConfig>('/admin/config', { method: 'PATCH', token, body: data }),

  getBotProfile: (token: string): Promise<BotProfile> => apiRequest<BotProfile>('/admin/config/profile', { token }),

  updateBotProfile: (token: string, data: UpdateBotProfileRequest): Promise<BotProfile> =>
    apiRequest<BotProfile>('/admin/config/profile', { method: 'PATCH', token, body: data }),

  /** `forPrincipal`: an Owner's own principal, whatever principal it has chosen. */
  uploadLogo: (token: string, file: File, forPrincipal?: number): Promise<{ logoUrl: string }> => {
    const body = new FormData()
    body.append('file', file)
    return apiRequest<{ logoUrl: string }>('/admin/config/logo', { method: 'POST', token, body, forPrincipal })
  },

  removeLogo: (token: string, forPrincipal?: number): Promise<{ logoUrl: null }> =>
    apiRequest<{ logoUrl: null }>('/admin/config/logo', { method: 'DELETE', token, forPrincipal }),
}
