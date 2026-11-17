import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { billingService } from '@/services/billing.service'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { CreatePlanRequest, FeatureRoles, PlanFeatureKey, UpdatePlanRequest } from '@/types/api/billing'
import { useAuth } from '../context/auth-context'

/** How often the consumption bars follow Meta's deliveries. */
const LIVE_REFRESH_MS = 10_000

/** Every number's plan and month, refreshed while the screen is open. */
export function useBillingOverview(period?: string, enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.admin.billing(period),
    queryFn: () => billingService.overview(token as string, period),
    enabled: !!token && enabled,
    placeholderData: keepPreviousData,
    refetchInterval: LIVE_REFRESH_MS,
  })
}

/** The functions the organization's plans include (a tenant route: never for the Developer). */
export function usePlanFeatures(enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.admin.planFeatures,
    queryFn: () => billingService.features(token as string),
    enabled: !!token && enabled,
    staleTime: 5 * 60_000,
  })
}

/**
 * Whether the organization's plans include one function, and the cheapest plan that does. Until it is known, or
 * against an API older than the plan features, the function counts as included: the API has the last word.
 */
export function usePlanFeature(key: PlanFeatureKey, enabled = true) {
  const { data } = usePlanFeatures(enabled)
  return {
    included: data?.features[key] ?? true,
    availableIn: data?.availableIn[key] ?? null,
    /** The plans include it but the user's role has it off: the panel says so instead of naming a plan. */
    byRole: data?.blockedByRole?.includes(key) ?? false,
    /** Known to be in no plan at all (nobody can turn it on from Facturación). */
    nowhere: data !== undefined && !data.features[key] && !data.availableIn[key] && !data.blockedByRole?.includes(key),
  }
}

/** Who may use each function besides the plan (Developer). */
export function useFeatureRoles(enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.platform.featureRoles,
    queryFn: () => billingService.featureRoles(token as string),
    enabled: !!token && enabled,
  })
}

/** The Developer turns a function on or off for a role; every screen that reads the functions refreshes. */
export function useUpdateFeatureRoles() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, data }: { key: PlanFeatureKey; data: Partial<FeatureRoles> }) =>
      billingService.updateFeatureRoles(token as string, key, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platform.featureRoles })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.billingAll })
    },
  })
}

/**
 * A principal of the Owner's network other than the acting one, for the running month (Consumo de la red: a number's
 * plan and the catalog). Read only while it is shown, never refreshed on its own.
 */
export function usePrincipalBillingOverview(principalId: number, enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.admin.billingOfPrincipal(principalId),
    queryFn: () => billingService.overview(token as string, undefined, principalId),
    enabled: !!token && enabled,
    gcTime: 0,
  })
}

/** The principal's month by Admin (Facturación › Por administrador), refreshed while the screen is open. */
export function useBillingByAdmin(period?: string, enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.admin.billingByAdmin(period),
    queryFn: () => billingService.byAdmin(token as string, period),
    enabled: !!token && enabled,
    placeholderData: keepPreviousData,
    refetchInterval: LIVE_REFRESH_MS,
  })
}

export interface AssignPlanVariables {
  numberId: number
  planId: number
  /** An Owner changing a number of another principal of its network (sent as that request's acting principal). */
  principalId?: number
}

/**
 * The SuperAdmin (or an Owner) puts a number on a plan; the month, the numbers and the network's consumption refresh
 * after it.
 */
export function useAssignPlan() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ numberId, planId, principalId }: AssignPlanVariables) =>
      billingService.assignPlan(token as string, numberId, planId, principalId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.billingAll })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.phoneNumbers })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hierarchy.usageAll })
    },
  })
}

/** The office's answer at a number's plan limit; the month, the numbers and the notices refresh after it. */
export function useResolveLimit() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ numberId, choice }: { numberId: number; choice: 'continue' | 'pause' }) =>
      billingService.resolveLimit(token as string, numberId, choice),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.billingAll })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.phoneNumbers })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'novedades'] })
    },
  })
}

/** The platform's month (Developer) across the platform: billed, Meta, OpenAI and profit. */
export function usePlatformBilling(period?: string, enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.platform.billing(period),
    queryFn: () => billingService.platformBilling(token as string, period),
    enabled: !!token && enabled,
    placeholderData: keepPreviousData,
    refetchInterval: LIVE_REFRESH_MS,
  })
}

/** The platform's catalog (Developer). */
export function usePlatformPlans(enabled = true) {
  const { token } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.platform.plans,
    queryFn: () => billingService.plans(token as string),
    enabled: !!token && enabled,
  })
}

/** Catalog changes (Developer); every billing screen refreshes after each. */
export function usePlanActions() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platform.plans })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.platform.billingAll })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.billingAll })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.phoneNumbers })
  }

  const createPlan = useMutation({
    mutationFn: (data: CreatePlanRequest) => billingService.createPlan(token as string, data),
    onSuccess: refresh,
  })

  const updatePlan = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanRequest }) =>
      billingService.updatePlan(token as string, id, data),
    onSuccess: refresh,
  })

  const removePlan = useMutation({
    mutationFn: (id: number) => billingService.removePlan(token as string, id),
    onSuccess: refresh,
  })

  return { createPlan, updatePlan, removePlan }
}
