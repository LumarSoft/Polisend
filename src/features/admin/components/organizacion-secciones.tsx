'use client'

import { AlertTriangle, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { OrganizationBilling, OrganizationCode, OrganizationNumber } from '@/types/api/organizations'
import { numberLabel } from '../lib/number-label'
import { MetaPortfolioLine } from './meta-portfolio-line'

// ── helpers ────────────────────────────────────────────────

/** Costs run to fractions of a cent, so a flat 2-decimal format would show 0.00. */
const usd = (n: number) => (n === 0 ? 'USD 0' : n < 0.01 ? `USD ${n.toFixed(4)}` : `USD ${n.toFixed(2)}`)
const int = (n: number) => n.toLocaleString('es-AR')

function fecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ── resumen de facturación ─────────────────────────────────

/** Month-to-date summary for the whole organization. */
export function BillingSummary({ billing }: { billing: OrganizationBilling }) {
  const cards = [
    { label: 'Números activos', value: int(billing.activeNumbers) },
    { label: 'Facturado del mes', value: usd(billing.billedUsd), hint: 'Planes de mensajes de sus números' },
    {
      label: 'Pago real a Meta',
      value: usd(billing.metaCostUsd),
      hint: `OpenAI aparte: ${usd(billing.openaiCostUsd)}`,
    },
    { label: 'Ganancia', value: usd(billing.marginUsd), hint: 'Facturado menos Meta' },
  ]

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[13px] font-semibold text-ink">Facturación · {billing.period}</h3>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {cards.map(c => (
          <Card key={c.label} className="flex flex-col gap-0.5 p-3">
            <span className="text-[11px] text-muted-foreground">{c.label}</span>
            <span className="text-[15px] font-semibold text-ink">{c.value}</span>
            {c.hint && <span className="text-[11px] text-muted-foreground">{c.hint}</span>}
          </Card>
        ))}
      </div>
      {billing.marginUsd < 0 && (
        <p className="flex items-center gap-1.5 text-[12px] text-destructive">
          <AlertTriangle className="size-3.5" />
          Meta cobra más de lo facturado: ganancia {usd(billing.marginUsd)}
        </p>
      )}
    </section>
  )
}

// ── números ────────────────────────────────────────────────

export function NumbersSection({ numbers }: { numbers: OrganizationNumber[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[13px] font-semibold text-ink">Números de WhatsApp ({numbers.length})</h3>
      <div className="overflow-x-auto rounded-md border border-line-2">
        <Table className="min-w-[780px]">
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Código</TableHead>
              <TableHead className="text-right">OpenAI (aparte)</TableHead>
              <TableHead className="text-right">Mensajes · plan</TableHead>
              <TableHead className="text-right">Meta</TableHead>
              <TableHead className="text-right">Facturado</TableHead>
              <TableHead className="text-right">Ganancia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {numbers.map(n => {
              const llmTokens = n.usage.openaiInputTokens + n.usage.openaiOutputTokens
              return (
                <TableRow key={n.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-muted-foreground" />
                      <span className="text-[13px] font-medium text-ink">{numberLabel(n)}</span>
                      {!n.isActive && (
                        <Badge variant="destructive" className="text-[10px]">
                          inactivo
                        </Badge>
                      )}
                      {n.budget.exceededAt && (
                        <Badge variant="destructive" className="text-[10px]">
                          sin LLM
                        </Badge>
                      )}
                    </div>
                    <MetaPortfolioLine portfolio={n.portfolio} />
                    <span className="text-[11px] text-muted-foreground">{n.phoneNumberId}</span>
                  </TableCell>
                  <TableCell className="text-[12px]">
                    {n.responsibleCode ? (
                      <>
                        <span className="text-ink">{n.responsibleCode.code}</span>
                        {n.servedCodes.length > 1 && (
                          <span className="text-muted-foreground"> +{n.servedCodes.length - 1}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-[12px] text-muted-foreground">
                    {usd(n.usage.openaiCostUsd)}
                    <div className="text-[11px]">
                      {int(n.usage.openaiCalls)} llamadas · {int(llmTokens)} tokens
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-[12px] text-muted-foreground">
                    {int(n.usage.messages)} · <span className="text-ink">{n.usage.plan.name}</span> (
                    {usd(n.usage.plan.priceUsd)}){n.usage.upgraded && ' · subió'}
                  </TableCell>
                  <TableCell className="text-right text-[12px] text-muted-foreground">
                    {usd(n.usage.metaCostUsd)}
                    <div className="text-[11px]">{int(n.usage.metaBillableMessages)} con cargo</div>
                  </TableCell>
                  <TableCell className="text-right text-[13px] font-medium text-ink">
                    {usd(n.usage.billedUsd)}
                  </TableCell>
                  <TableCell className="text-right text-[12px] text-muted-foreground">
                    {usd(n.usage.marginUsd)}
                  </TableCell>
                </TableRow>
              )
            })}
            {numbers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-4 text-center text-[13px] text-muted-foreground">
                  Sin números registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

// ── códigos de productor ───────────────────────────────────

export function CodesTable({
  codes,
  onToggle,
  toggling,
}: {
  codes: OrganizationCode[]
  onToggle: (codeId: number, isActive: boolean) => void
  toggling: boolean
}) {
  const totals = codes.reduce(
    (a, c) => ({
      clients: a.clients + c.clients,
      policies: a.policies + c.policies,
      claims: a.claims + c.claims,
    }),
    { clients: 0, policies: 0, claims: 0 },
  )

  return (
    <div className="overflow-x-auto rounded-md border border-line-2">
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead className="text-right">Clientes</TableHead>
            <TableHead className="text-right">Pólizas</TableHead>
            <TableHead className="text-right">Siniestros</TableHead>
            <TableHead>Última sync</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map(c => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-ink">{c.code}</span>
                  {c.isMaster && (
                    <Badge variant="secondary" className="text-[10px]">
                      master
                    </Badge>
                  )}
                  {!c.isActive && (
                    <Badge variant="destructive" className="text-[10px]">
                      inactivo
                    </Badge>
                  )}
                </div>
                {c.holderName && <span className="text-[11px] text-muted-foreground">{c.holderName}</span>}
              </TableCell>
              <TableCell className="text-right text-[12px] text-muted-foreground">{int(c.clients)}</TableCell>
              <TableCell className="text-right text-[12px] text-muted-foreground">{int(c.policies)}</TableCell>
              <TableCell className="text-right text-[12px] text-muted-foreground">{int(c.claims)}</TableCell>
              <TableCell className="text-[12px] text-muted-foreground">
                {c.lastCarteraSyncAt ? (
                  fecha(c.lastCarteraSyncAt)
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">nunca</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[12px]"
                  disabled={toggling}
                  onClick={() => onToggle(c.id, !c.isActive)}
                >
                  {c.isActive ? 'Desactivar' : 'Activar'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {codes.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-4 text-center text-[13px] text-muted-foreground">
                Sin códigos.
              </TableCell>
            </TableRow>
          )}
          {codes.length > 0 && (
            <TableRow className="bg-muted/40">
              <TableCell className="text-[12px] font-medium text-ink">Total</TableCell>
              <TableCell className="text-right text-[12px] font-medium text-ink">{int(totals.clients)}</TableCell>
              <TableCell className="text-right text-[12px] font-medium text-ink">{int(totals.policies)}</TableCell>
              <TableCell className="text-right text-[12px] font-medium text-ink">{int(totals.claims)}</TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
