import { apiRequest } from '@/lib/api-client'
import type { TriunfoAuthState } from '@/types/api/triunfo'

/** The office's Triunfo connection: whether it accepts the organization's credentials. */
export const triunfoService = {
  status: (token: string): Promise<TriunfoAuthState> =>
    apiRequest<TriunfoAuthState>('/admin/triunfo/status', { token }),
}
