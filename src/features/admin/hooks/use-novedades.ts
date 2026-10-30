import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { novedadesService } from '@/services/novedades.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { NovedadesQuery } from '@/types/api/novedades'
import { useAuth } from '../context/auth-context'

export function useNovedades(params: NovedadesQuery) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.admin.novedades(params),
    queryFn: () => novedadesService.list(params, token as string),
    enabled: !!token,
    refetchInterval: 20_000,
    placeholderData: keepPreviousData,
  })
}
