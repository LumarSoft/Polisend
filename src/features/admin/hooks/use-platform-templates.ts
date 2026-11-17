import { useQuery } from '@tanstack/react-query'
import { templatesService } from '@/services/templates.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import { useAuth } from '../context/auth-context'

/** Each call asks Meta: keep the answer a few minutes unless the Developer refreshes it. */
const STALE_MS = 5 * 60 * 1000

/** The Meta templates of every organization's WhatsApp accounts (Developer). */
export function usePlatformTemplates(enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.platform.templates,
    queryFn: () => templatesService.overview(token as string),
    enabled: !!token && enabled,
    staleTime: STALE_MS,
  })
}
