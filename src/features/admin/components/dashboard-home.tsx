'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { AlertTriangle, Bot, FileText, ShieldAlert, Users, Wallet, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/features/admin/lib/asegurados-ui'
import { useDashboard, useZoneDashboard } from '../hooks/use-dashboard'
import { useActingPrincipal } from '../context/acting-principal-context'
import { SectionScopeFilter } from './section-scope-filter'
import { RequirePrincipal } from './require-principal'
import { useScopeFilterState } from '../hooks/use-scope-filter-state'
import { useTenantQueriesEnabled } from '../hooks/use-tenant-queries'
import type { DashboardData } from '@/types/api/dashboard'
import { PlanLimitAlerts } from './plan-limit-alerts'
import { useRole } from '../hooks/use-role'
import { AskAssistantButton } from './assistant-launcher'

// Recharts is heavy and never needed on first paint — load it lazily.
const DashboardCharts = dynamic(() => import('./dashboard-charts').then(m => m.DashboardCharts), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
})

type KpiTone = 'ember' | 'emerald' | 'red' | 'amber'

interface Kpi {
  key: string
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: KpiTone
  /** What the assistant is asked from the card's corner. */
  ask?: string
}

/** The questions behind each card: the card says how much, the assistant says why and what to do. */
const KPI_QUESTIONS: Record<string, string> = {
  asegurados: '¿Cómo viene la cartera: pólizas vigentes, negocio nuevo y renovación del mes?',
  solicitudes: '¿Qué solicitudes nuevas hay y cuáles conviene atender primero?',
  deuda: 'Explicame la deuda por cobrar: cuánto está vencido, de qué productores y con cuánto atraso.',
  siniestros: '¿Qué siniestros abiertos necesitan atención y qué falta en cada uno?',
}

const TONES: Record<KpiTone, string> = {
  ember: 'border-ember-ring bg-ember-soft text-ember-2',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  amber: 'bg-amber/15 text-amber-700 dark:text-amber',
}

function buildKpis(data: DashboardData): Kpi[] {
  const { kpis } = data
  return [
    {
      key: 'asegurados',
      label: 'Asegurados',
      value: String(kpis.insuredClients),
      hint: 'Clientes activos',
      icon: Users,
      tone: 'ember',
    },
    {
      key: 'solicitudes',
      label: 'Solicitudes nuevas',
      value: String(kpis.newRequests),
      hint: 'Sin contactar todavía',
      icon: FileText,
      tone: 'emerald',
    },
    {
      key: 'deuda',
      label: 'Deuda por cobrar',
      value: formatCurrency(kpis.totalDebt),
      hint: `${kpis.overdueInstallments} cuotas vencidas`,
      icon: Wallet,
      tone: 'red',
    },
    {
      key: 'siniestros',
      label: 'Siniestros abiertos',
      value: String(kpis.openClaims),
      hint: 'Pendientes o en proceso',
      icon: ShieldAlert,
      tone: 'amber',
    },
  ]
}

/**
 * The Owner's Inicio (Lucas, 18/11/2026): counts only, so it sees the panel is used in the principal: insured clients,
 * new requests, how much the bot attends this month and open claims. No amount.
 */
function buildOwnerKpis(data: DashboardData): Kpi[] {
  const { kpis, bot } = data
  const botKpi: Kpi = {
    key: 'bot',
    label: 'Uso del bot',
    value: bot?.rate == null ? '—' : `${bot.rate}%`,
    hint:
      !bot || bot.conversations === 0
        ? 'Sin conversaciones este mes'
        : `${bot.handledByBot} de ${bot.conversations} chats del mes sin pedir una persona`,
    icon: Bot,
    tone: 'emerald',
  }
  return [
    {
      key: 'asegurados',
      label: 'Asegurados',
      value: String(kpis.insuredClients),
      hint: 'Clientes activos',
      icon: Users,
      tone: 'ember',
    },
    {
      key: 'solicitudes',
      label: 'Solicitudes nuevas',
      value: String(kpis.newRequests),
      hint: 'Sin contactar todavía',
      icon: FileText,
      tone: 'amber',
    },
    botKpi,
    {
      key: 'siniestros',
      label: 'Siniestros abiertos',
      value: String(kpis.openClaims),
      hint: 'Pendientes o en proceso',
      icon: ShieldAlert,
      tone: 'red',
    },
  ]
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon
  const question = kpi.ask ?? KPI_QUESTIONS[kpi.key]
  return (
    <Card className="group/kpi relative border-line-2 p-4 shadow-sm">
      {question && (
        <AskAssistantButton
          question={question}
          label={`Preguntarle al asistente por ${kpi.label.toLowerCase()}`}
          variant="icon"
          className="absolute top-3 right-3 opacity-60 transition-opacity group-hover/kpi:opacity-100 focus-visible:opacity-100"
        />
      )}
      <span
        className={`flex size-10 items-center justify-center rounded-xl border border-transparent ${TONES[kpi.tone]}`}
      >
        <Icon className="size-5" />
      </span>
      <CardContent className="mt-3 p-0">
        <div className="font-display text-[28px] leading-none text-ink">{kpi.value}</div>
        <div className="mt-1.5 text-[13px] font-medium text-ink">{kpi.label}</div>
        <div className="text-[12px] text-muted-foreground">{kpi.hint}</div>
      </CardContent>
    </Card>
  )
}

function KpiRow({ data, owner }: { data: DashboardData; owner: boolean }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {(owner ? buildOwnerKpis(data) : buildKpis(data)).map(kpi => (
        <KpiCard key={kpi.key} kpi={kpi} />
      ))}
    </div>
  )
}

function ChartsSkeleton() {
  return (
    <div className="mt-5 grid gap-4">
      <Skeleton className="h-[360px] rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[320px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[122px] rounded-xl" />
        ))}
      </div>
      <ChartsSkeleton />
    </>
  )
}

export function DashboardHome() {
  // Opens on the office line for a SuperAdmin; see useScopeFilterState.
  const [scope, setScope] = useScopeFilterState()
  const { isOwner } = useRole()
  const acting = useActingPrincipal()
  // An Owner with a zone and «Todos»: the whole zone added up instead of one principal.
  const zoneId = isOwner && !acting.hasPrincipal && typeof acting.zone?.key === 'number' ? acting.zone.key : null
  const tenant = useTenantQueriesEnabled()
  const { data, isLoading, isError, refetch } = useDashboard(scope, tenant && zoneId === null)
  const zoneQuery = useZoneDashboard(zoneId)

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">Dashboard</div>
          <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] tracking-[-0.035em] text-ink">
            Hola de nuevo 👋
          </h1>
          <p className="mt-2 text-[14.5px] text-muted-foreground">
            {isOwner
              ? `Cuánto se usa el panel en ${zoneId !== null ? 'toda la zona' : 'este principal'}: asegurados, solicitudes, el bot y siniestros. Solo cantidades.`
              : 'Un resumen en vivo de tu operación: asegurados, solicitudes, cobranzas y siniestros.'}
          </p>
          {!isOwner && (
            <AskAssistantButton
              question="Resumime lo más importante de hoy: pendientes, deuda vencida, pólizas que vencen y siniestros abiertos."
              label="Resumime el día"
              className="mt-3"
            />
          )}
        </div>
        <SectionScopeFilter value={scope} onChange={setScope} allowZoneTotal={isOwner} />
      </motion.div>

      {zoneId !== null ? (
        <ZoneTotal zoneName={acting.zone?.name ?? ''} query={zoneQuery} />
      ) : (
        <RequirePrincipal showFilter={false}>
          <PlanLimitAlerts />

          {isLoading ? <DashboardSkeleton /> : null}

          {isError ? (
            <Card className="mt-8 border-line-2 shadow-sm">
              <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  <AlertTriangle className="size-6" />
                </span>
                <div>
                  <h2 className="font-display text-[20px] text-ink">No pudimos cargar las métricas</h2>
                  <p className="mx-auto mt-1.5 max-w-[380px] text-[13.5px] text-muted-foreground">
                    Revisá tu conexión e intentá de nuevo.
                  </p>
                </div>
                <button
                  onClick={() => refetch()}
                  className="rounded-lg border border-ember-ring bg-ember-soft px-4 py-2 text-[13px] font-medium text-ember-2 transition-colors hover:bg-ember/15"
                >
                  Reintentar
                </button>
              </CardContent>
            </Card>
          ) : null}

          {data ? (
            <>
              <KpiRow data={data} owner={isOwner} />
              <DashboardCharts data={data} amounts={!isOwner} />
            </>
          ) : null}
        </RequirePrincipal>
      )}
    </div>
  )
}

/** The Owner's Inicio for a whole zone: the counts of every principal of it added up, no amount. */
function ZoneTotal({ zoneName, query }: { zoneName: string; query: ReturnType<typeof useZoneDashboard> }) {
  const { data, isLoading, isError, refetch } = query
  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) {
    return (
      <Card className="mt-8 border-line-2 shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <h2 className="font-display text-[20px] text-ink">No pudimos sumar la zona</h2>
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-ember-ring bg-ember-soft px-4 py-2 text-[13px] font-medium text-ember-2 transition-colors hover:bg-ember/15"
          >
            Reintentar
          </button>
        </CardContent>
      </Card>
    )
  }
  return (
    <>
      <p className="mt-6 text-[13px] text-muted-foreground">
        Toda la zona {zoneName} sumada: sus principales y sus productores independientes. Solo cantidades.
      </p>
      <KpiRow data={data} owner />
      <DashboardCharts data={data} amounts={false} />
    </>
  )
}
