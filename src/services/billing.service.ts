import { apiRequest } from '@/lib/api-client'
import type {
  BillingByAdmin,
  BillingOverview,
  CatalogPlan,
  CloseMonthResult,
  CatalogResponse,
  CreatePlanRequest,
  FeatureRoles,
  FeatureRolesResponse,
  OrganizationFeatures,
  PlanFeatureKey,
  PlatformBilling,
  SettlementMonth,
  SettlementSeries,
  UpdatePlanRequest,
} from '@/types/api/billing'

const periodQuery = (period?: string) => (period ? `?period=${encodeURIComponent(period)}` : '')

export const billingService = {
  /** `forPrincipal`: an Owner reading a principal of its network other than the acting one. */
  overview(token: string, period?: string, forPrincipal?: number): Promise<BillingOverview> {
    return apiRequest<BillingOverview>(`/admin/billing${periodQuery(period)}`, { token, forPrincipal })
  },

  /** The principal's month by Admin (SuperAdmin, and an Owner in its acting principal). */
  byAdmin(token: string, period?: string): Promise<BillingByAdmin> {
    return apiRequest<BillingByAdmin>(`/admin/billing/by-admin${periodQuery(period)}`, { token })
  },

  /** At the plan's limit: continue on the next plan, or keep the assistant paused until next month. */
  resolveLimit(
    token: string,
    numberId: number,
    choice: 'continue' | 'pause',
  ): Promise<{ ok: boolean; paused: boolean }> {
    return apiRequest<{ ok: boolean; paused: boolean }>(`/admin/billing/numbers/${numberId}/limit`, {
      method: 'POST',
      token,
      body: { choice },
    })
  },

  /** The functions the organization's plans include. */
  features(token: string): Promise<OrganizationFeatures> {
    return apiRequest<OrganizationFeatures>('/admin/billing/features', { token })
  },

  /** The running month only. `forPrincipal`: an Owner changing a number of another principal of its network. */
  assignPlan(token: string, numberId: number, planId: number, forPrincipal?: number): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>(`/admin/billing/numbers/${numberId}/plan`, {
      method: 'PATCH',
      token,
      body: { planId },
      forPrincipal,
    })
  },

  platformBilling(token: string, period?: string): Promise<PlatformBilling> {
    return apiRequest<PlatformBilling>(`/platform/billing${periodQuery(period)}`, { token })
  },

  /** How a month's billing splits with the commercial partner (Developer). */
  settlement(token: string, period?: string): Promise<SettlementMonth> {
    return apiRequest<SettlementMonth>(`/platform/settlement${periodQuery(period)}`, { token })
  },

  /** The last twelve months of the settlement (Developer). */
  settlementSeries(token: string): Promise<SettlementSeries> {
    return apiRequest<SettlementSeries>('/platform/settlement/series', { token })
  },

  /** Freezes a month that already ended (Developer). */
  closeMonth(token: string, period: string): Promise<CloseMonthResult> {
    return apiRequest<CloseMonthResult>('/platform/billing/close', { method: 'POST', token, body: { period } })
  },

  plans(token: string): Promise<CatalogResponse> {
    return apiRequest<CatalogResponse>('/platform/plans', { token })
  },

  createPlan(token: string, data: CreatePlanRequest): Promise<CatalogPlan> {
    return apiRequest<CatalogPlan>('/platform/plans', { method: 'POST', token, body: data })
  },

  updatePlan(token: string, id: number, data: UpdatePlanRequest): Promise<CatalogPlan> {
    return apiRequest<CatalogPlan>(`/platform/plans/${id}`, { method: 'PATCH', token, body: data })
  },

  /** Who may use each function besides the plan (Developer). */
  featureRoles(token: string): Promise<FeatureRolesResponse> {
    return apiRequest<FeatureRolesResponse>('/platform/plan-features/roles', { token })
  },

  updateFeatureRoles(token: string, key: PlanFeatureKey, data: Partial<FeatureRoles>): Promise<FeatureRoles> {
    return apiRequest<FeatureRoles>(`/platform/plan-features/roles/${key}`, { method: 'PATCH', token, body: data })
  },

  removePlan(token: string, id: number): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>(`/platform/plans/${id}`, { method: 'DELETE', token })
  },
}
