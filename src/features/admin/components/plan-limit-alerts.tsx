'use client'

import { useBillingOverview } from '../hooks/use-billing'
import { useTenantQueriesEnabled } from '../hooks/use-tenant-queries'
import { PlanLimitActions } from './plan-limit-actions'

/** Inicio: every number of the user whose assistant is paused at its plan's limit, with the choice. */
export function PlanLimitAlerts() {
  const { data } = useBillingOverview(undefined, useTenantQueriesEnabled())
  const paused = data?.numbers.filter(n => n.limit?.paused) ?? []
  if (paused.length === 0) return null
  return (
    <div className="mt-6 flex flex-col gap-3">
      {paused.map(row => (
        <PlanLimitActions key={row.id} row={row} showNumber />
      ))}
    </div>
  )
}
