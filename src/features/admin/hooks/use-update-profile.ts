import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminAuthService } from '@/services/admin-auth.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { UpdateProfileRequest } from '@/types/api/auth'
import { SESSION_ENDED_TOAST_ID, useAuth } from '../context/auth-context'
import { rememberLoginEmail } from './use-login'

/**
 * Saves the own account (Mi cuenta). A new password ends every session of the account, this one included: instead of
 * reading the profile again (a 401), it logs out, says why and leaves the e-mail for the login form.
 */
export function useUpdateProfile() {
  const { token, logout } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => adminAuthService.updateProfile(token as string, data),
    onSuccess: (profile, data) => {
      if (!data.password) return queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.profile })
      rememberLoginEmail(profile.email)
      toast.success('Cambiaste tu contraseña', {
        id: SESSION_ENDED_TOAST_ID,
        description:
          'Por seguridad se cerraron todas tus sesiones, también esta. Ingresá de nuevo con la contraseña nueva.',
      })
      logout()
    },
  })
}
