import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { improvementsService } from '@/services/improvements.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { ImprovementRequest, ImprovementsQuery, PlatformImprovementsQuery } from '@/types/api/improvements'
import { useAuth } from '../context/auth-context'

/** One page of the published improvements for the organization's users. */
export function useImprovements(params: ImprovementsQuery) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.admin.improvements(params),
    queryFn: () => improvementsService.list(token as string, params),
    enabled: !!token,
    placeholderData: keepPreviousData,
  })
}

/** Sidebar badge: improvements published since the user last opened "Mejoras". */
export function useImprovementsUnseenCount(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.admin.improvementsUnseen,
    queryFn: () => improvementsService.unseenCount(token as string),
    enabled: !!token && enabled,
    // New improvements are rare; a few minutes is plenty for the badge.
    refetchInterval: 5 * 60_000,
  })
}

/** Lumar (DEVELOPER): one page of every improvement, drafts included. */
export function usePlatformImprovements(params: PlatformImprovementsQuery) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.platform.improvements(params),
    queryFn: () => improvementsService.platformList(token as string, params),
    enabled: !!token,
    placeholderData: keepPreviousData,
  })
}

export function usePlatformImprovementActions() {
  const { token } = useAuth()
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: QUERY_KEYS.platform.improvementsAll })

  const create = useMutation({
    mutationFn: (data: ImprovementRequest) => improvementsService.create(token as string, data),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ImprovementRequest> }) =>
      improvementsService.update(token as string, id, data),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: number) => improvementsService.remove(token as string, id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
