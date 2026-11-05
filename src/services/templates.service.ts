import { apiRequest } from '@/lib/api-client'
import type { TemplatesOverviewResponse } from '@/types/api/templates'

export const templatesService = {
  /** Every organization's WhatsApp accounts with their Meta templates (owner). */
  overview(token: string): Promise<TemplatesOverviewResponse> {
    return apiRequest<TemplatesOverviewResponse>('/owner/templates', { token })
  },
}
