/**
 * Two-step verification with an authenticator app (TOTP), optional for every panel account (plan §5.7). The secret
 * and the recovery codes are answered once, when they are created, and never again.
 */

/** Machine-readable `code` of the 2FA errors (besides the Spanish `message` for the person). */
export type TwoFactorErrorCode =
  /** 401 on the login's second step, 400 on enable: the code is wrong or was already used. The challenge may retry. */
  | 'TWO_FACTOR_CODE_INVALID'
  /** 401 on the login's second step: the challenge expired, was used or burnt by the 5th wrong code. Back to the password. */
  | 'TWO_FACTOR_CHALLENGE_EXPIRED'
  /** 429: 5 wrong codes in 5 minutes (login, enable, disable). */
  | 'TWO_FACTOR_LOCKED'
  /** 409 on setup and enable. */
  | 'TWO_FACTOR_ALREADY_ENABLED'
  /** 400 on enable without a setup. */
  | 'TWO_FACTOR_NOT_SET_UP'
  /** 400 on disable: wrong password or wrong code (one answer for both). */
  | 'TWO_FACTOR_CREDENTIALS_INVALID'
  /** 400 on disable when it is off. */
  | 'TWO_FACTOR_NOT_ENABLED'

/** `POST /auth/2fa/setup`: `otpauthUrl` goes in the QR, `secret` is the key for manual entry. Not on yet. */
export interface TwoFactorSetupResponse {
  otpauthUrl: string
  secret: string
}

/** `POST /auth/2fa/enable`: the 6 digits the app shows for the secret of the setup. */
export interface TwoFactorEnableRequest {
  code: string
}

/** The 10 recovery codes, one use each. Shown once: they are not answered again. */
export interface TwoFactorEnableResponse {
  recoveryCodes: string[]
}

/** `POST /auth/2fa/disable`: the current password plus the app's 6 digits or a recovery code. */
export interface TwoFactorDisableRequest {
  password: string
  code: string
}

export interface TwoFactorDisableResponse {
  twoFactorEnabled: false
}

/**
 * `POST /hierarchy/users/:id/2fa/reset` (Owner or SuperAdmin, for their people) and `POST /platform/owners/:id/2fa/reset`
 * (Developer, for Owners): the account's next login asks only for the password.
 */
export interface TwoFactorResetResponse {
  id: number
  twoFactorEnabled: false
}
