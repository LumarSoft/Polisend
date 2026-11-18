'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError } from '@/lib/api-client'
import type {
  BillingNumber,
  CatalogPlan,
  PlatformBillingOrganization,
  PlatformBillingTotals,
  PlanOffer,
} from '@/types/api/billing'
import { useBillingOverview, usePlatformBilling, usePlatformPlans, usePlanActions } from '../hooks/use-billing'
import { useRole } from '../hooks/use-role'
import { numberLabel } from '../lib/number-label'
import { tokens } from '../lib/tokens'
import { hasSharedZones, ownerGroupsOf, type BillingOwnerGroup } from '../lib/platform-billing-groups'
import { PlanLimitActions } from './plan-limit-actions'
import { ConsumptionBar, PlanSelect } from './billing-number-parts'
import { HEAD, int, Kpi, MonthPicker, thisMonth, TokensHint, usd } from './billing-ui'
import { BillingByAdminTab } from './billing-by-admin-tab'
import { LiquidacionTab } from './liquidacion-tab'
import { NetworkUsageView } from './network-usage-view'
import { RequirePrincipal } from './require-principal'
import { useUrlTab } from '../hooks/use-panel-link'

const price = (n: number) => (n === 0 ? 'Gratis' : usd(n))
const day = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' })

function failed(error: unknown, fallback: string) {
  toast.error(error instanceof ApiError && error.status < 500 ? error.message : fallback)
}

// ─── Number card (admin and SuperAdmin) ───────────────────────────────────────

function NumberCard({ row, plans, canAssign }: { row: BillingNumber; plans: PlanOffer[]; canAssign: boolean }) {
  const planLabel = row.plan.trial
    ? `Prueba · ${tokens(row.plan.includedMessages)} gratis`
    : `${row.plan.name} · ${tokens(row.plan.includedMessages)}`
  return (
    <Card className="flex flex-col gap-4 border-line-2 p-4 shadow-sm">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[14px] font-semibold tracking-wide text-ink">{numberLabel(row)}</span>
          {!row.isActive && (
            <Badge variant="outline" className="border-line-2 text-[10.5px] text-muted-foreground">
              Inactivo
            </Badge>
          )}
          {row.plan.trial && (
            <Badge className="bg-emerald-50 text-[10.5px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Sparkles className="size-3" /> Prueba
            </Badge>
          )}
          {row.upgraded && (
            <Badge className="bg-ember-soft text-[10.5px] text-ember-2">
              <ArrowUpRight className="size-3" /> Subió de plan
            </Badge>
          )}
        </div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">
          {row.responsibleCode ? `Productor ${row.responsibleCode.code}` : 'Sin productor responsable'}
        </div>
      </div>

      {canAssign && <PlanSelect row={row} plans={plans} />}

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.12em] text-faint">Plan del mes</span>
        <span className="text-right text-[13.5px] font-semibold text-ink">{planLabel}</span>
      </div>

      <ConsumptionBar row={row} />

      <PlanLimitActions row={row} />

      <div className="flex flex-col gap-1.5 border-t border-line-2 pt-3 text-[12.5px] text-muted-foreground">
        {row.movedUpAt && (
          <span className="flex items-start gap-1.5">
            <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-ember-2" />
            Pasó a {row.plan.name} el {day(row.movedUpAt)}.
          </span>
        )}
        {!row.limit?.paused && (
          <span className="flex items-start gap-1.5">
            <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-ember-2" />
            {row.nextPlan ? (
              <span>
                Al llegar a los {tokens(row.includedMessages)}, el asistente se pausa y se puede pasar a{' '}
                <span className="font-medium text-ink">{row.nextPlan.name}</span> ({tokens(row.nextPlan.messages)}).
              </span>
            ) : (
              <span>Todavía no hay planes.</span>
            )}
          </span>
        )}
      </div>
    </Card>
  )
}

function ConsumptionTab({ canAssign }: { canAssign: boolean }) {
  const [period, setPeriod] = useState(thisMonth)
  const { data, isLoading, isError } = useBillingOverview(period)
  const numbers = data?.numbers ?? []
  const largest = data?.plans.filter(plan => !plan.isTrial).at(-1)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <MonthPicker value={period} onChange={setPeriod} />
        <TokensHint />
      </div>
      {isLoading && (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      )}
      {isError && <p className="text-[14px] text-destructive">No se pudo cargar la facturación.</p>}
      {!isLoading && !isError && numbers.length === 0 && (
        <Card className="border-line-2 p-8 text-center text-[14px] text-muted-foreground">
          No hay números de WhatsApp a tu nombre todavía.
        </Card>
      )}
      {numbers.length > 0 && data && (
        <div className="grid gap-3 md:grid-cols-2">
          {numbers.map(row => (
            <NumberCard key={row.id} row={row} plans={data.plans} canAssign={canAssign && period === thisMonth()} />
          ))}
        </div>
      )}
      {largest && data && (
        <p className="mt-4 text-[12px] text-muted-foreground">
          Pasado el plan {largest.name}, se pueden sumar de a {tokens(data.blockMessages)} por mes.
        </p>
      )}
    </>
  )
}

// ─── Catalog, read-only (SuperAdmin) ───────────────────────────────────────────

function OfferTab() {
  const { data, isLoading } = useBillingOverview()
  const plans = data?.plans ?? []
  return (
    <>
      <p className="mb-4 max-w-xl text-[13px] text-muted-foreground">
        Los planes los define Polisend. Elegís el plan de cada número en Consumo o en Por administrador. Cuando un
        número llega a los tokens de su plan, su asistente se pausa y te avisamos para que elijas si pasa al plan
        siguiente.
      </p>
      <TokensHint className="mb-4" />
      <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-line-2 hover:bg-transparent">
              <TableHead className={`h-11 pl-5 ${HEAD}`}>Plan</TableHead>
              <TableHead className={`pr-5 text-right ${HEAD}`}>Tokens por mes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={2} className="pl-5">
                  <Skeleton className="h-4 w-40" />
                </TableCell>
              </TableRow>
            )}
            {plans.map(plan => (
              <TableRow key={plan.id}>
                <TableCell className="pl-5 text-[14px] font-medium text-ink">
                  {plan.name}
                  {plan.isTrial && (
                    <span className="ml-2 text-[11.5px] font-normal text-muted-foreground">
                      primer mes de una cuenta nueva
                    </span>
                  )}
                </TableCell>
                <TableCell className="pr-5 text-right text-[13px] text-ink-3">{int(plan.messages)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}

// ─── Catalog editor (owner) ────────────────────────────────────────────────────

interface PlanValues {
  name: string
  messages: number
  priceUsd: number
  isTrial: boolean
}

function PlanDialog({
  plan,
  pending,
  onSave,
  onClose,
}: {
  plan: CatalogPlan | null
  pending: boolean
  onSave: (values: PlanValues) => void
  onClose: () => void
}) {
  const [name, setName] = useState(plan?.name ?? '')
  const [messages, setMessages] = useState(plan ? String(plan.messages) : '')
  const [priceUsd, setPriceUsd] = useState(plan ? String(plan.priceUsd) : '')
  const [isTrial, setIsTrial] = useState(plan?.isTrial ?? false)
  const size = Number(messages)
  const amount = isTrial ? 0 : Number(priceUsd)
  const sizeOk = Number.isInteger(size) && size > 0
  const priceOk = isTrial || (priceUsd.trim() !== '' && Number.isFinite(amount) && amount >= 0)
  const valid = name.trim().length > 0 && sizeOk && priceOk
  const perToken = sizeOk && priceOk && amount > 0 ? amount / size : null
  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar plan' : 'Nuevo plan'}</DialogTitle>
          <DialogDescription>
            Lo usan todas las organizaciones, que lo ven en tokens y nunca su precio. El precio puede ser 0.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-name">Nombre</Label>
            <Input
              id="plan-name"
              value={name}
              maxLength={60}
              onChange={e => setName(e.target.value)}
              placeholder="Inicial"
              className="h-10 border-line-2 text-[13px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-messages">Tokens por mes</Label>
            <Input
              id="plan-messages"
              type="number"
              min={1}
              step={50}
              value={messages}
              onChange={e => setMessages(e.target.value)}
              placeholder="500"
              className="h-10 border-line-2 text-[13px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-price">Precio por mes (USD)</Label>
            <Input
              id="plan-price"
              type="number"
              min={0}
              step={0.5}
              value={isTrial ? '0' : priceUsd}
              disabled={isTrial}
              onChange={e => setPriceUsd(e.target.value)}
              placeholder="25"
              className="h-10 border-line-2 text-[13px]"
            />
            {perToken !== null && (
              <p className="text-[12px] text-muted-foreground">
                USD {perToken.toLocaleString('es-AR', { maximumFractionDigits: 4 })} por token
              </p>
            )}
          </div>
          <label className="flex items-start gap-2.5 rounded-lg border border-line-2 bg-secondary/40 px-3 py-2.5 text-[12.5px] text-ink-3">
            <input
              type="checkbox"
              checked={isTrial}
              onChange={e => setIsTrial(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--color-ember)]"
            />
            <span>
              <span className="font-medium text-ink">Plan de prueba.</span> Gratis, para el primer mes de los números de
              una cuenta nueva. Solo puede haber uno activo.
            </span>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="border-line-2">
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!valid || pending}
            onClick={() => onSave({ name: name.trim(), messages: size, priceUsd: amount, isTrial })}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PlatformPlansTab() {
  const { data, isLoading } = usePlatformPlans()
  const { createPlan, updatePlan, removePlan } = usePlanActions()
  const [editing, setEditing] = useState<CatalogPlan | null>(null)
  const [creating, setCreating] = useState(false)
  const [retiring, setRetiring] = useState<CatalogPlan | null>(null)
  const plans = data?.plans ?? []

  const save = (values: PlanValues) => {
    const done = (message: string) => () => {
      toast.success(message)
      setEditing(null)
      setCreating(false)
    }
    if (editing) {
      updatePlan.mutate(
        { id: editing.id, data: values },
        { onSuccess: done('Plan actualizado'), onError: error => failed(error, 'No se pudo guardar el plan') },
      )
    } else {
      createPlan.mutate(values, {
        onSuccess: done('Plan agregado'),
        onError: error => failed(error, 'No se pudo crear el plan'),
      })
    }
  }
  const toggle = (plan: CatalogPlan) =>
    updatePlan.mutate(
      { id: plan.id, data: { isActive: !plan.isActive } },
      { onError: error => failed(error, 'No se pudo cambiar el plan') },
    )
  const retire = () => {
    if (!retiring) return
    removePlan.mutate(retiring.id, {
      onSuccess: () => {
        toast.success('Plan retirado')
        setRetiring(null)
      },
      onError: error => failed(error, 'No se pudo retirar el plan'),
    })
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[13px] text-muted-foreground">
          El catálogo de toda la plataforma: lo usan todas las organizaciones y lo muestra la landing, siempre en tokens
          (1 mensaje = 1 token, un mensaje de campaña = 2) y sin precio. El SuperAdmin o el Owner eligen el plan de cada
          número. Al llegar al límite, el asistente del número se pausa hasta que la organización lo pase al plan
          siguiente o empiece el mes. Pasado el plan más grande, se suman bloques de {int(data?.blockMessages ?? 1000)}{' '}
          tokens al precio por token de ese plan. Qué funciones incluye cada plan se elige en{' '}
          <Link href="/admin/funciones" className="font-medium text-ember-2 underline-offset-2 hover:underline">
            Funciones por plan
          </Link>
          .
        </p>
        <Button type="button" size="sm" onClick={() => setCreating(true)} className="h-9 text-[12.5px]">
          <Plus className="size-4" />
          Nuevo plan
        </Button>
      </div>

      <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-line-2 hover:bg-transparent">
              <TableHead className={`h-11 pl-5 ${HEAD}`}>Plan</TableHead>
              <TableHead className={`text-right ${HEAD}`}>Tokens</TableHead>
              <TableHead className={`text-right ${HEAD}`}>Precio</TableHead>
              <TableHead className={`hidden text-right sm:table-cell ${HEAD}`}>Por token</TableHead>
              <TableHead className={HEAD}>Estado</TableHead>
              <TableHead className={`pr-5 text-right ${HEAD}`}>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-5" colSpan={6}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-[14px] text-muted-foreground">
                  Todavía no hay planes. Creá el primero.
                </TableCell>
              </TableRow>
            )}
            {plans.map(plan => (
              <TableRow key={plan.id} className={plan.isActive ? '' : 'opacity-60'}>
                <TableCell className="pl-5 text-[14px] font-medium text-ink">
                  {plan.name}
                  {plan.isTrial && (
                    <Badge className="ml-2 bg-emerald-50 text-[10.5px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <Sparkles className="size-3" /> Prueba
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right text-[13px] text-ink-3">{int(plan.messages)}</TableCell>
                <TableCell className="text-right text-[13px] font-semibold text-ink">{price(plan.priceUsd)}</TableCell>
                <TableCell className="hidden text-right text-[13px] text-ink-3 sm:table-cell">
                  {plan.priceUsd > 0
                    ? `USD ${(plan.priceUsd / plan.messages).toLocaleString('es-AR', { maximumFractionDigits: 4 })}`
                    : '—'}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => toggle(plan)}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                      plan.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-line-2 bg-secondary text-muted-foreground'
                    }`}
                  >
                    {plan.isActive ? 'Activo' : 'Apagado'}
                  </button>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing(plan)}
                      className="size-8 rounded-full text-ink-3 hover:bg-ember-soft hover:text-ember-2"
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setRetiring(plan)}
                      className="size-8 rounded-full text-ink-3 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Retirar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {(creating || editing) && (
        <PlanDialog
          key={editing?.id ?? 'new'}
          plan={editing}
          pending={createPlan.isPending || updatePlan.isPending}
          onSave={save}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}

      <AlertDialog open={retiring !== null} onOpenChange={open => !open && setRetiring(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirar el plan {retiring?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Deja de ofrecerse y sus números pasan al plan pago más chico. Podés volver a crearlo cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={retire} disabled={removePlan.isPending}>
              Retirar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Dashboard (Developer) ─────────────────────────────────────────────────────

/** Per message: the bot's, the office's and notices at one rate, campaign messages at another (PlatformBilling.messageCost). */
type MessageCost = { messageUsd: number; campaignMessageUsd: number } | null

/** USD with up to four decimals, for a per-message rate. */
const rate = (n: number) => `USD ${n.toLocaleString('es-AR', { maximumFractionDigits: 4 })}`

/** An amount the API could not compute (null: no cost rate, or no partner terms) shows as "—". */
const money = (n: number | null | undefined) => (n === null || n === undefined ? '—' : usd(n))

/** A margin: green, red when negative, grey when unknown. */
const marginTone = (n: number | null | undefined) =>
  n === null || n === undefined
    ? 'text-muted-foreground'
    : n < 0
      ? 'text-destructive'
      : 'text-emerald-700 dark:text-emerald-400'

/** The Tablero's six columns, the same for an Owner, a zone, an organization and a number. */
function MoneyCells({ totals }: { totals: PlatformBillingTotals }) {
  return (
    <>
      <TableCell className="text-right text-[13px] text-ink-3">{int(totals.settledTokens)}</TableCell>
      <TableCell className="text-right text-[13px] text-ink-3">{int(totals.planTokens)}</TableCell>
      <TableCell className="text-right text-[13px] text-ink-3">{money(totals.costUsd)}</TableCell>
      <TableCell className={`text-right text-[13px] font-semibold ${marginTone(totals.marginUsd)}`}>
        {money(totals.marginUsd)}
      </TableCell>
      <TableCell className={`text-right text-[13px] ${marginTone(totals.lumarsoftMarginUsd)}`}>
        {money(totals.lumarsoftMarginUsd)}
      </TableCell>
      <TableCell className={`pr-5 text-right text-[13px] ${marginTone(totals.nicoMarginUsd)}`}>
        {money(totals.nicoMarginUsd)}
      </TableCell>
    </>
  )
}

const COLUMNS = 7

const numbersHint = (count: number) => (count === 1 ? '1 número' : `${int(count)} números`)

/** Left padding of an organization row and of its numbers, by how deep the Tablero nests it. */
const ORG_INDENT = {
  flat: { org: 'pl-3', number: 'pl-10' },
  owner: { org: 'pl-8', number: 'pl-15' },
  zone: { org: 'pl-13', number: 'pl-20' },
} as const

function OrganizationRows({
  org,
  indent = 'flat',
}: {
  org: PlatformBillingOrganization
  /** Under an Owner group ("Sin zona") or under one of its zones. */
  indent?: keyof typeof ORG_INDENT
}) {
  const [open, setOpen] = useState(false)
  const Chevron = open ? ChevronDown : ChevronRight
  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setOpen(!open)}>
        <TableCell className={`whitespace-normal ${ORG_INDENT[indent].org}`}>
          <span className="flex items-start gap-1.5">
            <Chevron className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="flex flex-col">
              <span className="flex flex-wrap items-center gap-1.5 text-[14px] font-medium text-ink">
                {org.name}
                {!org.isActive && (
                  <Badge variant="outline" className="border-line-2 text-[10.5px] text-muted-foreground">
                    Inactiva
                  </Badge>
                )}
              </span>
              <span className="text-[11.5px] text-muted-foreground">{numbersHint(org.numbers.length)}</span>
            </span>
          </span>
        </TableCell>
        <MoneyCells totals={org.totals} />
      </TableRow>
      {open &&
        org.numbers.map(n => (
          <TableRow key={n.id} className="bg-secondary/30">
            <TableCell className={`whitespace-normal text-[13px] text-ink ${ORG_INDENT[indent].number}`}>
              <span className="font-mono whitespace-nowrap">{numberLabel(n)}</span>
              <div className="text-[11.5px] text-muted-foreground">
                {n.plan.trial ? 'Prueba' : n.plan.name}
                {n.responsibleCode && ` · ${n.responsibleCode.code}`}
                {n.upgraded && ' · subió de plan'}
                {n.paused && ' · asistente en pausa'}
              </div>
            </TableCell>
            <MoneyCells totals={n} />
          </TableRow>
        ))}
    </>
  )
}

type OrganizationsById = Map<number, PlatformBillingOrganization>

/** The month's organizations with these ids (a zone's, an Owner's), skipping any it does not list. */
function organizationsOf(ids: number[], byId: OrganizationsById): PlatformBillingOrganization[] {
  return ids.flatMap(id => byId.get(id) ?? [])
}

function numbersOf(organizations: PlatformBillingOrganization[]): number {
  return organizations.reduce((sum, org) => sum + org.numbers.length, 0)
}

function GroupRow({
  label,
  hint,
  open,
  onToggle,
  totals,
  zone = false,
}: {
  label: string
  hint: string
  open: boolean
  onToggle: () => void
  totals: PlatformBillingTotals
  /** A zone (second level) rather than an Owner. */
  zone?: boolean
}) {
  const Chevron = open ? ChevronDown : ChevronRight
  return (
    <TableRow className={`cursor-pointer ${zone ? '' : 'bg-secondary/50 hover:bg-secondary/60'}`} onClick={onToggle}>
      <TableCell className={`whitespace-normal ${zone ? 'pl-8' : 'pl-3'}`}>
        <span className="flex items-start gap-1.5">
          <Chevron className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="flex flex-col">
            <span className={zone ? 'text-[13.5px] font-medium text-ink' : 'text-[14px] font-semibold text-ink'}>
              {label}
            </span>
            <span className="text-[11.5px] font-normal text-muted-foreground">{hint}</span>
          </span>
        </span>
      </TableCell>
      <MoneyCells totals={totals} />
    </TableRow>
  )
}

const organizationsHint = (count: number) => (count === 1 ? '1 organización' : `${int(count)} organizaciones`)

function ZoneRows({ zone, byId }: { zone: BillingOwnerGroup['zones'][number]; byId: OrganizationsById }) {
  const [open, setOpen] = useState(true)
  const organizations = organizationsOf(zone.organizationIds, byId)
  return (
    <>
      <GroupRow
        zone
        label={zone.name}
        hint={`${organizationsHint(zone.totals.organizations)} · ${numbersHint(numbersOf(organizations))}`}
        open={open}
        onToggle={() => setOpen(!open)}
        totals={zone.totals}
      />
      {open && organizations.map(org => <OrganizationRows key={org.id} org={org} indent="zone" />)}
    </>
  )
}

/** An Owner (or "Sin Owner", or "Sin zona") with its zones, open by default. */
function OwnerRows({ group, byId }: { group: BillingOwnerGroup; byId: OrganizationsById }) {
  const [open, setOpen] = useState(true)
  const organizations = organizationsOf(
    group.zones.flatMap(zone => zone.organizationIds),
    byId,
  )
  const zonesHint = group.flat ? null : group.zones.length === 1 ? '1 zona' : `${group.zones.length} zonas`
  return (
    <>
      <GroupRow
        label={group.name}
        hint={[
          group.email,
          zonesHint,
          organizationsHint(group.totals.organizations),
          numbersHint(numbersOf(organizations)),
        ]
          .filter(Boolean)
          .join(' · ')}
        open={open}
        onToggle={() => setOpen(!open)}
        totals={group.totals}
      />
      {open &&
        (group.flat
          ? organizations.map(org => <OrganizationRows key={org.id} org={org} indent="owner" />)
          : group.zones.map(zone => <ZoneRows key={zone.id ?? 'none'} zone={zone} byId={byId} />))}
    </>
  )
}

function PlatformDashboardTab() {
  const [period, setPeriod] = useState(thisMonth)
  const { data, isLoading, isError } = usePlatformBilling(period)
  const totals = data?.totals
  const cost: MessageCost = data?.messageCost ?? null
  // Owner → Zona → Organización → Número; an API older than the zones lists the organizations.
  const ownerGroups = data ? ownerGroupsOf(data) : null
  const byId: OrganizationsById = new Map((data?.organizations ?? []).map(org => [org.id, org]))
  const unsplit = totals !== undefined && totals.lumarsoftMarginUsd === null

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <MonthPicker value={period} onChange={setPeriod} />
        <p className="max-w-md text-[12.5px] text-muted-foreground">
          {!data
            ? null
            : cost
              ? `Cada mensaje del bot, de la oficina o de un aviso es 1 token y cuesta ${rate(cost.messageUsd)}; cada mensaje de campaña son 2 tokens y cuesta ${rate(cost.campaignMessageUsd)}. El margen de ganancia es lo facturado por el plan menos ese costo, y se reparte entre Lumarsoft y Nico como en la Liquidación.`
              : 'El costo por token no está configurado en la API (PARTNER_COST_PER_MESSAGE_USD): no se calculan el costo ni los márgenes.'}
        </p>
      </div>
      {data?.closed && (
        <p className="mb-4 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
          <Lock className="size-3.5 shrink-0" />
          {data.backfilled
            ? 'Mes cerrado después de terminar: se calculó con los planes del día en que se cerró.'
            : 'Mes cerrado: se muestra como quedó el 1 del mes siguiente.'}
        </p>
      )}
      {isError && <p className="mb-4 text-[14px] text-destructive">No se pudo cargar el tablero.</p>}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {isLoading || !totals ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)
        ) : (
          <>
            <Kpi
              label="Facturado"
              value={usd(totals.billedUsd)}
              hint={`${int(totals.activeNumbers)} números activos · ${int(totals.upgradedNumbers)} subieron de plan · ${int(totals.pausedNumbers ?? 0)} en pausa`}
            />
            <Kpi
              label="Costo Lumarsoft"
              value={money(totals.costUsd)}
              hint={
                cost
                  ? `${int(totals.settledTokens)} tokens usados de ${int(totals.planTokens)} de los planes`
                  : 'Sin costo por token configurado'
              }
            />
            <Kpi
              label="Margen de ganancia"
              value={money(totals.marginUsd)}
              hint="Facturado menos el costo Lumarsoft"
              tone={totals.marginUsd === null ? undefined : totals.marginUsd < 0 ? 'bad' : 'good'}
            />
            <Kpi
              label="Margen Lumarsoft"
              value={money(totals.lumarsoftMarginUsd)}
              hint={unsplit ? 'Falta la parte de Nico en la API' : 'Su parte del margen de ganancia'}
              tone={totals.lumarsoftMarginUsd !== null && totals.lumarsoftMarginUsd < 0 ? 'bad' : undefined}
            />
            <Kpi
              label="Margen Nico"
              value={money(totals.nicoMarginUsd)}
              hint={unsplit ? 'Falta la parte de Nico en la API' : 'Su parte del margen de ganancia'}
              tone={totals.nicoMarginUsd !== null && totals.nicoMarginUsd < 0 ? 'bad' : undefined}
            />
          </>
        )}
      </div>

      {data && hasSharedZones(data) && (
        <p className="mb-3 text-[12.5px] text-muted-foreground">
          Una zona con más de un Owner aparece debajo de cada uno: los totales de arriba la cuentan una sola vez.
        </p>
      )}
      <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow className="border-line-2 hover:bg-transparent">
                <TableHead className={`h-11 pl-5 ${HEAD}`}>
                  {ownerGroups ? 'Owner · Zona · Organización · Número' : 'Organización · Número'}
                </TableHead>
                <TableHead className={`text-right ${HEAD}`}>Tokens usados</TableHead>
                <TableHead className={`text-right ${HEAD}`}>Tokens del plan</TableHead>
                <TableHead className={`text-right ${HEAD}`}>Costo Lumarsoft</TableHead>
                <TableHead className={`text-right ${HEAD}`}>Margen de ganancia</TableHead>
                <TableHead className={`text-right ${HEAD}`}>Margen Lumarsoft</TableHead>
                <TableHead className={`pr-5 text-right ${HEAD}`}>Margen Nico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={COLUMNS} className="pl-5">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              )}
              {data?.organizations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={COLUMNS} className="py-12 text-center text-[14px] text-muted-foreground">
                    No hay organizaciones.
                  </TableCell>
                </TableRow>
              )}
              {data && data.organizations.length > 0 && ownerGroups
                ? ownerGroups.map(group => <OwnerRows key={group.key} group={group} byId={byId} />)
                : data?.organizations.map(org => <OrganizationRows key={org.id} org={org} />)}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  )
}

// ─── Main view ─────────────────────────────────────────────────────────────────

type BillingTab = 'consumo' | 'administradores' | 'planes' | 'tablero' | 'liquidacion'

export function FacturacionView() {
  const { isOwner } = useRole()
  // The Owner's Facturación is its whole network's: every zone, principal and productor, with "Todos" at each level.
  return isOwner ? <NetworkUsageView variant="billing" /> : <PrincipalBillingView />
}

/** The Developer's platform billing, or a principal's plans and consumption (SuperAdmin, Admin). */
function PrincipalBillingView() {
  const { isDeveloper, canManageOrg, isAdmin, isLoading: roleLoading } = useRole()
  // `?tab=` (the assistant's links) or the role's first tab.
  const [tab, setTab] = useUrlTab<BillingTab | 'auto'>(
    ['consumo', 'administradores', 'planes', 'tablero', 'liquidacion'],
    'auto',
  )
  // A tab of the other side (an office link to Consumo opened by the Developer, a Tablero link opened by an office)
  // falls back to the role's first tab: the money tabs only ever render for the Developer.
  const roleTabs: BillingTab[] = isDeveloper
    ? ['tablero', 'liquidacion', 'planes']
    : canManageOrg
      ? ['consumo', 'administradores', 'planes']
      : ['consumo']
  const current: BillingTab = tab !== 'auto' && roleTabs.includes(tab) ? tab : roleTabs[0]

  if (!roleLoading && !isDeveloper && !canManageOrg && !isAdmin) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <p className="text-[14px] text-muted-foreground">Acceso restringido.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">
            {isDeveloper ? 'Plataforma' : 'Planes y consumo'}
          </div>
          <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">Facturación</h1>
          <p className="mt-1.5 max-w-2xl text-[14px] text-muted-foreground">
            {isDeveloper
              ? 'Lo que se factura a cada organización contra el costo Lumarsoft de sus tokens, cómo se reparte el margen con Nico y el catálogo de planes. Los precios solo los ves vos: las organizaciones ven sus planes en tokens.'
              : 'Cada número tiene un plan de tokens por mes: cada mensaje que envía el asistente, la oficina desde el panel o un aviso cuenta 1 token, y cada mensaje de campaña, 2. Cuando un número llega al límite de su plan, el asistente se pausa y elegís si pasa al siguiente.'}
          </p>
        </div>
      </div>

      <RequirePrincipal showFilter={false}>
        {(isDeveloper || canManageOrg) && (
          <Tabs value={current} onValueChange={v => setTab(v as BillingTab)} className="mb-5">
            <TabsList>
              {isDeveloper ? (
                <>
                  <TabsTrigger value="tablero">Tablero</TabsTrigger>
                  <TabsTrigger value="liquidacion">Liquidación</TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="consumo">Consumo</TabsTrigger>
                  <TabsTrigger value="administradores">Por administrador</TabsTrigger>
                </>
              )}
              <TabsTrigger value="planes">Planes</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {roleLoading ? (
          <Skeleton className="h-[200px] rounded-xl" />
        ) : isDeveloper ? (
          current === 'planes' ? (
            <PlatformPlansTab />
          ) : current === 'liquidacion' ? (
            <LiquidacionTab />
          ) : (
            <PlatformDashboardTab />
          )
        ) : current === 'planes' && canManageOrg ? (
          <OfferTab />
        ) : current === 'administradores' && canManageOrg ? (
          <BillingByAdminTab />
        ) : (
          <ConsumptionTab canAssign={canManageOrg} />
        )}
      </RequirePrincipal>
    </div>
  )
}
