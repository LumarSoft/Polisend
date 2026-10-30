import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { whatsappOnboardingService } from '@/services/whatsapp-onboarding.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { OnboardWhatsappRequest } from '@/types/api/whatsapp-onboarding'
import { useAuth } from '../context/auth-context'

export function useEmbeddedSignupConfig(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.admin.embeddedSignupConfig,
    queryFn: () => whatsappOnboardingService.config(token as string),
    enabled: !!token && enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useOnboardWhatsapp() {
  const { token } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: OnboardWhatsappRequest) => whatsappOnboardingService.onboard(token as string, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.admin.phoneNumbers }),
  })
}
