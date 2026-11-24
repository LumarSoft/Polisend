'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Bot,
  Building2,
  CalendarOff,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  FileText,
  Inbox,
  Info,
  Landmark,
  Lightbulb,
  ListTodo,
  Loader2,
  ShieldAlert,
  Sparkles,
  Trash2,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AssistantAction, AssistantActionStatus } from '@/types/api/assistant'

const ICONS: Record<string, LucideIcon> = {
  datos_de_pago: Landmark,
  datos_productora: Building2,
  horarios: Clock,
  bot_numero: Bot,
  cierre: CalendarOff,
  tarea: ListTodo,
  tarea_cambio: ListTodo,
  tarea_borrar: ListTodo,
  asunto: Inbox,
  siniestro: ShieldAlert,
  solicitud: FileText,
  mejora: Lightbulb,
}

/** Cards that delete something for good (the API offers no undo): confirmed like the panel's own deletions. */
const DELETES = new Set(['tarea_borrar'])

/** A pending card past its time counts as expired, even before the API is asked again. */
function statusOf(action: AssistantAction): AssistantActionStatus {
  return action.status === 'pending' && new Date(action.expiresAt).getTime() <= Date.now() ? 'expired' : action.status
}

/**
 * How a cancelled card ended: replaced by another one before it was confirmed (the API says by which in its
 * summary, "reemplazada por la propuesta #17") or cancelled by the person (no summary).
 */
function cancelledText(summary: string | null): string {
  return summary
    ? `${summary.charAt(0).toUpperCase()}${summary.slice(1)}: no se cambió nada.`
    : 'Cancelada: no se cambió nada.'
}

interface AssistantActionCardProps {
  action: AssistantAction
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
  /** Asks the assistant to prepare going back on this change; unset while it is answering. */
  onUndo?: () => void
  onNavigate: () => void
}

/**
 * A change the assistant prepared: what it touches, before → after, who else
 * it reaches, and the buttons. Nothing changes until "Confirmar".
 */
export function AssistantActionCard({
  action,
  busy,
  onConfirm,
  onCancel,
  onUndo,
  onNavigate,
}: AssistantActionCardProps) {
  const reduced = useReducedMotion()
  const status = statusOf(action)
  const { preview } = action
  const Icon = ICONS[action.type] ?? Sparkles
  const deletes = DELETES.has(action.type)
  const ConfirmIcon = deletes ? Trash2 : Check
  const settled = status !== 'pending'

  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card text-[12.5px] shadow-sm',
        status === 'pending' ? 'border-iris-ring shadow-[0_8px_24px_-14px_var(--color-iris-glow)]' : 'border-line-2',
      )}
    >
      {status === 'pending' && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,var(--color-iris-3),var(--color-iris),var(--color-iris-2))]"
        />
      )}
      <div className="flex items-start gap-3 px-3.5 pt-3.5">
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-lg',
            settled ? 'bg-secondary text-muted-foreground' : 'bg-iris-soft text-iris-ink',
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] leading-snug font-semibold text-ink">{preview.title}</p>
          <p className="truncate text-[12px] text-muted-foreground">{preview.target}</p>
        </div>
        {status === 'pending' && (
          <span className="shrink-0 rounded-full bg-iris-soft px-2 py-0.5 text-[10.5px] font-medium text-iris-ink">
            Para confirmar
          </span>
        )}
      </div>

      {preview.changes.length > 0 && (
        <dl className="mx-3.5 mt-3 divide-y divide-line rounded-lg border border-line bg-secondary/40">
          {preview.changes.map(change => (
            <div key={change.label} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-3 px-3 py-2">
              <dt className="text-muted-foreground">{change.label}</dt>
              <dd className="min-w-0">
                {change.before !== null && change.before !== change.after && (
                  <span className="block break-words text-faint line-through decoration-faint/60">{change.before}</span>
                )}
                <span
                  className={cn(
                    'block break-words',
                    change.after === null ? 'text-faint italic' : 'font-medium text-ink',
                  )}
                >
                  {change.after ?? (deletes ? 'Se borra' : 'Vacío')}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {preview.notes.length > 0 && (
        <ul className="mx-3.5 mt-2.5 flex flex-col gap-1">
          {preview.notes.map(note => (
            <li key={note} className="flex gap-1.5 text-[12px] leading-snug text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" />
              {note}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        {status === 'pending' && (
          <div className="flex items-center justify-end gap-2 border-t border-line bg-secondary/30 px-3.5 py-2.5">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy} className="h-8">
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              variant={deletes ? 'destructive' : 'default'}
              onClick={onConfirm}
              disabled={busy}
              className={cn(
                'h-8 gap-1.5',
                !deletes && 'bg-iris text-on-iris shadow-[0_4px_12px_-6px_var(--color-iris-glow)] hover:bg-iris/90',
              )}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ConfirmIcon className="size-3.5" />}
              {preview.confirmLabel}
            </Button>
          </div>
        )}
        {status === 'confirmed' && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-1.5 border-t border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <p className="flex items-start gap-2">
              <CircleCheck className="mt-px size-4 shrink-0" />
              <span>{action.summary ?? 'Listo.'}</span>
            </p>
            {(action.link || (action.undoable && onUndo)) && (
              <div className="flex items-center justify-end gap-1">
                {action.link && (
                  <Link
                    href={action.link.route}
                    onClick={onNavigate}
                    className="rounded-md px-1.5 py-0.5 font-medium underline underline-offset-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  >
                    {action.link.label}
                  </Link>
                )}
                {action.undoable && onUndo && (
                  <button
                    type="button"
                    onClick={onUndo}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                    title="Pedirle al asistente que lo deje como estaba"
                  >
                    <Undo2 className="size-3.5" />
                    Deshacer
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
        {status === 'failed' && (
          <div className="flex items-start gap-2 border-t border-red-200 bg-red-50 px-3.5 py-2.5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <CircleAlert className="mt-px size-4 shrink-0" />
            <span>{action.error ?? 'No se pudo aplicar el cambio.'}</span>
          </div>
        )}
        {status === 'cancelled' && (
          <p className="border-t border-line px-3.5 py-2.5 text-muted-foreground">{cancelledText(action.summary)}</p>
        )}
        {status === 'expired' && (
          <p className="border-t border-line px-3.5 py-2.5 text-muted-foreground">
            Venció sin confirmarse: pedile al asistente que la arme de nuevo.
          </p>
        )}
      </div>
    </motion.div>
  )
}
