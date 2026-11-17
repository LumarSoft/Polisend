import { apiRequest } from '@/lib/api-client'
import type { CreateRejectionImportRequest, RejectionImport, RejectionImportList } from '@/types/api/rejections'

export const rejectionsService = {
  list(token: string): Promise<RejectionImportList> {
    return apiRequest<RejectionImportList>('/admin/rejections', { token })
  },

  detail(token: string, id: number): Promise<RejectionImport> {
    return apiRequest<RejectionImport>(`/admin/rejections/${id}`, { token })
  },

  /** `startedIn`: the acting principal the upload began in; nothing is sent if the Owner left it meanwhile. */
  create(token: string, data: CreateRejectionImportRequest, startedIn?: number | null): Promise<RejectionImport> {
    return apiRequest<RejectionImport>('/admin/rejections', { method: 'POST', token, body: data, startedIn })
  },

  send(token: string, id: number, ids: number[]): Promise<RejectionImport> {
    return apiRequest<RejectionImport>(`/admin/rejections/${id}/send`, { method: 'POST', token, body: { ids } })
  },

  mark(token: string, id: number, ids: number[]): Promise<RejectionImport> {
    return apiRequest<RejectionImport>(`/admin/rejections/${id}/mark`, { method: 'POST', token, body: { ids } })
  },

  remove(token: string, id: number): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>(`/admin/rejections/${id}`, { method: 'DELETE', token })
  },
}
