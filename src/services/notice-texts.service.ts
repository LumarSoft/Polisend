import { apiRequest } from '@/lib/api-client'
import type { NoticeText, NoticeTextKind, NoticeTextScope, UpdateNoticeTextRequest } from '@/types/api/notice-texts'

/** The query that names the scope: a number, the general text, or nothing (the user's default). */
function scopeQuery(scope: NoticeTextScope): string {
  if (scope === null) return '?general=true'
  return scope === undefined ? '' : `?phoneNumberId=${scope}`
}

export const noticeTextsService = {
  get(token: string, kind: NoticeTextKind, scope: NoticeTextScope): Promise<NoticeText> {
    return apiRequest<NoticeText>(`/admin/notice-texts/${kind}${scopeQuery(scope)}`, { token })
  },

  /** Asks Meta again how the review is going, without the API's few minutes of cache. */
  refresh(token: string, kind: NoticeTextKind, scope: NoticeTextScope): Promise<NoticeText> {
    return apiRequest<NoticeText>(`/admin/notice-texts/${kind}/refresh${scopeQuery(scope)}`, { method: 'POST', token })
  },

  /** Keeps the scope's text and sends it to Meta's review (the general one: SuperAdmin; a number's: its admin too). */
  update(token: string, kind: NoticeTextKind, data: UpdateNoticeTextRequest): Promise<NoticeText> {
    return apiRequest<NoticeText>(`/admin/notice-texts/${kind}`, { method: 'PUT', token, body: data })
  },

  /** Drops the scope's text: a number goes back to the general one, the general one to the platform's. */
  reset(token: string, kind: NoticeTextKind, numberId: number | null): Promise<NoticeText> {
    const query = numberId === null ? '' : `?phoneNumberId=${numberId}`
    return apiRequest<NoticeText>(`/admin/notice-texts/${kind}${query}`, { method: 'DELETE', token })
  },
}
