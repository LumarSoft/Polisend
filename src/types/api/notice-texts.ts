/** The notices an organization can write its own text for: Rechazos and Vencidas. */
export type NoticeTextKind = 'payment_rejection' | 'policy_expiry'

/** Meta's review of the organization's current text in one WhatsApp account. */
export type NoticeTextStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_SUBMITTED' | 'ERROR' | 'UNKNOWN'

/**
 * What the account's numbers send today: the current text, an earlier one of the same scope (the current is in
 * review), the organization's general text (for a number), the platform's, nothing (no text approved there), or null
 * when Meta could not be asked.
 */
export type NoticeTextSending = 'own' | 'previous' | 'general' | 'platform' | 'none' | null

/** Whose text: a number's (PhoneNumber id), the general one (null), or the user's default (undefined). */
export type NoticeTextScope = number | null | undefined

/** One of the texts the user can open: the organization's general one or a number's. */
export interface NoticeTextScopeOption {
  numberId: number | null
  label: string
  /** It has a text of its own (else it sends the general one, or the platform's). */
  hasOwn: boolean
  editable: boolean
}

export interface NoticeTextAccount {
  id: number
  wabaName: string | null
  /** As displayed ("+54 9 341 275-7294 · 27 de Febrero"). */
  numbers: string[]
  status: NoticeTextStatus
  reason: string | null
  /** Meta filed it as marketing instead of service. */
  marketing: boolean
  sending: NoticeTextSending
}

export interface NoticeTextPlaceholder {
  key: string
  label: string
  example: string
}

export interface NoticeText {
  kind: NoticeTextKind
  placeholders: NoticeTextPlaceholder[]
  /** The platform's text, with the data between braces: where the editor starts. */
  defaultBody: string
  /** What the user can open: the general text and their numbers. */
  scopes: NoticeTextScopeOption[]
  /** The scope shown (null = general). */
  numberId: number | null
  /** The user may change this scope's text. */
  editable: boolean
  /** The scope's own current text; null = it sends `fallback`. */
  custom: {
    version: number
    title: string | null
    body: string
    createdAt: string
    createdBy: { name: string | null; email: string } | null
  } | null
  /** What the scope sends without a text of its own: the general text (for a number), else the platform's. */
  fallback: { source: 'general' | 'platform'; title: string | null; body: string }
  /** Meta's review in each account the scope sends from; empty while it has no text of its own. */
  accounts: NoticeTextAccount[]
}

export interface UpdateNoticeTextRequest {
  /** Empty = no title. */
  title: string
  body: string
  /** The number whose text it is; null = the general one. */
  phoneNumberId: number | null
}
