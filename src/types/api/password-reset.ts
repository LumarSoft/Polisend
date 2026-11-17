/**
 * "¿Olvidaste tu contraseña?" (`/admin/recuperar`): the API mails a 6-digit code and the person chooses a new
 * password with it. Public routes: no Authorization, no X-Acting-Principal.
 */

/** `POST /auth/password-reset/request` → 202 `{ ok: true }`, whether the e-mail has an account or not. */
export interface PasswordResetRequest {
  email: string
}

/** `POST /auth/password-reset/confirm` → 200 `{ ok: true }`. Every session of the account opened before it ends. */
export interface PasswordResetConfirmRequest {
  email: string
  /** The 6 digits of the mail. */
  code: string
  /** At least 6 characters, the rules of `/auth/password-setup`. */
  password: string
}

export interface PasswordResetResponse {
  ok: true
}

/** `code` of the 400 a wrong, expired or burnt code gets (and an unknown e-mail, alike). */
export const PASSWORD_RESET_INVALID = 'PASSWORD_RESET_INVALID'

/** The code the mail carries: anything else is not sent to the API. */
export const PASSWORD_RESET_CODE_PATTERN = /^\d{6}$/

/** The API sends one code a minute per account: the panel offers «Reenviar código» after this many seconds. */
export const PASSWORD_RESET_RESEND_SECONDS = 60
