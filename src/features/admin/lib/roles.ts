import type { AdminRole } from '@/types/api/auth'

/**
 * The panel's four roles (plan §4). This file and `hooks/use-role.ts` are the only places that name a role: every
 * other file asks `useRole()` or one of these functions.
 *
 * - DEVELOPER: Lumar, runs the platform (organizations, zones, Owners, plans, prices, costs, templates, status). Sees
 *   money and never enters a cartera.
 * - OWNER: the owner of a network of zones. Works one principal at a time (the acting principal) exactly as its
 *   SuperAdmin would, and never sees an amount.
 * - SUPERADMIN: runs one principal and sees all its codes.
 * - ADMIN: works the codes granted to it.
 */
export const ROLES = {
  developer: 'DEVELOPER',
  owner: 'OWNER',
  superAdmin: 'SUPERADMIN',
  admin: 'ADMIN',
} as const satisfies Record<string, AdminRole>

type MaybeRole = AdminRole | null | undefined

export function isDeveloperRole(role: MaybeRole): boolean {
  return role === ROLES.developer
}

export function isOwnerRole(role: MaybeRole): boolean {
  return role === ROLES.owner
}

export function isSuperAdminRole(role: MaybeRole): boolean {
  return role === ROLES.superAdmin
}

export function isAdminRole(role: MaybeRole): boolean {
  return role === ROLES.admin
}

/** Manages a principal: its users, numbers, plans and settings (the SuperAdmin, and the Owner inside it). */
export function canManageOrgRole(role: MaybeRole): boolean {
  return role === ROLES.superAdmin || role === ROLES.owner
}

/** Sees amounts in USD (prices, billed, costs, margin, settlement): only the Developer. */
export function seesMoneyRole(role: MaybeRole): boolean {
  return role === ROLES.developer
}

/** Works a cartera (clients, inbox, tasks, campaigns): every role but the Developer. */
export function isTenantRole(role: MaybeRole): boolean {
  return role === ROLES.owner || role === ROLES.superAdmin || role === ROLES.admin
}

/** How the panel names a role (menu footer, user lists). */
export function roleLabel(role: MaybeRole): string {
  switch (role) {
    case ROLES.developer:
      return 'Developer · Lumar'
    case ROLES.owner:
      return 'Owner'
    case ROLES.superAdmin:
      return 'SuperAdmin'
    case ROLES.admin:
      return 'Admin'
    default:
      return ''
  }
}

/** Where each role lands after logging in: the Developer in Organizaciones, the Owner in "Mi red", the rest in Inicio. */
export function homePathFor(role: MaybeRole): string {
  if (role === ROLES.developer) return '/admin/organizaciones'
  if (role === ROLES.owner) return '/admin/red'
  return '/admin'
}
