import { useQuery } from '@tanstack/react-query'
import { adminClientsService } from '@/services/admin-clients.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import { useAuth } from '../context/auth-context'
import type { ScopeFilterValue } from '../components/scope-filter'

/** The Asegurados KPIs of the list's section filter (a code, a number or a code group). */
export function useAdminClientsStats(scope: ScopeFilterValue = {}) {
  const { token } = useAuth()

  return useQuery({
    queryKey: [...QUERY_KEYS.admin.clientsStats, scope],
    queryFn: () => adminClientsService.stats(token as string, scope),
    enabled: !!token,
  })
}
