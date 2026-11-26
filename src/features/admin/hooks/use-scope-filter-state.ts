'use client'

import { useState } from 'react'
import type { ScopeFilterValue } from '../components/scope-filter'
import { useActingPrincipal } from '../context/acting-principal-context'
import { useProfile } from './use-profile'
import { useRole } from './use-role'

/**
 * The section filter of a work screen (a producer code OR a phone number, never both).
 *
 * - SuperAdmin: opens on the office line (the principal's default number, from /users/me) until they pick something
 *   else, "Todos" included.
 * - Owner: opens on all the acting principal's numbers ("Todos los números"), never on the office line; the productor
 *   is the cascading filter's, shared by every tab (`useActingPrincipal().selection.producerCodeId`); choosing a
 *   number clears it.
 * - Admin: no default: the API already limits them to their own numbers.
 */
export function useScopeFilterState(): [ScopeFilterValue, (value: ScopeFilterValue) => void] {
  const { canManageOrg, isOwner } = useRole()
  const { data: profile } = useProfile()
  const acting = useActingPrincipal()
  // Null until the user picks something: the default applies meanwhile.
  const [chosen, setChosen] = useState<ScopeFilterValue | null>(null)
  // The office line is the SuperAdmin's starting point; an Owner opens every principal on all its numbers.
  const defaultId = canManageOrg && !isOwner ? (profile?.organization?.defaultPhoneNumber?.id ?? null) : null
  const local = chosen ?? (defaultId != null ? { phoneNumberId: defaultId } : {})
  if (!isOwner) return [local, setChosen]

  const producerCodeId = acting.selection.producerCodeId
  // A group chosen at the level of a principal narrows every screen to its codes (with one of them, to that one).
  const group = acting.selection.groupId ? { codeGroupId: acting.selection.groupId } : {}
  const scope: ScopeFilterValue =
    producerCodeId !== null ? { producerCodeId, ...group } : acting.selection.groupId ? group : local
  const choose = (value: ScopeFilterValue) => {
    acting.selectProducerCode(value.producerCodeId ?? null)
    setChosen(value.phoneNumberId != null ? { phoneNumberId: value.phoneNumberId } : {})
  }
  return [scope, choose]
}
