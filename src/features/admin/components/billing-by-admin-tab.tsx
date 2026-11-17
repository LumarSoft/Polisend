'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, PauseCircle, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AdminBilling, BillingNumber, PlanOffer } from '@/types/api/billing'
import { useBillingByAdmin, useBillingOverview } from '../hooks/use-billing'
import { numberLabel } from '../lib/number-label'
import { tokens } from '../lib/tokens'
import { ConsumptionBar, PlanSelect } from './billing-number-parts'
import { HEAD, int, MonthPicker, thisMonth, TokensHint } from './billing-ui'

const SHOWN_CODES = 6

/** The tokens used and included by a list of numbers. */
function totalsOf(numbers: BillingNumber[]): { used: number; included: number } {
  return numbers.reduce(
    (sum, row) => ({ used: sum.used + row.messagesUsed, included: sum.included + row.includedMessages }),
    { used: 0, included: 0 },
  )
}

function NumbersTable({ numbers, plans }: { numbers: BillingNumber[]; plans: PlanOffer[] | null }) {
  if (numbers.length === 0) {
    return <p className="px-5 py-4 text-[13px] text-muted-foreground">Ningún número se factura a sus códigos.</p>
  }
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow className="border-line-2 hover:bg-transparent">
            <TableHead className={`h-10 pl-5 ${HEAD}`}>Número</TableHead>
            <TableHead className={HEAD}>Plan del mes</TableHead>
            <TableHead className={HEAD}>Tokens usados</TableHead>
            {plans && <TableHead className={`pr-5 ${HEAD}`}>Plan asignado</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {numbers.map(row => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-normal pl-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[13px] text-ink">{numberLabel(row)}</span>
                  {!row.isActive && (
                    <Badge variant="outline" className="border-line-2 text-[10px] text-muted-foreground">
                      inactivo
                    </Badge>
                  )}
                  {row.limit?.paused && (
                    <Badge variant="outline" className="gap-1 border-amber/50 text-[10px] text-ink-3">
                      <PauseCircle className="size-3" /> asistente en pausa
                    </Badge>
                  )}
                </div>
                <div className="text-[11.5px] text-muted-foreground">
                  {row.responsibleCode
                    ? `Productor ${row.responsibleCode.code}${row.responsibleCode.holderName ? ` · ${row.responsibleCode.holderName}` : ''}`
                    : 'Sin productor responsable'}
                </div>
              </TableCell>
              <TableCell className="text-[13px] text-ink-3">
                {row.plan.trial ? `Prueba · ${tokens(row.plan.includedMessages)}` : row.plan.name}
              </TableCell>
              <TableCell className="min-w-[200px]">
                <ConsumptionBar row={row} />
              </TableCell>
              {plans && (
                <TableCell className="pr-5">
                  <PlanSelect row={row} plans={plans} showLabel={false} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface BlockProps {
  title: string
  subtitle?: string | null
  codes?: AdminBilling['codes']
  numbers: BillingNumber[]
  plans: PlanOffer[] | null
}

/** One Admin (or «Sin administrador») with its numbers, open by default. */
function AdminBlock({ title, subtitle, codes, numbers, plans }: BlockProps) {
  const [open, setOpen] = useState(true)
  const Chevron = open ? ChevronDown : ChevronRight
  const { used, included } = totalsOf(numbers)
  const percent = included > 0 ? Math.min(100, Math.round((used / included) * 100)) : 0
  const extraCodes = (codes?.length ?? 0) - SHOWN_CODES

  return (
    <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
      >
        <span className="flex min-w-0 items-start gap-2">
          <Chevron className="mt-1 size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[14.5px] font-semibold text-ink">
              <UserRound className="size-4 text-ember-2" />
              {title}
            </span>
            {subtitle && <span className="block truncate text-[12px] text-muted-foreground">{subtitle}</span>}
            {codes && codes.length > 0 && (
              <span className="mt-1.5 flex flex-wrap gap-1">
                {codes.slice(0, SHOWN_CODES).map(code => (
                  <span
                    key={code.id}
                    title={code.name ?? undefined}
                    className="rounded-md border border-line-2 bg-secondary/60 px-1.5 py-0.5 text-[11px] font-medium text-ink-3"
                  >
                    {code.code}
                  </span>
                ))}
                {extraCodes > 0 && <span className="px-1 text-[11px] text-muted-foreground">+{extraCodes}</span>}
              </span>
            )}
          </span>
        </span>
        <span className="w-full max-w-[240px] sm:w-56">
          <span className="block h-2 overflow-hidden rounded-full bg-line-2">
            <span
              className={`block h-full rounded-full ${percent >= 80 ? 'bg-amber' : 'bg-ember'}`}
              style={{ width: `${percent}%` }}
            />
          </span>
          <span className="mt-1 block text-[12px] text-ink-3">
            <span className="font-semibold text-ink">{int(used)}</span> de {tokens(included)} ·{' '}
            {numbers.length === 1 ? '1 número' : `${int(numbers.length)} números`}
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-line-2">
          <NumbersTable numbers={numbers} plans={plans} />
        </div>
      )}
    </Card>
  )
}

/**
 * Facturación › Por administrador (SuperAdmin, and an Owner inside a principal): each Admin of the principal with the
 * numbers billed to its codes, their tokens against the plan's and, in the running month, the plan selector. A number
 * whose code several Admins share shows under each of them; the numbers no Admin has close the list.
 */
export function BillingByAdminTab() {
  const [period, setPeriod] = useState(thisMonth)
  const { data, isLoading, isError } = useBillingByAdmin(period)
  // The catalog to choose from (the same for every number), only for the running month.
  const running = period === thisMonth()
  const { data: overview } = useBillingOverview(thisMonth(), running)
  const plans = running && overview ? overview.plans : null

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <MonthPicker id="by-admin-period" value={period} onChange={setPeriod} />
        <TokensHint />
      </div>
      <p className="mb-4 max-w-2xl text-[13px] text-muted-foreground">
        Cada Admin con los números que se facturan a sus códigos. Si varios Admin comparten un código, el número aparece
        debajo de cada uno. {running ? 'El plan de cada número se cambia acá mismo.' : ''}
      </p>

      {isError && <p className="mb-4 text-[14px] text-destructive">No se pudo cargar el consumo por administrador.</p>}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      )}
      {data && data.admins.length === 0 && data.unassigned.length === 0 && (
        <Card className="border-line-2 p-8 text-center text-[14px] text-muted-foreground">
          No hay números de WhatsApp en este principal.
        </Card>
      )}
      {data && (
        <div className="flex flex-col gap-3">
          {data.admins.map(admin => (
            <AdminBlock
              key={admin.userId}
              title={admin.name || admin.email}
              subtitle={admin.name ? admin.email : null}
              codes={admin.codes}
              numbers={admin.numbers}
              plans={plans}
            />
          ))}
          {data.unassigned.length > 0 && (
            <AdminBlock
              title="Sin administrador"
              subtitle="Ningún Admin tiene el código responsable de estos números."
              numbers={data.unassigned}
              plans={plans}
            />
          )}
        </div>
      )}
    </>
  )
}
