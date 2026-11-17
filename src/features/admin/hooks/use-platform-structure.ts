import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'
import { platformService } from '@/services/platform.service'
import type { CreateZoneRequest, UpdateZoneRequest } from '@/types/api/hierarchy'
import type { CreateOwnerRequest, UpdateOwnerRequest } from '@/types/api/platform'
import { useAuth } from '../context/auth-context'
import { useRefreshNetwork } from './use-hierarchy'

/** The Developer's "Owners y zonas" (`/platform/zones`, `/platform/owners`). Developer only: pass `isDeveloper`. */

export function usePlatformZones(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.platform.zones,
    queryFn: () => platformService.zones(token as string),
    enabled: !!token && enabled,
  })
}

export function usePlatformOwners(enabled = true) {
  const { token } = useAuth()
  return useQuery({
    queryKey: QUERY_KEYS.platform.owners,
    queryFn: () => platformService.owners(token as string),
    enabled: !!token && enabled,
  })
}

/** Zones as the platform sees them: a zone created here has no Owner until one is given it. */
export function usePlatformZoneActions() {
  const { token } = useAuth()
  const refresh = useRefreshNetwork()
  return {
    createZone: useMutation({
      mutationFn: (data: CreateZoneRequest) => platformService.createZone(token as string, data),
      onSuccess: refresh,
    }),
    updateZone: useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdateZoneRequest }) =>
        platformService.updateZone(token as string, id, data),
      onSuccess: refresh,
    }),
    removeZone: useMutation({
      mutationFn: (id: number) => platformService.removeZone(token as string, id),
      onSuccess: refresh,
    }),
  }
}

/** Owners: invite or convert, rename and give zones, back to SuperAdmin, password link, 2FA reset. */
export function usePlatformOwnerActions() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const refreshNetwork = useRefreshNetwork()
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platform.owners })
    refreshNetwork()
  }
  return {
    createOwner: useMutation({
      mutationFn: (data: CreateOwnerRequest) => platformService.createOwner(token as string, data),
      onSuccess: refresh,
    }),
    updateOwner: useMutation({
      mutationFn: ({ id, data }: { id: number; data: UpdateOwnerRequest }) =>
        platformService.updateOwner(token as string, id, data),
      onSuccess: refresh,
    }),
    demoteOwner: useMutation({
      mutationFn: (id: number) => platformService.demoteOwner(token as string, id),
      onSuccess: refresh,
    }),
    sendPasswordSetup: useMutation({
      mutationFn: (id: number) => platformService.sendOwnerPasswordSetup(token as string, id),
    }),
    resetTwoFactor: useMutation({
      mutationFn: (id: number) => platformService.resetOwnerTwoFactor(token as string, id),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platform.owners }),
    }),
  }
}
