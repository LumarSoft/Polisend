import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminConfigService } from '@/services/admin-config.service'
import { organizationsService } from '@/services/organizations.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import { useAuth } from '../context/auth-context'

/**
 * The SuperAdmin's own organization logo; the profile (sidebar, credential) refreshes after it. `forPrincipal`: an
 * Owner's own principal, whatever principal it has chosen (its global Configuración).
 */
export function useOwnLogo(forPrincipal?: number) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  // The profile key prefixes the home one: both refresh.
  const refresh = () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.profile })

  const upload = useMutation({
    mutationFn: (file: File) => adminConfigService.uploadLogo(token as string, file, forPrincipal),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: () => adminConfigService.removeLogo(token as string, forPrincipal),
    onSuccess: refresh,
  })
  return { upload, remove }
}

/** Any organization's logo, set by the Developer from Organizaciones. */
export function useOrganizationLogo(orgId: number) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platform.organizations })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platform.organization(orgId) })
  }

  const upload = useMutation({
    mutationFn: (file: File) => organizationsService.uploadLogo(token as string, orgId, file),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: () => organizationsService.removeLogo(token as string, orgId),
    onSuccess: refresh,
  })
  return { upload, remove }
}
