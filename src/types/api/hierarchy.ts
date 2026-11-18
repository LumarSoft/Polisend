/**
 * The network: Zona › Principal (`Producer`) › Productor (`ProducerCode`), under `/hierarchy/*` (Developer, Owner and,
 * where noted, SuperAdmin). These routes check the principal or zone they touch against what the caller reaches,
 * never the acting principal, and need no X-Acting-Principal. Counts only: no field here is an amount.
 */

/** A producer code as the cascading filter lists it (active and live only). */
export interface HierarchyPrincipalCode {
  id: number
  code: string
  holderName: string | null
  /** Triunfo blocks new policies, renewals and endorsements for it. Absent on older APIs. */
  triunfoBlocked?: boolean
}

/** `GET /hierarchy/principals` (Developer, Owner, SuperAdmin): the cascading filter's data, ordered by name. */
export interface HierarchyPrincipal {
  id: number
  name: string
  isActive: boolean
  /**
   * Null when the caller does not have the principal's zone: an Owner's own principal outside its zones, a SuperAdmin's
   * principal, or (Developer) a principal in no zone.
   */
  zoneId: number | null
  zoneName: string | null
  /** The caller's own principal (never true for the Developer). */
  isHome: boolean
  codes: HierarchyPrincipalCode[]
}

// ─── Mi red (GET /hierarchy/tree) ──────────────────────────────────────────────

export interface NetworkTreeCode {
  id: number
  code: string
  holderName: string | null
  isMaster: boolean
  isActive: boolean
  /** Triunfo blocks new policies, renewals and endorsements for it. Absent on older APIs. */
  triunfoBlocked?: boolean
  /** Its group among the principal's `groups`; null or absent = "Sin grupo". */
  groupId?: number | null
  /** The principal's Admins granted this code ([] = "sin usuario"). */
  admins: Array<{ id: number; name: string | null }>
}

/** A group of a principal's codes ("Mi red"), made from a Triunfo organizer or by hand. */
export interface CodeGroup {
  id: number
  name: string
  /** The Triunfo organizer it was made from, if it was. */
  organizerCode: string | null
}

/** `POST /hierarchy/principals/:id/groups` and `PATCH …/groups/:groupId`. */
export interface CodeGroupRequest {
  name: string
}

export interface NetworkTreePrincipal {
  id: number
  name: string
  masterCode: string | null
  isActive: boolean
  isHome: boolean
  /** The organization's plan name, or null. */
  plan: string | null
  users: { superAdmins: number; admins: number }
  /** Active numbers and how many fail (account disconnected or token expired). */
  numbers: { total: number; failing: number }
  clients: number
  /** Plan messages of the running month. */
  messagesThisMonth: number
  /** `failingSince`: ISO date of the open Triunfo outage, or null. */
  triunfo: { configured: boolean; failingSince: string | null }
  codes: NetworkTreeCode[]
  /** The groups its codes are ordered in, by name. Absent on older APIs. */
  groups?: CodeGroup[]
}

export interface NetworkTreeZone {
  id: number
  name: string
  /** The zone's Triunfo code (informational), or null. */
  code: string | null
  /** Empty zones are included. */
  principals: NetworkTreePrincipal[]
}

/** `GET /hierarchy/tree` (Developer, Owner, SuperAdmin). */
export interface NetworkTree {
  zones: NetworkTreeZone[]
  /** Developer only: principals in no zone. */
  unzoned?: NetworkTreePrincipal[]
  /** The caller's own principal when it is in none of the caller's zones (always for a SuperAdmin), else null. */
  home: NetworkTreePrincipal | null
}

// ─── Consumo de la red (GET /hierarchy/usage) ──────────────────────────────────

export interface NetworkUsageTotals {
  numbers: number
  consumedMessages: number
  sentMessages: number
  campaignMessages: number
}

export interface NetworkUsageNumber {
  id: number
  number: string
  branchName: string | null
  isActive: boolean
  responsibleCode: { code: string; holderName: string | null } | null
  /** The plan's name. */
  plan: string | null
  /** The catalog id of the plan the month is counted on (null past the largest plan). Missing from an older API. */
  planId?: number | null
  /** The catalog plan the number is on; null in a closed month or past the largest plan. Missing from an older API. */
  assignedPlanId?: number | null
  planMessages: number
  /** What the plan counts (a campaign message counts 2 from the commercial weight date). */
  consumedMessages: number
  percentUsed: number
  limitReached: boolean
  paused: boolean
  /** Each message once. */
  sentMessages: number
  campaignMessages: number
}

export interface NetworkUsagePrincipal {
  id: number
  name: string
  isActive: boolean
  isHome: boolean
  numbers: NetworkUsageNumber[]
  totals: NetworkUsageTotals
}

export interface NetworkUsageZone {
  id: number
  name: string
  principals: NetworkUsagePrincipal[]
  totals: NetworkUsageTotals
}

/** `GET /hierarchy/usage?period=YYYY-MM` (Owner, Developer): message counts only, never an amount. */
export interface NetworkUsage {
  period: string
  closed: boolean
  zones: NetworkUsageZone[]
  /** Developer only: principals in no zone. */
  unzoned: NetworkUsagePrincipal[]
  /** The Owner's own principal when it is outside its zones. */
  home: NetworkUsagePrincipal | null
  totals: NetworkUsageTotals
}

// ─── Zones (Developer, Owner) ──────────────────────────────────────────────────

/** A zone as `POST`/`PATCH /hierarchy/zones` (and `/platform/zones`) answer it. */
export interface Zone {
  id: number
  name: string
  code: string | null
}

export interface CreateZoneRequest {
  /** 2–120 characters. */
  name: string
  /** Up to 20 letters, digits, `/` and `-`; `""` or null = none. */
  code?: string | null
}

export type UpdateZoneRequest = Partial<CreateZoneRequest>

export interface DeleteZoneResponse {
  id: number
  deleted: true
}

// ─── Principals and codes ──────────────────────────────────────────────────────

/** A code of a new principal: letters, digits, `/` and `-`, up to 20. */
export interface NewPrincipalCode {
  code: string
  holderName?: string
}

/** `POST /hierarchy/principals` (Developer, Owner): a principal with its codes and no users. Answers a `HierarchyPrincipal`. */
export interface CreatePrincipalRequest {
  /** A zone of the caller. */
  zoneId: number
  name: string
  /** Becomes the master code. */
  masterCode: string
  codes?: NewPrincipalCode[]
}

/** `PATCH /hierarchy/principals/:id` (Developer, Owner). */
export interface UpdatePrincipalRequest {
  name?: string
  /** A zone of the caller; null (out of every zone) is the Developer's only. */
  zoneId?: number | null
  /** Developer only. */
  isActive?: boolean
}

export interface UpdatePrincipalResponse {
  id: number
  name: string
  isActive: boolean
  zoneId: number | null
}

/** A producer code as the single code endpoint answers it. */
export interface PrincipalCode {
  id: number
  code: string
  holderName: string | null
  isMaster: boolean
  isActive: boolean
}

/** `POST /hierarchy/principals/:id/codes` (Developer, Owner, SuperAdmin): a deleted code with the same value comes back. */
export interface CreatePrincipalCodeRequest {
  code: string
  holderName?: string
  /** Developer only. */
  isMaster?: boolean
}

/** `PATCH /hierarchy/principals/:id/codes/:codeId`. */
export interface UpdatePrincipalCodeRequest {
  /** `""` clears it. */
  holderName?: string
  /** Never false on the master code. */
  isActive?: boolean
  /** Developer only, only true: moves the master mark. */
  isMaster?: true
  /** A group of the same principal; null takes the code out of its group. */
  groupId?: number | null
}

// ─── Users (GET/POST/PATCH/DELETE /hierarchy/users) ────────────────────────────

/** The roles `/hierarchy/users` assigns (Owners are created only by the Developer, under /platform/owners). */
export type NetworkUserRole = 'SUPERADMIN' | 'ADMIN'

/** A SuperAdmin or Admin of a principal the caller reaches. */
export interface NetworkUser {
  id: number
  name: string | null
  email: string
  role: NetworkUserRole
  /** Absent (or false) on every account the caller manages. */
  readOnly?: false
  createdAt: string
  twoFactorEnabled: boolean
  principal: { id: number; name: string }
  /** Null for a principal in no zone. */
  zone: { id: number; name: string } | null
  /** The Admin's grants; [] for a SuperAdmin (it sees every code of its principal). */
  codes: HierarchyPrincipalCode[]
}

/** The roles of the read-only rows: the platform (Lumarsoft) and the other Owners of the caller's zones. */
export type ReadOnlyUserRole = 'DEVELOPER' | 'OWNER'

/**
 * A row of `GET /hierarchy/users?includeReadOnly=true` that only an OWNER gets (decision of 17/11): the live Developer
 * accounts and the other Owners that share one of its zones. Nobody may edit it (the API answers 404 on its routes): no
 * principal, zone or codes, nothing about its second step, and no actions in the panel.
 */
export interface ReadOnlyNetworkUser {
  id: number
  name: string | null
  email: string
  role: ReadOnlyUserRole
  readOnly: true
  /** What the account is, for the Rol column: "Lumarsoft · Developer", "Owner · <shared zone names>". */
  label?: string
  createdAt?: string
  /** Null: the API says nothing about a read-only account's second step. */
  twoFactorEnabled?: boolean | null
  principal?: null
  zone?: null
  codes?: HierarchyPrincipalCode[]
}

/** What `GET /hierarchy/users` lists: the accounts the caller manages and, for an Owner asking, the read-only ones. */
export type NetworkUserRow = NetworkUser | ReadOnlyNetworkUser

export interface NetworkUsersQuery {
  zoneId?: number
  producerId?: number
  role?: NetworkUserRole
  /** Part of the name or the e-mail. */
  q?: string
  /**
   * An Owner's Usuarios: also list the read-only rows (Lumarsoft, the other Owners of its zones). Without it the API
   * sends only the accounts the caller manages; ignored for every other role.
   */
  includeReadOnly?: boolean
}

/** A principal created together with its first SuperAdmin (Owner or Developer only). */
export interface NewPrincipalInput {
  /** Owner: one of its zones (required). Developer: any live zone, or null for none. */
  zoneId: number | null
  name: string
  masterCode: string
  codes?: NewPrincipalCode[]
}

/** `POST /hierarchy/users`: exactly one of `producerId` / `newPrincipal`. */
export interface CreateNetworkUserRequest {
  name?: string
  email: string
  /** At least 6. Absent = the account is invited (a mailed link). Never sent by the Developer. */
  password?: string
  role: NetworkUserRole
  producerId?: number
  /** Only with role SUPERADMIN. */
  newPrincipal?: NewPrincipalInput
  /** ADMIN: required, ≥ 1, codes of that principal. Ignored for a SUPERADMIN. */
  producerCodeIds?: number[]
}

export interface CreateNetworkUserResponse extends NetworkUser {
  /** True when the account was invited (no password sent). */
  invitationSent: boolean
}

/**
 * `PATCH /hierarchy/users/:id`. Owner and SuperAdmin never change a user's principal; the Developer may (decision of
 * 17/11), but never its e-mail or password.
 */
export interface UpdateNetworkUserRequest {
  /** `""` clears it. */
  name?: string
  /** Never a different one from the Developer (403 PLATFORM_CANNOT_SET_CREDENTIALS). */
  email?: string
  /** Never from the Developer. Ends the account's sessions. */
  password?: string
  /** Not your own. */
  role?: NetworkUserRole
  /** Developer only: moves the account to another principal (its grants go; an ADMIN sends the new codes). */
  producerId?: number
  /** Required when the role becomes ADMIN or the principal changes; replaces the grants. */
  producerCodeIds?: number[]
}

/** `POST /hierarchy/users/:id/restore` (Developer, Owner, SuperAdmin). */
export interface RestoreNetworkUserRequest {
  /** At least 6. Absent = the account is invited again (a mailed link). Never sent by the Developer. */
  password?: string
  role: NetworkUserRole
  name?: string
  /** ADMIN: ≥ 1. */
  producerCodeIds?: number[]
}

export interface RestoreNetworkUserResponse extends NetworkUser {
  /** True when no password was sent: the account got a link to choose one. */
  invitationSent?: boolean
}

export interface DeleteNetworkUserResponse {
  id: number
}

/** The 409 body of `POST /hierarchy/users` when the e-mail is of a deleted user the caller may restore. */
export interface EmailRestorableError {
  statusCode: 409
  code: 'EMAIL_RESTORABLE'
  message: string
  restorableUserId: number
}

/**
 * `code` of the 403 the Developer gets when it sends a password or a different e-mail: the platform never holds a
 * credential of an account that reaches a cartera. An older API may still answer other `PLATFORM_CANNOT_*` codes; the
 * panel shows the API's Spanish message for any of them.
 */
export type PlatformRestrictionCode = 'PLATFORM_CANNOT_SET_CREDENTIALS'
