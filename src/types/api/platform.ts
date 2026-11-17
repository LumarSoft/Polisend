/**
 * The Developer's structure screens under `/platform/*`: zones and Owners. (Organizations live in `organizations.ts`,
 * billing in `billing.ts`.) The platform never chooses a password: new accounts are invited by a mailed link.
 */

/** `GET /platform/zones`: every zone, with its Owners and principals. */
export interface PlatformZone {
  id: number
  name: string
  code: string | null
  owners: Array<{ id: number; name: string | null; email: string }>
  principals: Array<{ id: number; name: string; isActive: boolean }>
}

/** `GET /platform/owners`: every Owner with its own principal and its live zones. */
export interface PlatformOwner {
  id: number
  name: string | null
  email: string
  createdAt: string
  twoFactorEnabled: boolean
  /** Its own principal. */
  home: { id: number; name: string }
  zones: Array<{ id: number; name: string; code: string | null }>
}

/** Invite a new Owner (no password: it gets a link to choose one). */
export interface InviteOwnerRequest {
  /** 1–80 characters. */
  name: string
  email: string
  /** A live principal: its own one. */
  homeProducerId: number
  /** Live zones, unique (may be empty). */
  zoneIds: number[]
}

/** Convert a live SuperAdmin or Admin into an Owner: keeps its password and its organization as home. */
export interface ConvertToOwnerRequest {
  existingUserId: number
  zoneIds: number[]
}

/** `POST /platform/owners`. */
export type CreateOwnerRequest = InviteOwnerRequest | ConvertToOwnerRequest

export interface CreateOwnerResponse extends PlatformOwner {
  /** True for a new account (invited), false for a conversion. */
  invitationSent: boolean
}

/** `PATCH /platform/owners/:id`: never a password or a different e-mail (403 PLATFORM_CANNOT_SET_CREDENTIALS). */
export interface UpdateOwnerRequest {
  name?: string
  /** Replaces them wholesale; [] = only its own principal. */
  zoneIds?: number[]
}

/** `DELETE /platform/owners/:id`: back to SuperAdmin of its own principal (not deleted). */
export interface DemoteOwnerResponse {
  id: number
  role: 'SUPERADMIN'
  producerId: number
}
