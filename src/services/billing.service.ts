import { apiRequest } from '@/lib/api-client'
import type {
  BillingOverview,
  CatalogPlan,
  CatalogResponse,
  CreatePlanRequest,
  OwnerBilling,
  UpdatePlanRequest,
} from '@/types/api/billing'

const periodQuery = (period?: string) => (period ? `?period=${encodeURIComponent(period)}` : '')

export const billingService = {
  overview(token: string, period?: string): Promise<BillingOverview> {
    return apiRequest<BillingOverview>(`/admin/billing${periodQuery(period)}`, { token })
  },

  assignPlan(token: string, numberId: number, planId: number): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>(`/admin/billing/numbers/${numberId}/plan`, {
      method: 'PATCH',
      token,
      body: { planId },
    })
  },

  ownerBilling(token: string, period?: string): Promise<OwnerBilling> {
    return apiRequest<OwnerBilling>(`/owner/billing${periodQuery(period)}`, { token })
  },

  plans(token: string): Promise<CatalogResponse> {
    return apiRequest<CatalogResponse>('/owner/plans', { token })
  },

  createPlan(token: string, data: CreatePlanRequest): Promise<CatalogPlan> {
    return apiRequest<CatalogPlan>('/owner/plans', { method: 'POST', token, body: data })
  },

  updatePlan(token: string, id: number, data: UpdatePlanRequest): Promise<CatalogPlan> {
    return apiRequest<CatalogPlan>(`/owner/plans/${id}`, { method: 'PATCH', token, body: data })
  },

  removePlan(token: string, id: number): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>(`/owner/plans/${id}`, { method: 'DELETE', token })
  },
}
