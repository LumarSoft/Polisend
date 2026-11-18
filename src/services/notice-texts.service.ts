import { apiRequest } from '@/lib/api-client'
import type { NoticeText, NoticeTextKind, UpdateNoticeTextRequest } from '@/types/api/notice-texts'

export const noticeTextsService = {
  get(token: string, kind: NoticeTextKind): Promise<NoticeText> {
    return apiRequest<NoticeText>(`/admin/notice-texts/${kind}`, { token })
  },

  /** Asks Meta again how the review is going, without the API's few minutes of cache. */
  refresh(token: string, kind: NoticeTextKind): Promise<NoticeText> {
    return apiRequest<NoticeText>(`/admin/notice-texts/${kind}/refresh`, { method: 'POST', token })
  },

  /** Keeps the organization's text and sends it to Meta's review (SuperAdmin). */
  update(token: string, kind: NoticeTextKind, data: UpdateNoticeTextRequest): Promise<NoticeText> {
    return apiRequest<NoticeText>(`/admin/notice-texts/${kind}`, { method: 'PUT', token, body: data })
  },

  /** Back to the platform's text (SuperAdmin). */
  reset(token: string, kind: NoticeTextKind): Promise<NoticeText> {
    return apiRequest<NoticeText>(`/admin/notice-texts/${kind}`, { method: 'DELETE', token })
  },
}
