import { useQuery } from '@tanstack/react-query'
import { adminAuthService } from '@/services/admin-auth.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import { useAuth } from '../context/auth-context'

export function useProfile() {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.admin.profile,
    queryFn: () => adminAuthService.getProfile(token as string),
    enabled: !!token,
  })
}

/** An Owner's own principal as /users/me describes it (its name, its logo), whatever principal it has chosen. */
export function useHomeProfile(homePrincipalId: number | null) {
  const { token } = useAuth()

  return useQuery({
    queryKey: [...QUERY_KEYS.admin.homeProfile, homePrincipalId],
    queryFn: () => adminAuthService.getProfile(token as string, homePrincipalId as number),
    enabled: !!token && homePrincipalId !== null,
  })
}
