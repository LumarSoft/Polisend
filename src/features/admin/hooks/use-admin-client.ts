import { useQuery } from '@tanstack/react-query'
import { adminClientsService } from '@/services/admin-clients.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import { useAuth } from '../context/auth-context'

export function useAdminClient(id: number | null) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.admin.client(id ?? 0),
    queryFn: () => adminClientsService.get(id as number, token as string),
    enabled: !!token && id !== null,
  })
}
