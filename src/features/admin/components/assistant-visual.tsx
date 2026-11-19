'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  Copy,
  Info,
  LineChart as LineIcon,
  Minus,
  Table2,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { AssistantVisual, AssistantVisualColumn, AssistantVisualRow } from '@/types/api/assistant'

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })
const moneyWhole = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const count = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })
const compact = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 })

/** A value as the office reads it: "$ 39.661.497", "27,01 %", "770"; null is "sin dato", never 0. */
export function formatVisualValue(value: string | number | null | undefined, format: AssistantVisualColumn['format']) {
  // Undefined: the column does not apply to that row ("otros" has no share); null: the data is missing.
  if (value === undefined || value === '') return ''
  if (value === null) return 'sin dato'
  if (typeof value === 'string') return value
  if (format === 'money') return Number.isInteger(value) ? moneyWhole.format(value) : money.format(value)
  if (format === 'percent') return `${count.format(value)} %`
  return count.format(value)
}

/** An axis tick: big amounts shortened ("39,7 M"). */
function axisValue(value: number, format: AssistantVisualColumn['format']) {
  const short = Math.abs(value) >= 100_000 ? compact.format(value) : count.format(value)
  if (format === 'money') return `$ ${short}`
  if (format === 'percent') return `${short} %`
  return short
}

/** The series a chart draws: the first one the API names, which is the one the result is ranked by. */
function mainSeries(visual: AssistantVisual): AssistantVisualColumn | undefined {
  const series = visual.series.flatMap(key => visual.columns.filter(c => c.key === key))
  return series[0]
}

/** What each bar or line of a chart is: the tooltip shows every column, the drawing only these. */
function ChartLegend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-0.5 px-2 pt-1.5 text-[11px] text-faint">
      {items.map(item => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/** The rows as tab-separated text, ready to paste in a spreadsheet. */
function asTsv(visual: AssistantVisual): string {
  const head = visual.columns.map(c => c.label).join('\t')
  const body = visual.rows.map(row =>
    visual.columns
      .map(c => (typeof row[c.key] === 'number' ? String(row[c.key]).replace('.', ',') : (row[c.key] ?? '')))
      .join('\t'),
  )
  return [head, ...body].join('\n')
}

/**
 * Data drawn under an answer: a ranking as horizontal bars, a series as a
 * line, a breakdown as a table and totals as figures, each with the period it
 * covers and what the reader should know. The numbers come from the tool, not
 * from the answer's text.
 */
export function AssistantVisualCard({ visual }: { visual: AssistantVisual }) {
  const reduced = useReducedMotion()
  const chartable = visual.kind === 'bars' || visual.kind === 'line'
  const [view, setView] = useState<'chart' | 'table'>(chartable ? 'chart' : 'table')
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asTsv(visual))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Without clipboard access the table is still on screen.
    }
  }

  return (
    <motion.figure
      initial={reduced ? false : { opacity: 0, y: 6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden rounded-2xl border border-line-2 bg-card shadow-xs"
    >
      <figcaption className="flex items-start gap-3 border-b border-line px-3.5 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[13.5px] font-medium tracking-[-0.01em] text-ink">{visual.title}</p>
          {visual.subtitle && <p className="truncate text-[11.5px] text-faint">{visual.subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {chartable && (
            <div className="mr-1 flex rounded-lg bg-secondary p-0.5" role="group" aria-label="Cómo verlo">
              <ViewButton active={view === 'chart'} onClick={() => setView('chart')} label="Gráfico">
                {visual.kind === 'line' ? <LineIcon className="size-3.5" /> : <BarChart3 className="size-3.5" />}
              </ViewButton>
              <ViewButton active={view === 'table'} onClick={() => setView('table')} label="Tabla">
                <Table2 className="size-3.5" />
              </ViewButton>
            </div>
          )}
          {visual.kind !== 'kpis' && (
            <button
              type="button"
              onClick={() => void copy()}
              title="Copiar como tabla"
              className="grid size-7 place-items-center rounded-lg text-faint transition-colors hover:bg-iris-soft hover:text-iris-ink"
            >
              {copied ? <Check className="size-3.5 text-iris-ink" /> : <Copy className="size-3.5" />}
              <span className="sr-only">{copied ? 'Copiada' : 'Copiar como tabla'}</span>
            </button>
          )}
        </div>
      </figcaption>

      <div className="px-2 py-3">
        {visual.kind === 'kpis' ? (
          <Figures visual={visual} />
        ) : view === 'table' ? (
          <VisualTable visual={visual} />
        ) : visual.kind === 'line' ? (
          <VisualLine visual={visual} />
        ) : (
          <VisualBars visual={visual} />
        )}
      </div>

      {visual.notes.length > 0 && (
        <div className="flex gap-2 border-t border-line bg-secondary/40 px-3.5 py-2 text-[11.5px] leading-snug text-faint">
          <Info className="mt-px size-3.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            {visual.notes.map(note => (
              <span key={note}>{note}</span>
            ))}
          </div>
        </div>
      )}
    </motion.figure>
  )
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        'grid h-6 w-7 place-items-center rounded-md transition-colors',
        active ? 'bg-card text-iris-ink shadow-xs' : 'text-faint hover:text-ink-2',
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  )
}

interface TooltipEntry {
  dataKey?: string | number
  name?: string
  value?: number | string | null
  color?: string
  payload?: AssistantVisualRow
}

function VisualTooltip({
  active,
  payload,
  visual,
  label,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  visual: AssistantVisual
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const nameKey = visual.columns[0]?.key
  const values = visual.columns.filter(c => c.format !== 'text')
  return (
    <div className="max-w-[260px] rounded-xl border border-line-2 bg-popover px-3 py-2 text-[12px] text-popover-foreground shadow-lg">
      <div className="mb-1 font-medium text-ink">{row && nameKey ? String(row[nameKey]) : label}</div>
      {values.map(column => (
        <div key={column.key} className="flex items-center gap-2">
          <span className="text-muted-foreground">{column.label}</span>
          <span className="ml-auto pl-3 font-medium text-ink tabular-nums">
            {formatVisualValue(row?.[column.key], column.format)}
          </span>
        </div>
      ))}
    </div>
  )
}

const axisTick = { fontSize: 11, fill: 'var(--color-faint)' }

/** A ranking or a breakdown: one horizontal bar per row, the "otros" bar quieter. */
function VisualBars({ visual }: { visual: AssistantVisual }) {
  const reduced = useReducedMotion()
  const main = mainSeries(visual)
  const nameKey = visual.columns[0]?.key
  if (!main || !nameKey) return <VisualTable visual={visual} />
  const rows: AssistantVisualRow[] = visual.rows.map(row => ({ ...row, __name: shortName(String(row[nameKey] ?? '')) }))
  const height = Math.min(44 + rows.length * 30, 420)
  // More than one figure per row: say which one the bars are.
  const several = visual.columns.filter(c => c.format !== 'text').length > 1
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }} barCategoryGap={6}>
          <defs>
            <linearGradient id={`bar-${visual.id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--color-iris)" />
              <stop offset="1" stopColor="var(--color-iris-2)" />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} stroke="var(--color-line)" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            tickFormatter={(value: number) => axisValue(value, main.format)}
          />
          <YAxis type="category" dataKey="__name" tickLine={false} axisLine={false} tick={axisTick} width={118} />
          <Tooltip cursor={{ fill: 'var(--color-iris-soft)' }} content={<VisualTooltip visual={visual} />} />
          <Bar
            dataKey={main.key}
            name={main.label}
            radius={[0, 6, 6, 0]}
            isAnimationActive={!reduced}
            animationDuration={500}
          >
            {rows.map((row, i) => (
              <Cell
                key={i}
                fill={
                  String(row[nameKey]).startsWith('Otros (') ? 'var(--color-line-strong)' : `url(#bar-${visual.id})`
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {several && <ChartLegend items={[{ label: main.label, color: 'var(--color-iris)' }]} />}
    </>
  )
}

/** A series over time: up to three lines, a gap where a day has no data. */
function VisualLine({ visual }: { visual: AssistantVisual }) {
  const reduced = useReducedMotion()
  const nameKey = visual.columns[0]?.key
  const main = mainSeries(visual)
  if (!nameKey || !main) return <VisualTable visual={visual} />
  // An amount and a count do not share an axis: the lines are the first series and the ones
  // measured like it, the tooltip has the rest.
  const drawn = visual.series
    .flatMap(key => visual.columns.filter(c => c.key === key))
    .filter(c => c.format === main.format)
    .slice(0, 3)
  const colors = ['var(--color-iris)', 'var(--color-iris-2)', 'var(--color-faint)']
  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={visual.rows} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey={nameKey} tickLine={false} axisLine={false} tick={axisTick} minTickGap={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            width={58}
            tickFormatter={(value: number) => axisValue(value, main.format)}
          />
          <Tooltip content={<VisualTooltip visual={visual} />} />
          {drawn.map((column, i) => (
            <Line
              key={column.key}
              dataKey={column.key}
              name={column.label}
              type="monotone"
              stroke={colors[i]}
              strokeWidth={2.25}
              dot={{ r: 2.5, strokeWidth: 0, fill: colors[i] }}
              activeDot={{ r: 4.5 }}
              connectNulls={false}
              isAnimationActive={!reduced}
              animationDuration={600}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {(drawn.length > 1 || visual.columns.filter(c => c.format !== 'text').length > 1) && (
        <ChartLegend items={drawn.map((column, i) => ({ label: column.label, color: colors[i] }))} />
      )}
    </>
  )
}

/** Rows and columns, figures to the right, totals at the foot. */
export function VisualTable({ visual }: { visual: AssistantVisual }) {
  const showTotals = visual.totals && visual.columns.some(c => c.format !== 'text' && visual.totals?.[c.key] != null)
  return (
    <div className="max-h-80 overflow-auto rounded-lg">
      <table className="w-full border-collapse text-[12.5px]">
        <thead className="sticky top-0 z-[1] bg-card">
          <tr>
            {visual.columns.map(column => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'border-b border-line-2 px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-faint',
                  column.format === 'text' ? 'text-left' : 'text-right',
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visual.rows.map((row, i) => (
            <tr key={i} className="transition-colors odd:bg-secondary/35 hover:bg-iris-soft">
              {visual.columns.map(column => (
                <td
                  key={column.key}
                  className={cn(
                    'px-2.5 py-1.5 text-ink-2',
                    column.format === 'text'
                      ? 'max-w-[220px] truncate text-left'
                      : 'text-right whitespace-nowrap tabular-nums',
                    row[column.key] == null && 'text-faint italic',
                  )}
                  title={column.format === 'text' ? String(row[column.key] ?? '') : undefined}
                >
                  {formatVisualValue(row[column.key], column.format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {showTotals && (
          <tfoot>
            <tr className="border-t border-line-2 font-medium text-ink">
              {visual.columns.map((column, i) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-2.5 py-1.5',
                    column.format === 'text' ? 'text-left' : 'text-right whitespace-nowrap tabular-nums',
                  )}
                >
                  {column.format === 'text'
                    ? i === 0
                      ? 'Total'
                      : ''
                    : visual.totals?.[column.key] != null && !column.key.endsWith('participacion_%')
                      ? formatVisualValue(visual.totals[column.key], column.format)
                      : ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

/** Totals side by side, each with how it changed against the period compared. */
function Figures({ visual }: { visual: AssistantVisual }) {
  const values = visual.columns.filter(c => c.format !== 'text' && !c.key.endsWith('.anterior'))
  const totals = visual.totals ?? {}
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 px-1.5">
      {values.map(column => {
        const change = visual.comparison?.change[column.key]
        const before = visual.comparison?.values[column.key]
        return (
          <div key={column.key} className="rounded-xl bg-secondary/50 px-3 py-2.5">
            <p className="truncate text-[11.5px] text-faint" title={column.label}>
              {column.label}
            </p>
            <p
              className={cn(
                'mt-0.5 font-display text-[19px] leading-tight font-medium tracking-[-0.02em] text-ink tabular-nums',
                totals[column.key] == null && 'text-[15px] text-faint',
              )}
            >
              {formatVisualValue(totals[column.key], column.format)}
            </p>
            {change && (
              <p className="mt-1 flex items-center gap-1 text-[11.5px] text-iris-ink">
                {change.absolute > 0 ? (
                  <ArrowUpRight className="size-3.5" />
                ) : change.absolute < 0 ? (
                  <ArrowDownRight className="size-3.5" />
                ) : (
                  <Minus className="size-3.5" />
                )}
                <span className="tabular-nums">
                  {change.percent != null
                    ? `${count.format(change.percent)} %`
                    : formatVisualValue(change.absolute, column.format)}
                </span>
                <span className="truncate text-faint">vs {formatVisualValue(before, column.format)}</span>
              </p>
            )}
          </div>
        )
      })}
      {visual.comparison && (
        <p className="col-span-full px-1 text-[11px] text-faint">Comparado con {visual.comparison.label}.</p>
      )}
    </div>
  )
}

/** "10484 · JOHN PELLEGRINI M.G. SRL" → "10484 · John Pellegrini…": an axis has little room. */
function shortName(name: string): string {
  const pretty = /[a-z]/.test(name)
    ? name
    : name.toLowerCase().replace(/(^|[\s·.-])(\p{L})/gu, (_, sep: string, l: string) => sep + l.toUpperCase())
  return pretty.length > 22 ? `${pretty.slice(0, 21).trimEnd()}…` : pretty
}
