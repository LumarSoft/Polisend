/** The panel functions a plan can include or leave out (api_john `src/plan-features/plan-features.ts`). */
export type PlanFeatureKey =
  | 'rejection_notices'
  | 'expiry_notices'
  | 'campaign_coverage_upgrade'
  | 'campaign_quote_followup'
  | 'campaign_renewal'
  | 'campaign_winback'
  | 'campaign_cross_sell'
  | 'ai_assistant'

/** Whether a plan (or the organization's plans) includes each function. */
export type PlanFeatures = Record<PlanFeatureKey, boolean>

/** A function of the catalog as the Developer sees it in Planes. */
export interface PlanFeatureInfo {
  key: PlanFeatureKey
  label: string
  description: string
}

/** What the organization's plans include, for the panel to show or lock a function. */
export interface OrganizationFeatures {
  features: PlanFeatures
  /** The cheapest active paid plan that includes each function, or null. */
  availableIn: Record<PlanFeatureKey, string | null>
  /** Functions the plans include but the user's role has off. Missing from an older API. */
  blockedByRole?: PlanFeatureKey[]
}

/** The roles a function can be turned off for, besides the plan (the Developer always has everything). */
export type FeatureRoleName = 'ADMIN' | 'SUPERADMIN'
export type FeatureRoles = Record<FeatureRoleName, boolean>

export interface FeatureRolesResponse {
  roles: Record<PlanFeatureKey, FeatureRoles>
}

/** A plan of the platform's catalog: messages a month. Its price comes only for the DEVELOPER. */
export interface PlanOffer {
  id: number
  name: string
  messages: number
  /** DEVELOPER only: the organizations never see plan prices. */
  priceUsd?: number
  /** The free first-month plan of a new account's number. */
  isTrial: boolean
}

/** A plan of the catalog as the Developer edits it. */
export interface CatalogPlan extends PlanOffer {
  priceUsd: number
  /** Off: the numbers on it keep it, but no number moves to it. */
  isActive: boolean
  sortOrder: number
  /** The functions it includes. Missing from an API older than the plan features. */
  features?: PlanFeatures
}

export interface CatalogResponse {
  /** Messages per block past the largest plan. */
  blockMessages: number
  /** The functions a plan can include. Missing from an API older than the plan features. */
  features?: PlanFeatureInfo[]
  plans: CatalogPlan[]
}

/** The plan a number's month is billed on: a catalog plan, or the largest plus blocks past the catalog. */
export interface BilledPlan {
  /** The catalog plan, or null past the largest one. */
  id: number | null
  name: string
  includedMessages: number
  priceUsd: number
  trial: boolean
  /** Blocks past the largest plan (0 inside the catalog). */
  extraBlocks: number
}

/** A plan as `GET /admin/billing` and `GET /admin/phone-numbers` send it: the price only to the DEVELOPER. */
export type UnpricedPlan<T extends { priceUsd: number }> = Omit<T, 'priceUsd'> & { priceUsd?: number }

/** Where a number stands against its plan's limit this month. */
export interface PlanLimit {
  /** The month's messages reached what the plan includes. */
  reached: boolean
  /** Its assistant is paused this month until someone continues on `nextPlan`. */
  paused: boolean
  /** Someone chose to keep it paused until next month. */
  confirmed: boolean
  pausedAt: string | null
  /** The first day it answers again on its own ("YYYY-MM-01"). */
  resumesOn: string | null
}

/** A number's running month in Facturación. */
export interface BillingNumber {
  id: number
  number: string
  /** The branch the number belongs to, as the office calls it ("27 de Febrero"); absent on older APIs. */
  branchName?: string | null
  isActive: boolean
  responsibleCode: { id: number; code: string; holderName: string | null } | null
  /** The plan the number is on (the SuperAdmin's choice, or the smallest paid plan). */
  assignedPlan: UnpricedPlan<BilledPlan> | null
  /** The plan the month is billed on. */
  plan: UnpricedPlan<BilledPlan>
  /** Past its plan this month, or already moved up on its own this month. */
  upgraded: boolean
  /** When it moved up on its own this month (ISO), or null. */
  movedUpAt: string | null
  messagesUsed: number
  includedMessages: number
  remainingMessages: number
  percentUsed: number
  /** Where the number goes past this plan: the next of the catalog, or the next block. */
  nextPlan: { name: string; messages: number; priceUsd?: number } | null
  /** DEVELOPER only. The whole plan: the calendar month is always charged whole. */
  billedUsd?: number
  /** Missing from an API older than the plan limit pause. */
  limit?: PlanLimit
  /** When the month's counters last moved (ISO), null before the first message. */
  updatedAt: string | null
}

export interface BillingOverview {
  period: string
  blockMessages: number
  /** The active plans of the catalog. */
  plans: PlanOffer[]
  numbers: BillingNumber[]
  /** DEVELOPER only: what the organization pays this month. */
  totalBilledUsd?: number
}

export interface CreatePlanRequest {
  name: string
  messages: number
  priceUsd: number
  isTrial?: boolean
  sortOrder?: number
  features?: Partial<PlanFeatures>
}

export interface UpdatePlanRequest {
  name?: string
  messages?: number
  priceUsd?: number
  isTrial?: boolean
  isActive?: boolean
  sortOrder?: number
  /** Only the functions to change. */
  features?: Partial<PlanFeatures>
}

/** The platform's month (Developer): billed vs what its messages cost, and what Meta and OpenAI really charged. */
export interface PlatformBillingTotals {
  /** Plan messages consumed: a campaign (marketing) message counts 2 from its start date; every other, 1. */
  messages: number
  /** Messages sent, one each. Missing from an API older than the template weight. */
  sentMessages?: number
  /** Of the messages sent, the templates. Missing from an API older than the template weight. */
  templateMessages?: number
  /** Of the messages sent, the bot's, the office's and the notices (each at `messageCost.messageUsd`). */
  botMessages?: number
  /** Of the messages sent, the campaign ones (each at `messageCost.campaignMessageUsd`). */
  campaignMessages?: number
  /** Messages Meta charged for (past the free service messages, and every template). */
  metaBillableMessages: number
  billedUsd: number
  /** Bot messages × the message rate + campaign messages × the campaign rate. Missing from an older API. */
  messageCostUsd?: number
  /** billedUsd − messageCostUsd: what the plan leaves over its messages. */
  marginUsd?: number
  metaCostUsd: number
  /** Prepaid: shown apart, outside the profit. */
  openaiCostUsd: number
  /** billedUsd − metaCostUsd. */
  profitUsd: number
}

export interface PlatformBillingNumber extends PlatformBillingTotals {
  id: number
  number: string
  /** The branch the number belongs to, as the office calls it ("27 de Febrero"); absent on older APIs. */
  branchName?: string | null
  isActive: boolean
  responsibleCode: { code: string; holderName: string | null } | null
  plan: BilledPlan
  assignedPlan: BilledPlan | null
  upgraded: boolean
  /** Its assistant is paused this month for reaching the plan. */
  paused: boolean
}

export interface PlatformBillingOrganization {
  id: number
  name: string
  isActive: boolean
  /** Where it sits today; null without a live zone. Missing from an API older than the zones. */
  zone?: { id: number; name: string } | null
  numbers: PlatformBillingNumber[]
  totals: PlatformBillingTotals
}

/** The month of one zone (or "Sin zona", id null), with its Owners and the sum of its organizations. */
export interface PlatformBillingZone {
  id: number | null
  name: string
  owners: Array<{ id: number; name: string | null; email: string }>
  organizationIds: number[]
  totals: PlatformBillingTotals & { organizations: number }
}

export interface PlatformBilling {
  period: string
  /** Read as frozen on the 1st of the next month. Missing from an API older than the monthly close. */
  closed?: boolean
  closedAt?: string | null
  /** Closed after the 1st of the next month, with the plans of that day. */
  backfilled?: boolean
  /** What a message costs; null when the rate is not configured in the API. Missing from an older API. */
  messageCost?: { messageUsd: number; campaignMessageUsd: number } | null
  organizations: PlatformBillingOrganization[]
  /**
   * The same organizations by zone, ordered by name, "Sin zona" last (a closed month is grouped by today's zones).
   * Missing from an API older than the zones.
   */
  zones?: PlatformBillingZone[]
  totals: PlatformBillingTotals & {
    organizations: number
    activeNumbers: number
    upgradedNumbers: number
    pausedNumbers: number
  }
}

// ─── Liquidación (Developer) ─────────────────────────────────────────────────────

/** How a month splits: the platform's cost per settled token and the partner's share of what is left. */
export interface SettlementTerms {
  costPerMessageUsd: number
  /** 0–1. */
  partnerShare: number
}

export interface SettlementAmounts {
  /** The client's plan consumption (what its plan, bars and limits count); not what the service cost charges. */
  consumedMessages: number
  /** Of the messages sent, the campaign (marketing) ones. Missing on an API older than 2026-11-16. */
  campaignMessages?: number
  /**
   * The tokens the service cost charges: 1 per message sent and 2 per campaign message, in every month. Missing on an
   * API older than 2026-11-16 (read it with settledTokensOf).
   */
  settledTokens?: number
  billedUsd: number
  /** settled tokens × cost per token. */
  serviceCostUsd: number
  /** billed − service cost (negative when a trial costs and bills nothing). */
  remainderUsd: number
  partnerShareUsd: number
  ownerShareUsd: number
  /** The platform's service cost plus its share. */
  ownerTotalUsd: number
}

export interface SettlementNumber extends SettlementAmounts {
  id: number
  number: string
  isActive: boolean
  responsibleCode: { code: string; holderName: string | null } | null
  plan: { name: string; includedMessages: number; priceUsd: number }
  trial: boolean
  firstMonth: boolean
  sentMessages: number
  templateMessages: number
}

export interface SettlementOrganization {
  id: number
  name: string
  isActive: boolean
  numbers: SettlementNumber[]
  totals: SettlementAmounts
}

export interface SettlementMonth {
  period: string
  /** The running month. */
  live: boolean
  closed: boolean
  closedAt: string | null
  backfilled: boolean
  terms: SettlementTerms
  totals: SettlementAmounts & { organizations: number; numbers: number; trialNumbers: number }
  organizations: SettlementOrganization[]
}

export interface SettlementSeriesMonth extends SettlementAmounts {
  period: string
  live: boolean
  closed: boolean
  backfilled: boolean
  activeNumbers: number
  newNumbers: number
  /** In service the month before, not this one. */
  stoppedNumbers: number
}

export interface SettlementSeries {
  to: string
  terms: SettlementTerms
  months: SettlementSeriesMonth[]
}

export interface CloseMonthResult {
  period: string
  alreadyClosed: boolean
  closedNumbers: number
  backfilled: boolean
  closedAt: string | null
}
