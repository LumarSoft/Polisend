'use client'

import { Fragment, useState } from 'react'
import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { NetworkUsage, NetworkUsageNumber, NetworkUsagePrincipal, NetworkUsageTotals } from '@/types/api/hierarchy'
import { useHierarchyPrincipals, useNetworkUsage } from '../hooks/use-hierarchy'
import { useRole } from '../hooks/use-role'
import { NO_ZONE, noZoneLabel, type ZoneKey } from '../lib/network'
import { numberLabel } from '../lib/number-label'
import { HEAD, int, Kpi, MonthPicker, thisMonth } from './billing-ui'
import { EMPTY_NETWORK_FILTER, NetworkFilter, type NetworkListFilterValue } from './network-filter'

interface UsageGroup {
  key: ZoneKey
  name: string
  principals: NetworkUsagePrincipal[]
}

const ZERO: NetworkUsageTotals = { numbers: 0, consumedMessages: 0, sentMessages: 0, campaignMessages: 0 }

function addTotals(a: NetworkUsageTotals, b: NetworkUsageTotals): NetworkUsageTotals {
  return {
    numbers: a.numbers + b.numbers,
    consumedMessages: a.consumedMessages + b.consumedMessages,
    sentMessages: a.sentMessages + b.sentMessages,
    campaignMessages: a.campaignMessages + b.campaignMessages,
  }
}

function groupsOf(usage: NetworkUsage, isDeveloper: boolean): UsageGroup[] {
  const groups: UsageGroup[] = usage.zones.map(zone => ({ key: zone.id, name: zone.name, principals: zone.principals }))
  const outside = [...(usage.home ? [usage.home] : []), ...usage.unzoned]
  if (outside.length) groups.push({ key: NO_ZONE, name: noZoneLabel(isDeveloper), principals: outside })
  return groups
}

/** A principal's numbers billed to one productor (its responsible code), with their totals. */
function onlyCode(principal: NetworkUsagePrincipal, code: string): NetworkUsagePrincipal {
  const numbers = principal.numbers.filter(row => row.responsibleCode?.code === code)
  const totals = numbers.reduce(
    (sum, row) =>
      addTotals(sum, {
        numbers: 1,
        consumedMessages: row.consumedMessages,
        sentMessages: row.sentMessages,
        campaignMessages: row.campaignMessages,
      }),
    ZERO,
  )
  return { ...principal, numbers, totals }
}

/** `code`: the chosen productor's code (only with a principal chosen), or null for every one. */
function filterGroups(groups: UsageGroup[], filter: NetworkListFilterValue, code: string | null): UsageGroup[] {
  return groups
    .filter(group => filter.zoneKey === null || group.key === filter.zoneKey)
    .map(group =>
      filter.principalId === null
        ? group
        : {
            ...group,
            principals: group.principals
              .filter(p => p.id === filter.principalId)
              .map(p => (code === null ? p : onlyCode(p, code))),
          },
    )
    .filter(group => group.principals.length > 0)
}

function PlanBar({ row }: { row: NetworkUsageNumber }) {
  const percent = Math.min(100, Math.max(0, row.percentUsed))
  const tone = row.limitReached ? 'bg-destructive' : row.percentUsed >= 80 ? 'bg-amber' : 'bg-ember'
  return (
    <div className="min-w-[160px]">
      <div className="h-2 w-full overflow-hidden rounded-full bg-line-2">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1 text-[12px] text-ink-3">
        <span className="font-semibold text-ink">{int(row.consumedMessages)}</span> de {int(row.planMessages)} ·{' '}
        {int(Math.round(row.percentUsed))}%
      </div>
    </div>
  )
}

function NumberRow({ row }: { row: NetworkUsageNumber }) {
  return (
    <TableRow>
      <TableCell className="whitespace-normal pl-10">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[13px] text-ink">{numberLabel(row)}</span>
          {!row.isActive && (
            <Badge variant="outline" className="border-line-2 text-[10px] text-muted-foreground">
              inactivo
            </Badge>
          )}
          {row.paused ? (
            <Badge variant="outline" className="border-destructive/40 text-[10px] text-destructive">
              asistente en pausa
            </Badge>
          ) : (
            row.limitReached && (
              <Badge variant="outline" className="border-amber-border text-[10px] text-amber-700 dark:text-amber-400">
                llegó al límite
              </Badge>
            )
          )}
        </div>
        {row.responsibleCode && (
          <div className="text-[11.5px] text-muted-foreground">
            {row.responsibleCode.code}
            {row.responsibleCode.holderName ? ` · ${row.responsibleCode.holderName}` : ''}
          </div>
        )}
      </TableCell>
      <TableCell className="text-[13px] text-ink-3">{row.plan ?? '—'}</TableCell>
      <TableCell>
        <PlanBar row={row} />
      </TableCell>
      <TableCell className="text-right text-[13px] text-ink-3">{int(row.sentMessages)}</TableCell>
      <TableCell className="pr-5 text-right text-[13px] text-ink-3">{int(row.campaignMessages)}</TableCell>
    </TableRow>
  )
}

function PrincipalRows({ principal }: { principal: NetworkUsagePrincipal }) {
  return (
    <>
      <TableRow className="bg-secondary/40 hover:bg-secondary/40">
        <TableCell className="whitespace-normal pl-6 text-[13.5px] font-medium text-ink">
          <span className="flex flex-wrap items-center gap-1.5">
            {principal.name}
            {principal.isHome && (
              <Badge variant="secondary" className="text-[10px]">
                Tu principal
              </Badge>
            )}
            {!principal.isActive && (
              <Badge variant="outline" className="border-line-2 text-[10px] text-muted-foreground">
                Inactivo
              </Badge>
            )}
          </span>
        </TableCell>
        <TableCell className="text-[12px] text-muted-foreground">
          {principal.totals.numbers === 1 ? '1 número' : `${int(principal.totals.numbers)} números`}
        </TableCell>
        <TableCell className="text-[12px] text-muted-foreground">
          {int(principal.totals.consumedMessages)} del plan
        </TableCell>
        <TableCell className="text-right text-[13px] font-medium text-ink">
          {int(principal.totals.sentMessages)}
        </TableCell>
        <TableCell className="pr-5 text-right text-[13px] font-medium text-ink">
          {int(principal.totals.campaignMessages)}
        </TableCell>
      </TableRow>
      {principal.numbers.length === 0 ? (
        <TableRow>
          <TableCell colSpan={5} className="pl-10 text-[12.5px] text-muted-foreground">
            Sin números este mes.
          </TableCell>
        </TableRow>
      ) : (
        principal.numbers.map(row => <NumberRow key={row.id} row={row} />)
      )}
    </>
  )
}

const PAGE = 'mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10'

/**
 * "Consumo de la red" (plan §6.2): every number of the Owner's network by Zona → Principal → Número for a month, in
 * message counts only (plan by name, the plan's messages with its bar, sent and campaign messages). No amount at all:
 * `GET /hierarchy/usage` has no field for one.
 */
export function NetworkUsageView() {
  const { isOwner, isDeveloper, isLoading: roleLoading } = useRole()
  const [period, setPeriod] = useState(thisMonth)
  const [filter, setFilter] = useState<NetworkListFilterValue>(EMPTY_NETWORK_FILTER)
  const { data, isLoading, isError } = useNetworkUsage(period, isOwner)
  // The Productor level: a number belongs to the productor it is billed to (its responsible code).
  const { data: principals = [] } = useHierarchyPrincipals(isOwner)
  const code =
    principals.find(p => p.id === filter.principalId)?.codes.find(c => c.id === filter.producerCodeId)?.code ?? null

  if (!roleLoading && !isOwner) {
    return (
      <div className={PAGE}>
        <p className="text-[14px] text-muted-foreground">«Consumo de la red» es la pantalla de los Owners.</p>
      </div>
    )
  }

  const groups = data ? filterGroups(groupsOf(data, isDeveloper), filter, code) : []
  const filtered = filter.zoneKey !== null || filter.principalId !== null
  const totals = !data
    ? null
    : filtered
      ? groups.flatMap(group => group.principals).reduce((sum, p) => addTotals(sum, p.totals), ZERO)
      : data.totals

  return (
    <div className={PAGE}>
      <div className="mb-6">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">Mi red</div>
        <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">
          Consumo de la red
        </h1>
        <p className="mt-1.5 max-w-2xl text-[14px] text-muted-foreground">
          Los mensajes de cada número de tu red, por zona y principal. Cada número tiene un plan de mensajes por mes: la
          barra muestra cuánto usó de su plan. Elegido un productor, se ven los números que se le facturan.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-4">
        <MonthPicker value={period} onChange={setPeriod} id="network-usage-period" />
        <NetworkFilter mode="network" value={filter} onChange={setFilter} />
      </div>

      {data?.closed && (
        <p className="mb-4 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
          <Lock className="size-3.5 shrink-0" />
          Mes cerrado: se muestra como quedó el 1 del mes siguiente.
        </p>
      )}
      {isError && <p className="mb-4 text-[14px] text-destructive">No se pudo cargar el consumo de la red.</p>}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !totals ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)
        ) : (
          <>
            <Kpi label="Números" value={int(totals.numbers)} hint="Los números de la red en el mes" />
            <Kpi label="Mensajes enviados" value={int(totals.sentMessages)} hint="Cada mensaje cuenta una vez" />
            <Kpi label="De campaña" value={int(totals.campaignMessages)} hint="Incluidos en los enviados" />
            <Kpi
              label="Consumo de los planes"
              value={int(totals.consumedMessages)}
              hint="Lo que cuentan los planes de los números"
            />
          </>
        )}
      </div>

      <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="border-line-2 hover:bg-transparent">
                <TableHead className={`h-11 pl-5 ${HEAD}`}>Zona · Principal · Número</TableHead>
                <TableHead className={HEAD}>Plan</TableHead>
                <TableHead className={HEAD}>Mensajes del plan</TableHead>
                <TableHead className={`text-right ${HEAD}`}>Enviados</TableHead>
                <TableHead className={`pr-5 text-right ${HEAD}`}>De campaña</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="pl-5">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              )}
              {data && groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-[14px] text-muted-foreground">
                    {filtered ? 'Nada coincide con el filtro.' : 'Tu red todavía no tiene principales.'}
                  </TableCell>
                </TableRow>
              )}
              {groups.map(group => {
                const sum = group.principals.reduce((acc, p) => addTotals(acc, p.totals), ZERO)
                return (
                  <Fragment key={String(group.key)}>
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="pl-5 pt-5 font-display text-[16px] tracking-[-0.01em] text-ink">
                        {group.name}
                      </TableCell>
                      <TableCell className="pt-5 text-[12px] text-muted-foreground">
                        {sum.numbers === 1 ? '1 número' : `${int(sum.numbers)} números`}
                      </TableCell>
                      <TableCell className="pt-5 text-[12px] text-muted-foreground">
                        {int(sum.consumedMessages)} del plan
                      </TableCell>
                      <TableCell className="pt-5 text-right text-[13px] font-semibold text-ink">
                        {int(sum.sentMessages)}
                      </TableCell>
                      <TableCell className="pr-5 pt-5 text-right text-[13px] font-semibold text-ink">
                        {int(sum.campaignMessages)}
                      </TableCell>
                    </TableRow>
                    {group.principals.map(principal => (
                      <PrincipalRows key={principal.id} principal={principal} />
                    ))}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
