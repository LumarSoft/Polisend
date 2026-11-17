import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'
import { twoFactorService } from '@/services/two-factor.service'
import type { TwoFactorDisableRequest, TwoFactorEnableRequest } from '@/types/api/two-factor'
import { useAuth } from '../context/auth-context'

/**
 * The logged-in user's own two-step verification (Mi cuenta). `twoFactorEnabled` comes in the profile (`useProfile`).
 * Errors carry `ApiError.code` (`TwoFactorErrorCode`) and a Spanish `message` to show as is.
 */
export function useTwoFactorActions() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const refreshProfile = () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.profile })
  return {
    /** A new secret for the QR (not on yet). */
    setup: useMutation({ mutationFn: () => twoFactorService.setup(token as string) }),
    /** Turns it on; answers the 10 recovery codes, shown once. */
    enable: useMutation({
      mutationFn: (data: TwoFactorEnableRequest) => twoFactorService.enable(token as string, data),
      onSuccess: refreshProfile,
    }),
    disable: useMutation({
      mutationFn: (data: TwoFactorDisableRequest) => twoFactorService.disable(token as string, data),
      onSuccess: refreshProfile,
    }),
  }
}
