import { useActingPrincipal } from '../context/acting-principal-context'
import { isOwnerRole, isTenantRole } from '../lib/roles'
import { useRole } from './use-role'

/**
 * Whether the panel may load a principal's own data (cartera, inbox, tasks, counters, plan features, the assistant…):
 * never for the Developer, and for an Owner only while a principal is chosen. Shell-level queries that run on every
 * screen pass it as their `enabled`.
 */
export function useTenantQueriesEnabled(): boolean {
  const { role } = useRole()
  const { hasPrincipal } = useActingPrincipal()
  if (!isTenantRole(role)) return false
  return !isOwnerRole(role) || hasPrincipal
}
