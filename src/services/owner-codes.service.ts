import { apiRequest } from '@/lib/api-client'
import type { CodeSummary, CodeTree } from '@/types/api/codes'

/** OWNER: which Triunfo codes depend on which, across every organization. */
export const ownerCodesService = {
  list: (token: string): Promise<CodeSummary[]> => apiRequest<CodeSummary[]>('/owner/codes', { token }),

  tree: (token: string, code: string): Promise<CodeTree> =>
    apiRequest<CodeTree>(`/owner/codes/${encodeURIComponent(code)}`, { token }),
}
