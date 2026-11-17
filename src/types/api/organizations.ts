import type { AdminRole } from './auth'
import type { BilledPlan } from './billing'
import type { MetaPortfolio } from './phone-numbers'

export interface OrganizationCode {
  id: number
  code: string
  holderName: string | null
  isMaster: boolean
  isActive: boolean
  /** Portfolio attributed to this code. */
  clients: number
  policies: number
  claims: number
  /** Null until the code completes its first cartera sync. */
  lastCarteraSyncAt: string | null
}

/**
 * Billing of a phone number for the running month. What Meta and OpenAI really cost is left out of the panel, also for
 * the Developer (decision of 17/11): any such field the API still sends is not read.
 */
export interface PhoneNumberUsage {
  period: string
  /** Tokens of the month: 1 per message the platform sent, 2 per campaign message (the field keeps its name). */
  messages: number
  assignedPlan: BilledPlan | null
  plan: BilledPlan
  upgraded: boolean
  /** What the platform invoices the organization for the month. */
  billedUsd: number
}

export interface OrganizationNumber {
  id: number
  phoneNumberId: string
  number: string
  /** The branch the number belongs to, as the office calls it ("27 de Febrero"); absent on older APIs. */
  branchName?: string | null
  isActive: boolean
  responsibleCode: { id: number; code: string; holderName: string | null } | null
  servedCodes: Array<{ id: number; code: string }>
  portfolio?: MetaPortfolio | null
  budget: { monthlyBudgetUsd: number | null; exceededAt: string | null }
  usage: PhoneNumberUsage
}

/** The organization's running month (its real Meta and OpenAI cost, if the API still sends it, is not read). */
export interface OrganizationBilling {
  period: string
  /** Tokens per block past the largest plan. */
  blockMessages: number
  activeNumbers: number
  billedUsd: number
}

export interface OrganizationUser {
  id: number
  email: string
  role: AdminRole
  createdAt: string
  /** The legacy create routes answer it: true when the account was invited instead of getting the password sent. */
  invitationSent?: boolean
  /** Codes granted to an ADMIN (empty for a SUPERADMIN, who sees them all); absent on older APIs. */
  codes?: Array<{ id: number; code: string; holderName: string | null }>
}

/** The zone an organization sits in today; null = none (or its zone was deleted). */
export interface OrganizationZone {
  id: number
  name: string
}

export interface OrganizationSummary {
  id: number
  name: string
  slug: string
  masterCode: string | null
  botName: string | null
  logoUrl?: string | null
  isActive: boolean
  createdAt: string
  zone: OrganizationZone | null
  counts: {
    codes: number
    users: number
    phoneNumbers: number
    clients: number
  }
}

export interface OrganizationDetail {
  id: number
  name: string
  slug: string
  masterCode: string | null
  botName: string | null
  logoUrl?: string | null
  isActive: boolean
  createdAt: string
  zone: OrganizationZone | null
  /** The plan the Developer put the organization on, or null (automatic). Missing from an older API. */
  planId?: number | null
  /** The plan in effect with no number and for its next number: the chosen one, or the automatic one. */
  startingPlan?: OrganizationStartingPlan | null
  codes: OrganizationCode[]
  users: OrganizationUser[]
  numbers: OrganizationNumber[]
  billing: OrganizationBilling
}

export interface OrganizationStartingPlan {
  id: number
  name: string
  /** The free first-month plan of a new account. */
  trial: boolean
}

export interface SetOrganizationPlanResponse {
  id: number
  planId: number | null
  startingPlan: OrganizationStartingPlan | null
}

/** `POST /platform/organizations`: the platform never sends a password; the first SuperAdmin, if any, is invited. */
export interface CreateOrganizationRequest {
  name: string
  masterCode?: string
  botName?: string
  /** The first SuperAdmin, invited by a mailed link. Absent = an organization with no users yet. */
  adminEmail?: string
  /** Ignored by the API (the platform never chooses a password); kept only for the old form. */
  adminPassword?: string
  /** A live zone; null or absent = none. */
  zoneId?: number | null
  codes?: Array<{ code: string; holderName?: string }>
}

export interface CreateOrganizationResponse extends OrganizationDetail {
  /** True when `adminEmail` came: that account got its invitation. */
  invitationSent: boolean
}

/** `PATCH /platform/organizations/:id`. */
export interface UpdateOrganizationRequest {
  isActive?: boolean
  /** A live zone, or null for none. */
  zoneId?: number | null
}

export interface UpdateOrganizationResponse {
  id: number
  name: string
  isActive: boolean
  zoneId: number | null
}

export interface CreateProducerCodeRequest {
  code: string
  holderName?: string
  isMaster?: boolean
}

export interface UpdateProducerCodeRequest {
  holderName?: string
  isActive?: boolean
}
