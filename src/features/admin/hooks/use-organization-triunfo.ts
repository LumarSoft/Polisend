import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformTriunfoService } from '@/services/platform-triunfo.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { SaveTriunfoCredentialRequest } from '@/types/api/triunfo'
import { useAuth } from '../context/auth-context'

/** DEVELOPER: an organization's own Triunfo credentials (status only, never the password). */
export function useOrganizationTriunfo(organizationId: number) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.platform.organizationTriunfo(organizationId),
    queryFn: () => platformTriunfoService.status(token as string, organizationId),
    enabled: !!token,
  })
}

/** DEVELOPER: the organization's failed calls to Triunfo, latest first. */
export function useOrganizationTriunfoErrors(organizationId: number) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.platform.organizationTriunfoErrors(organizationId),
    queryFn: () => platformTriunfoService.errors(token as string, organizationId),
    enabled: !!token,
  })
}

export function useOrganizationTriunfoActions(organizationId: number) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const key = QUERY_KEYS.platform.organizationTriunfo(organizationId)

  const save = useMutation({
    mutationFn: (data: SaveTriunfoCredentialRequest) =>
      platformTriunfoService.save(token as string, organizationId, data),
    onSuccess: status => queryClient.setQueryData(key, status),
  })
  const remove = useMutation({
    mutationFn: () => platformTriunfoService.remove(token as string, organizationId),
    onSuccess: status => queryClient.setQueryData(key, status),
  })
  const setQuoteFallback = useMutation({
    mutationFn: (enabled: boolean) => platformTriunfoService.setQuoteFallback(token as string, organizationId, enabled),
    onSuccess: status => queryClient.setQueryData(key, status),
  })

  return { save, remove, setQuoteFallback }
}
