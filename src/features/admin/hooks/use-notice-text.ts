import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { noticeTextsService } from '@/services/notice-texts.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { NoticeText, NoticeTextKind, UpdateNoticeTextRequest } from '@/types/api/notice-texts'
import { useAuth } from '../context/auth-context'

/** While Meta reviews the text, the editor asks again every minute. */
const PENDING_REFRESH_MS = 60_000

/** The organization's text of a notice and Meta's review of it; loads only while the editor is open. */
export function useNoticeText(kind: NoticeTextKind, enabled: boolean) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.admin.noticeText(kind),
    queryFn: () => noticeTextsService.get(token as string, kind),
    enabled: !!token && enabled,
    refetchInterval: query =>
      query.state.data?.accounts.some(a => a.status === 'PENDING' || a.status === 'NOT_SUBMITTED')
        ? PENDING_REFRESH_MS
        : false,
  })
}

/**
 * Save the text (it goes to Meta's review), go back to the platform's, or ask Meta again. The lists that show the
 * notice as the client reads it (Rechazos, Pólizas vencidas) refresh after each.
 */
export function useNoticeTextActions(kind: NoticeTextKind) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const settle = (view: NoticeText) => {
    queryClient.setQueryData(QUERY_KEYS.admin.noticeText(kind), view)
    void queryClient.invalidateQueries({
      queryKey: kind === 'payment_rejection' ? QUERY_KEYS.admin.rejectionsAll : QUERY_KEYS.admin.expiredPoliciesAll,
    })
  }

  const save = useMutation({
    mutationFn: (data: UpdateNoticeTextRequest) => noticeTextsService.update(token as string, kind, data),
    onSuccess: settle,
  })

  const reset = useMutation({
    mutationFn: () => noticeTextsService.reset(token as string, kind),
    onSuccess: settle,
  })

  // Meta may have approved it meanwhile: the lists then show the new text.
  const refresh = useMutation({
    mutationFn: () => noticeTextsService.refresh(token as string, kind),
    onSuccess: settle,
  })

  return { save, reset, refresh }
}
