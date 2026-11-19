/** The notices an organization can write its own text for: Rechazos and Vencidas. */
export type NoticeTextKind = 'payment_rejection' | 'policy_expiry'

/** Meta's review of the organization's current text in one WhatsApp account. */
export type NoticeTextStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_SUBMITTED' | 'ERROR' | 'UNKNOWN'

/**
 * What the account's numbers send today: the current text, an earlier one of the organization (the current is in
 * review), the platform's, nothing (no text approved there), or null when Meta could not be asked.
 */
export type NoticeTextSending = 'own' | 'previous' | 'platform' | 'none' | null

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
  /** The organization's current text; null = the platform's. */
  custom: {
    version: number
    title: string | null
    body: string
    createdAt: string
    createdBy: { name: string | null; email: string } | null
  } | null
  /** Meta's review in each account; empty while the organization uses the platform's text. */
  accounts: NoticeTextAccount[]
}

export interface UpdateNoticeTextRequest {
  /** Empty = no title. */
  title: string
  body: string
}
