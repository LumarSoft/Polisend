'use client'

import { cn } from '@/lib/utils'
import { useActingPrincipal } from '../context/acting-principal-context'
import { useRole } from '../hooks/use-role'
import { NetworkFilter } from './network-filter'
import { ScopeFilter, type ScopeFilterValue } from './scope-filter'

interface SectionScopeFilterProps {
  value: ScopeFilterValue
  onChange: (value: ScopeFilterValue) => void
  className?: string
  /** Text of the "no filter" option of the SuperAdmin's and Admin's ScopeFilter. */
  allLabel?: string
  /** An Owner's Inicio: «Todos» at the principal level adds the whole zone up. */
  allowZoneTotal?: boolean
}

/**
 * The filter of a work screen, for every role: a SuperAdmin or Admin gets today's ScopeFilter; an Owner gets the
 * cascading Zona › Principal › Productor plus the principal's numbers. Pair it with `useScopeFilterState()` (which keeps
 * an Owner's productor across tabs) and wrap the screen's data in `<RequirePrincipal>`.
 */
export function SectionScopeFilter({ value, onChange, className, allLabel, allowZoneTotal }: SectionScopeFilterProps) {
  const { isOwner } = useRole()
  const { hasPrincipal } = useActingPrincipal()
  if (!isOwner) return <ScopeFilter value={value} onChange={onChange} className={className} allLabel={allLabel} />

  return (
    // max-w-full: next to a search box (a shrink-0 slot), the three levels wrap inside the header instead of overflowing.
    <div className={cn('flex max-w-full flex-wrap items-center gap-2', className)}>
      <NetworkFilter
        allowZoneTotal={allowZoneTotal}
        producerCodeId={value.producerCodeId ?? null}
        onProducerCodeChange={id => onChange(id !== null ? { producerCodeId: id } : {})}
      />
      {/* The numbers are the active principal's: none to list (nor load) without one. */}
      {hasPrincipal && <ScopeFilter value={value} onChange={onChange} numbersOnly allLabel="Todos los números" />}
    </div>
  )
}
