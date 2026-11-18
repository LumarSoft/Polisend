'use client'

import { Coins } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TOKENS_HINT } from '../lib/tokens'

export const int = (n: number) => n.toLocaleString('es-AR')
export const usd = (n: number) =>
  `USD ${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

const ARGENTINA_MONTH = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
})

/**
 * The running month, "YYYY-MM", in Argentina: the API's `currentPeriod()`, whatever the browser's clock and time zone
 * (a browser elsewhere would otherwise ask for a month the API has not started, or call a finished one running).
 */
export const thisMonth = (now = new Date()) => {
  const parts = ARGENTINA_MONTH.formatToParts(now)
  const part = (type: 'year' | 'month') => parts.find(p => p.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}`
}

/** The class of a table header cell in Facturación. */
export const HEAD = 'text-[11px] uppercase tracking-[0.12em] text-faint'

export function MonthPicker({
  value,
  onChange,
  id = 'billing-period',
}: {
  value: string
  onChange: (period: string) => void
  id?: string
}) {
  return (
    <div>
      <Label htmlFor={id}>Mes</Label>
      <Input
        id={id}
        type="month"
        value={value}
        max={thisMonth()}
        onChange={event => {
          if (event.target.value) onChange(event.target.value)
        }}
        className="mt-1 w-48"
      />
    </div>
  )
}

export function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone?: 'good' | 'bad'
}) {
  const color =
    tone === 'good' ? 'text-emerald-700 dark:text-emerald-400' : tone === 'bad' ? 'text-destructive' : 'text-ink'
  return (
    <Card className="flex flex-col gap-1 border-line-2 p-4 shadow-sm">
      <span className="text-[11px] uppercase tracking-[0.12em] text-faint">{label}</span>
      <span className={`font-display text-[24px] tracking-[-0.02em] ${color}`}>{value}</span>
      <span className="text-[12px] text-muted-foreground">{hint}</span>
    </Card>
  )
}

/** «1 mensaje = 1 token · un mensaje de campaña = 2 tokens», next to every consumption view. */
export function TokensHint({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-center gap-1.5 text-[12.5px] text-muted-foreground ${className}`}>
      <Coins className="size-3.5 shrink-0 text-ember-2" />
      {TOKENS_HINT}
    </p>
  )
}
