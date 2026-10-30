import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { adminClientsService } from '@/services/admin-clients.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { AdminClientsQuery } from '@/types/api/clients'
import { useAuth } from '../context/auth-context'

export function useAdminClients(params: AdminClientsQuery) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.admin.clients(params),
    queryFn: () => adminClientsService.list(params, token as string),
    enabled: !!token,
    placeholderData: keepPreviousData,
  })
}
