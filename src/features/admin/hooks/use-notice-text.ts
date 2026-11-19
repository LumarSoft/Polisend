import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { noticeTextsService } from '@/services/notice-texts.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { NoticeText, NoticeTextKind, NoticeTextScope, UpdateNoticeTextRequest } from '@/types/api/notice-texts'
import { useAuth } from '../context/auth-context'

/** While Meta reviews the text, the editor asks again every minute. */
const PENDING_REFRESH_MS = 60_000

/** The list that shows the notice as the client reads it. */
const listOf = (kind: NoticeTextKind) =>
  kind === 'payment_rejection' ? QUERY_KEYS.admin.rejectionsAll : QUERY_KEYS.admin.expiredPoliciesAll

/**
 * The text of a notice for a scope (the general one or a number's) and Meta's review of it; loads only while the
 * editor is open. When a refresh finds that a number sends another text now (Meta approved or rejected it), the list's
 * preview refreshes too.
 */
export function useNoticeText(kind: NoticeTextKind, scope: NoticeTextScope, enabled: boolean) {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEYS.admin.noticeText(kind, scope),
    queryFn: () => noticeTextsService.get(token as string, kind, scope),
    enabled: !!token && enabled,
    refetchInterval: query =>
      query.state.data?.accounts.some(a => a.status === 'PENDING' || a.status === 'NOT_SUBMITTED')
        ? PENDING_REFRESH_MS
        : false,
  })

  const sending = query.data?.accounts.map(a => `${a.id}:${a.sending}`).join(',')
  const lastSending = useRef(sending)
  useEffect(() => {
    if (sending === undefined) return
    if (lastSending.current !== undefined && lastSending.current !== sending) {
      void queryClient.invalidateQueries({ queryKey: listOf(kind) })
    }
    lastSending.current = sending
  }, [sending, kind, queryClient])

  return query
}

/**
 * Save the scope's text (it goes to Meta's review), drop it, or ask Meta again. The other scopes' views (their
 * "has its own" marks, what a number falls back to) and the lists that show the notice as the client reads it refresh
 * after each.
 */
export function useNoticeTextActions(kind: NoticeTextKind, scope: NoticeTextScope) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const settle = (view: NoticeText) => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'notice-texts', kind] })
    queryClient.setQueryData(QUERY_KEYS.admin.noticeText(kind, scope), view)
    void queryClient.invalidateQueries({ queryKey: listOf(kind) })
  }

  const save = useMutation({
    mutationFn: (data: UpdateNoticeTextRequest) => noticeTextsService.update(token as string, kind, data),
    onSuccess: settle,
  })

  const reset = useMutation({
    mutationFn: (numberId: number | null) => noticeTextsService.reset(token as string, kind, numberId),
    onSuccess: settle,
  })

  // Meta may have approved it meanwhile: the lists then show the new text.
  const refresh = useMutation({
    mutationFn: () => noticeTextsService.refresh(token as string, kind, scope),
    onSuccess: settle,
  })

  return { save, reset, refresh }
}
