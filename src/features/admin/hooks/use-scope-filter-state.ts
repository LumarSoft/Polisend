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
 * - Owner: the same inside its acting principal, except that the productor is the cascading filter's, shared by every
 *   tab (`useActingPrincipal().selection.producerCodeId`); choosing a number clears it.
 * - Admin: no default: the API already limits them to their own numbers.
 */
export function useScopeFilterState(): [ScopeFilterValue, (value: ScopeFilterValue) => void] {
  const { canManageOrg, isOwner } = useRole()
  const { data: profile } = useProfile()
  const acting = useActingPrincipal()
  // Null until the user picks something: the default applies meanwhile.
  const [chosen, setChosen] = useState<ScopeFilterValue | null>(null)
  const defaultId = canManageOrg ? (profile?.organization?.defaultPhoneNumber?.id ?? null) : null
  const local = chosen ?? (defaultId != null ? { phoneNumberId: defaultId } : {})
  if (!isOwner) return [local, setChosen]

  const producerCodeId = acting.selection.producerCodeId
  const scope: ScopeFilterValue = producerCodeId !== null ? { producerCodeId } : local
  const choose = (value: ScopeFilterValue) => {
    acting.selectProducerCode(value.producerCodeId ?? null)
    setChosen(value.phoneNumberId != null ? { phoneNumberId: value.phoneNumberId } : {})
  }
  return [scope, choose]
}
