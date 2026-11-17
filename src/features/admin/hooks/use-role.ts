import type { AdminRole } from '@/types/api/auth'
import {
  canManageOrgRole,
  isAdminRole,
  isDeveloperRole,
  isOwnerRole,
  isSuperAdminRole,
  seesMoneyRole,
} from '../lib/roles'
import { useProfile } from './use-profile'

export interface RoleFlags {
  role: AdminRole | null
  /** Lumar: the platform screens only (Organizaciones, Owners y zonas, Facturación, …), never a cartera. */
  isDeveloper: boolean
  /** The owner of a network: "Mi red" plus the SuperAdmin screens of its acting principal. */
  isOwner: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  /** Manages the principal it is in (users, numbers, plans, settings): SuperAdmin, or Owner inside a principal. */
  canManageOrg: boolean
  /** Sees amounts in USD: only the Developer. */
  seesMoney: boolean
  isLoading: boolean
}

/** The logged-in user's role, from the profile (/users/me): the API re-reads it on every request. */
export function useRole(): RoleFlags {
  const { data, isLoading } = useProfile()
  const role = data?.role ?? null
  return {
    role,
    isDeveloper: isDeveloperRole(role),
    isOwner: isOwnerRole(role),
    isSuperAdmin: isSuperAdminRole(role),
    isAdmin: isAdminRole(role),
    canManageOrg: canManageOrgRole(role),
    seesMoney: seesMoneyRole(role),
    isLoading,
  }
}
