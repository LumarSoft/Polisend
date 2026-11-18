import { apiRequest } from '@/lib/api-client'
import type { DashboardData, ZoneDashboardData } from '@/types/api/dashboard'

export const dashboardService = {
  get: (token: string, scope?: { producerCodeId?: number; phoneNumberId?: number; codeGroupId?: number }) => {
    const params = new URLSearchParams()
    if (scope?.producerCodeId) params.set('producerCodeId', String(scope.producerCodeId))
    if (scope?.phoneNumberId) params.set('phoneNumberId', String(scope.phoneNumberId))
    if (scope?.codeGroupId) params.set('codeGroupId', String(scope.codeGroupId))
    const qs = params.toString()
    return apiRequest<DashboardData>(`/admin/dashboard${qs ? `?${qs}` : ''}`, { token })
  },
  /** The Owner's Inicio for a whole zone: every principal of it added up, counts only. */
  zone: (token: string, zoneId: number) =>
    apiRequest<ZoneDashboardData>(`/hierarchy/dashboard?zoneId=${zoneId}`, { token }),
}
