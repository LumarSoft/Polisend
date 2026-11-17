/**
 * Password-setup links (`/admin/activar?token=…`): the platform never chooses a password. An invitation (new account)
 * or a reset link reaches the account's own address; the link lasts 72 h and works once.
 */

/** "invitation": no usable password until the link is used. "reset": the current password works until then. */
export type PasswordSetupKind = 'invitation' | 'reset'

/** `GET /auth/password-setup/:token` (public: no Authorization, no X-Acting-Principal). */
export interface PasswordSetupInfo {
  email: string
  /** Chosen by whoever manages the account: render it as plain text only. */
  name: string | null
  kind: PasswordSetupKind
  /** The account's principal, or "la red" for an Owner. */
  organizationName: string
}

/** `POST /auth/password-setup` → 204. Every session of the account opened before it ends. */
export interface PasswordSetupRequest {
  token: string
  /** At least 6 characters. */
  password: string
}

/** `code` of the 410 an unknown, used, replaced or expired link gets (on either call). */
export const PASSWORD_SETUP_INVALID = 'PASSWORD_SETUP_INVALID'

/** Characters a token can have; anything else is refused with 400 without calling the API. */
export const PASSWORD_SETUP_TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,128}$/
