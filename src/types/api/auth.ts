/** A panel account's role (see `features/admin/lib/roles.ts` for what each one means). */
export type AdminRole = 'DEVELOPER' | 'OWNER' | 'SUPERADMIN' | 'ADMIN'

export interface AdminUserProducerCode {
  producerCode: { id: number; code: string; holderName: string | null }
}

/** The organization a user belongs to, as the panel names it. */
export interface AdminOrganization {
  slug: string
  name: string
  /** The name the bot uses for it ("Seguros del Litoral"), or `name`. */
  displayName: string
  shortName: string | null
  /** The organization's logo (API-relative URL); null = its initials. Absent on older APIs. */
  logoUrl?: string | null
  /**
   * The office line (the active number billed to the master code): the SuperAdmin's
   * sections open filtered by it. Absent on older APIs.
   */
  defaultPhoneNumber?: { id: number; number: string } | null
}

export interface AdminUser {
  id: number
  email: string
  /** How the office calls this person ("Mili"); null = show the email. */
  name?: string | null
  role: AdminRole
  /** The account's own principal (= `homeProducerId`), always. */
  producerId: number
  // Codes this admin can access (empty for SUPERADMIN = all). Present on /users/me and /users.
  producerCodes?: AdminUserProducerCode[]
  /**
   * Present on /users/me: for an OWNER, the acting principal (the X-Acting-Principal it sent); for every other role,
   * its own organization. Absent on older APIs.
   */
  organization?: AdminOrganization
  /** /users/me: the account's own principal. */
  homeProducerId?: number
  /** /users/me: the principal `organization` describes (the acting one for an Owner, else = `homeProducerId`). */
  actingProducerId?: number
  /** /users/me: the Owner's X-Acting-Principal was refused and ignored; `organization` is its own principal. */
  actingInvalid?: boolean
  /** /users/me: two-step verification is on. */
  twoFactorEnabled?: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

/** A login that opened a session. */
export interface LoginSession {
  access_token: string
}

/**
 * The password was right and the account has two-step verification on: no session yet. `challengeToken` lasts 5
 * minutes and is only good for `POST /auth/login/2fa`.
 */
export interface LoginTwoFactorChallenge {
  twoFactorRequired: true
  challengeToken: string
}

/** `POST /auth/login` answers one of the two. */
export type LoginResponse = LoginSession | LoginTwoFactorChallenge

export function isTwoFactorChallenge(response: LoginResponse): response is LoginTwoFactorChallenge {
  return 'twoFactorRequired' in response && response.twoFactorRequired
}

/** `POST /auth/login/2fa`: the challenge plus the app's 6 digits or a recovery code (`ABCDE-FGHJK`, spent by this use). */
export interface LoginTwoFactorRequest {
  challengeToken: string
  code: string
}

export interface UpdateProfileRequest {
  email?: string
  name?: string
  password?: string
}
