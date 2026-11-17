import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'
import { passwordSetupService } from '@/services/password-setup.service'
import { PASSWORD_SETUP_TOKEN_PATTERN, type PasswordSetupRequest } from '@/types/api/password-setup'

/**
 * The link of /admin/activar (public). Not cached past the page (`gcTime: 0`), never retried: a 410
 * (`code: PASSWORD_SETUP_INVALID`) is the "invalid link" state. A malformed or missing token never reaches the API.
 */
export function usePasswordSetupInfo(token: string | null) {
  const valid = token !== null && PASSWORD_SETUP_TOKEN_PATTERN.test(token)
  return useQuery({
    queryKey: QUERY_KEYS.auth.passwordSetup,
    queryFn: () => passwordSetupService.info(token as string),
    enabled: valid,
    retry: false,
    gcTime: 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

/** 204 = done: go to /admin/login with the e-mail prefilled (never log in automatically). */
export function useCompletePasswordSetup() {
  return useMutation({ mutationFn: (data: PasswordSetupRequest) => passwordSetupService.complete(data) })
}
