'use client'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api-client'
import type { BillingNumber, PlanOffer } from '@/types/api/billing'
import { useAssignPlan } from '../hooks/use-billing'
import { tokens } from '../lib/tokens'
import { int } from './billing-ui'

/** A number's tokens of the month against its plan's, with what is left. */
export function ConsumptionBar({ row }: { row: BillingNumber }) {
  const percent = Math.min(100, row.percentUsed)
  const tone = row.plan.trial ? 'bg-emerald-500 dark:bg-emerald-400' : row.percentUsed >= 80 ? 'bg-amber' : 'bg-ember'
  return (
    <div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-line-2">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-[12px]">
        <span className="text-ink-3">
          <span className="font-semibold text-ink">{int(row.messagesUsed)}</span> de {tokens(row.includedMessages)}
        </span>
        <span className="text-muted-foreground">quedan {int(row.remainingMessages)}</span>
      </div>
    </div>
  )
}

interface PlanSelectProps {
  row: Pick<BillingNumber, 'id' | 'assignedPlan'>
  /** The catalog's active plans (`/admin/billing` → `plans`). */
  plans: PlanOffer[]
  /** An Owner changing a number of another principal of its network: that principal goes with the request. */
  principalId?: number
  /** "Plan asignado" before the select (cards); off where a column already names it. */
  showLabel?: boolean
}

/**
 * The plan of a number for the running month (`PATCH /admin/billing/numbers/:id/plan`): SuperAdmin and Owner. The
 * caller shows it only for the running month and only to a role that may change it.
 */
export function PlanSelect({ row, plans, principalId, showLabel = true }: PlanSelectProps) {
  const assign = useAssignPlan()
  const paid = plans.filter(plan => !plan.isTrial)
  const current = row.assignedPlan?.trial ? '' : String(row.assignedPlan?.id ?? '')
  const select = (
    <div className="flex items-center gap-2">
      {assign.isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      <select
        id={`plan-${row.id}`}
        aria-label={showLabel ? undefined : 'Plan del número'}
        value={current}
        disabled={assign.isPending}
        onChange={event => {
          const planId = Number(event.target.value)
          if (!planId) return
          assign.mutate(
            { numberId: row.id, planId, principalId },
            {
              onSuccess: () => toast.success('Plan asignado'),
              onError: error =>
                toast.error(
                  error instanceof ApiError && error.status < 500 ? error.message : 'No se pudo asignar el plan',
                ),
            },
          )
        }}
        className="h-8 max-w-full rounded-md border border-line-2 bg-paper px-2 text-[13px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-ember-ring"
      >
        {current === '' && (
          <option value="">{row.assignedPlan?.trial ? 'Prueba (primer mes)' : 'Elegí un plan'}</option>
        )}
        {paid.map(plan => (
          <option key={plan.id} value={plan.id}>
            {plan.name} · {tokens(plan.messages)}
          </option>
        ))}
      </select>
    </div>
  )
  if (!showLabel) return select
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={`plan-${row.id}`} className="text-[11px] font-normal uppercase tracking-[0.12em] text-faint">
        Plan asignado
      </Label>
      {select}
    </div>
  )
}
