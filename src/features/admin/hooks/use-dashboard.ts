import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { ScopeFilterValue } from '../components/scope-filter'
import { useAuth } from '../context/auth-context'

export function useDashboard(scope?: ScopeFilterValue, enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: [...QUERY_KEYS.admin.dashboard, scope ?? {}],
    queryFn: () => dashboardService.get(token as string, scope),
    enabled: !!token && enabled,
    // Override the global 5-min staleTime: the dashboard is a live snapshot, so it
    // refetches every time the admin navigates back to it.
    staleTime: 0,
  })
}

/** The Owner's Inicio with «Todos» in a zone: every principal of it added up. */
export function useZoneDashboard(zoneId: number | null) {
  const { token } = useAuth()

  return useQuery({
    queryKey: [...QUERY_KEYS.admin.dashboard, 'zone', zoneId],
    queryFn: () => dashboardService.zone(token as string, zoneId as number),
    enabled: !!token && zoneId !== null,
    staleTime: 0,
  })
}
