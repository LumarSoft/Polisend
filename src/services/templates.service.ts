import { apiRequest } from '@/lib/api-client'
import type { TemplatesOverviewResponse } from '@/types/api/templates'

export const templatesService = {
  /** Every organization's WhatsApp accounts with their Meta templates (Developer). */
  overview(token: string): Promise<TemplatesOverviewResponse> {
    return apiRequest<TemplatesOverviewResponse>('/platform/templates', { token })
  },
}
