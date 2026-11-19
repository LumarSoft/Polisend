'use client'

import { useRef, useState } from 'react'
import { Loader2, MessageSquareText, RefreshCw, RotateCcw, Save } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api-client'
import type {
  NoticeText,
  NoticeTextAccount,
  NoticeTextKind,
  NoticeTextScope,
  NoticeTextSending,
  NoticeTextStatus,
} from '@/types/api/notice-texts'
import { useNoticeText, useNoticeTextActions } from '../hooks/use-notice-text'
import { REVIEW_CLASSES, renderMessage } from '../lib/campaigns-format'
import { InboxMessageText } from './inbox-message-text'

/** Meta's limit for a text header. */
const MAX_TITLE = 60

const TITLES: Record<NoticeTextKind, string> = {
  payment_rejection: 'Texto del aviso de rechazo',
  policy_expiry: 'Texto del aviso de póliza vencida',
}

const STATUS_LABELS: Record<NoticeTextStatus, string> = {
  APPROVED: 'Aprobado por Meta',
  PENDING: 'En revisión de Meta',
  REJECTED: 'Rechazado por Meta',
  ERROR: 'No se pudo mandar a Meta',
  NOT_SUBMITTED: 'Se manda a Meta en menos de una hora',
  UNKNOWN: 'Meta no respondió',
}

const STATUS_CLASSES: Record<NoticeTextStatus, string> = { ...REVIEW_CLASSES, UNKNOWN: REVIEW_CLASSES.NOT_SUBMITTED }

/** What the account's numbers send while the current text is not approved there. */
const SENDING_LABELS: Record<Exclude<NoticeTextSending, 'own' | null>, string> = {
  previous: 'Mientras tanto, los avisos salen con tu texto anterior.',
  general: 'Mientras tanto, este número manda el texto general.',
  platform: 'Mientras tanto, los avisos salen con el texto de la plataforma.',
  none: 'Esta cuenta todavía no tiene ningún texto aprobado: los avisos salen por otro número.',
}

const failed = (error: unknown, fallback: string) =>
  toast.error(error instanceof ApiError && error.status < 500 ? error.message : fallback)

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** "Texto del aviso": opens the organization's text of a notice, to read or (the SuperAdmin) change. */
export function NoticeTextButton({ kind }: { kind: NoticeTextKind }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 border-line-2 text-[12.5px]"
      >
        <MessageSquareText className="size-4" />
        Texto del aviso
      </Button>
      <NoticeTextDialog kind={kind} open={open} onOpenChange={setOpen} />
    </>
  )
}

function NoticeTextDialog({
  kind,
  open,
  onOpenChange,
}: {
  kind: NoticeTextKind
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  // Undefined until the user picks: the API opens the general text for the SuperAdmin, an admin's own number for them.
  const [scope, setScope] = useState<NoticeTextScope>(undefined)
  const { data, isError } = useNoticeText(kind, scope, open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{TITLES[kind]}</DialogTitle>
          <DialogDescription>
            Es el mensaje que reciben los clientes por WhatsApp. Cada número puede tener el suyo; si no, manda el
            general de la organización.
          </DialogDescription>
        </DialogHeader>
        {isError ? (
          <p role="alert" className="py-8 text-center text-[13px] text-destructive">
            No se pudo cargar el texto del aviso.
          </p>
        ) : !data ? (
          <p className="flex items-center justify-center gap-2 py-8 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando…
          </p>
        ) : (
          <>
            {data.scopes.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor={`notice-scope-${kind}`} className="text-[12.5px]">
                  Texto de
                </Label>
                <select
                  id={`notice-scope-${kind}`}
                  value={data.numberId ?? 'general'}
                  onChange={e => setScope(e.target.value === 'general' ? null : Number(e.target.value))}
                  className="h-9 rounded-md border border-line-2 bg-background px-2 text-[13px] text-ink"
                >
                  {data.scopes.map(option => (
                    <option key={option.numberId ?? 'general'} value={option.numberId ?? 'general'}>
                      {option.label}
                      {option.numberId !== null && !option.hasOwn ? ' (sin texto propio)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Another scope, a new saved text or dropping one starts the draft again from what it sends. */}
            <NoticeTextEditor
              key={`${data.numberId ?? 'general'}-${data.custom?.version ?? 0}`}
              kind={kind}
              scope={scope}
              view={data}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** The message as WhatsApp shows it: the title in bold, on the chat background. */
function MessagePreview({ text }: { text: string }) {
  return (
    <div className="wa wa-wallpaper rounded-xl p-4">
      <div className="ml-auto max-w-[92%] rounded-lg rounded-tr-none bg-(--wa-bubble-out) px-3 py-2 text-[13.5px] leading-relaxed text-(--wa-text) shadow-sm">
        <InboxMessageText text={text} />
      </div>
    </div>
  )
}

function NoticeTextEditor({
  kind,
  scope,
  view,
}: {
  kind: NoticeTextKind
  /** The scope the dialog asked for (its cache key). */
  scope: NoticeTextScope
  view: NoticeText
}) {
  const { save, reset, refresh } = useNoticeTextActions(kind, scope)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canEdit = view.editable
  const ofNumber = view.numberId !== null
  // Without a text of its own, the editor starts from what the scope sends: the general text, or the platform's.
  const savedTitle = view.custom?.title ?? view.fallback.title ?? ''
  const savedBody = view.custom?.body ?? view.fallback.body
  const [title, setTitle] = useState(savedTitle)
  const [body, setBody] = useState(savedBody)
  const [confirm, setConfirm] = useState<'save' | 'reset' | null>(null)

  const dirty = title.trim() !== savedTitle || body.trim() !== savedBody
  const error = !body.trim()
    ? 'Escribí el mensaje.'
    : title.trim().length > MAX_TITLE
      ? `El título puede tener hasta ${MAX_TITLE} caracteres.`
      : null
  const examples = Object.fromEntries(view.placeholders.map(p => [p.key, p.example]))
  const preview = (title.trim() ? `*${title.trim()}*\n\n` : '') + renderMessage(body.trim(), examples)

  /** Writes `{key}` where the cursor is (or at the end) and leaves the cursor after it. */
  const insertPlaceholder = (key: string) => {
    const token = `{${key}}`
    const el = textareaRef.current
    const start = el?.selectionStart ?? body.length
    const end = el?.selectionEnd ?? body.length
    setBody(body.slice(0, start) + token + body.slice(end))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const doSave = () => {
    setConfirm(null)
    save.mutate(
      { title: title.trim(), body: body.trim(), phoneNumberId: view.numberId },
      {
        onSuccess: result =>
          toast.success(
            result.custom
              ? 'Texto guardado y enviado a revisión de Meta'
              : 'Es el texto que ya se manda: no cambió nada',
          ),
        onError: e => failed(e, 'No se pudo guardar el texto'),
      },
    )
  }
  const doReset = () => {
    setConfirm(null)
    reset.mutate(view.numberId, {
      onSuccess: () =>
        toast.success(
          ofNumber
            ? 'El número vuelve a mandar el texto general'
            : 'Los avisos vuelven a salir con el texto de la plataforma',
        ),
      onError: e => failed(e, 'No se pudo deshacer el texto'),
    })
  }
  const askMeta = () =>
    refresh.mutate(undefined, {
      onSuccess: () => toast.success('Estado actualizado con Meta'),
      onError: e => failed(e, 'No se pudo consultar a Meta'),
    })

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
      <div className="flex flex-col gap-5">
        <p className="text-[12.5px] text-muted-foreground">
          {view.custom
            ? `${ofNumber ? 'Texto propio de este número' : 'Texto general de la organización'}, guardado el ${formatDay(
                view.custom.createdAt,
              )}${view.custom.createdBy ? ` por ${view.custom.createdBy.name ?? view.custom.createdBy.email}` : ''}.`
            : view.fallback.source === 'general'
              ? 'Este número no tiene texto propio: manda el general de la organización.'
              : 'Hoy se manda el texto de la plataforma.'}
        </p>

        {canEdit ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`notice-title-${kind}`}>Título (opcional)</Label>
              <Input
                id={`notice-title-${kind}`}
                value={title}
                maxLength={MAX_TITLE + 20}
                onChange={e => setTitle(e.target.value)}
                placeholder={kind === 'payment_rejection' ? 'Aviso de pago rechazado' : 'Tu póliza venció'}
                className="border-line-2"
              />
              <p className="text-[12px] text-muted-foreground">
                Sale en negrita arriba del mensaje, igual para todos los clientes. Hasta {MAX_TITLE} caracteres, sin
                emojis. {title.trim().length > 0 && `(${title.trim().length}/${MAX_TITLE})`}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`notice-body-${kind}`}>Mensaje</Label>
              <textarea
                id={`notice-body-${kind}`}
                ref={textareaRef}
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={7}
                className="rounded-md border border-line-2 bg-background px-3 py-2 text-[13.5px] leading-relaxed text-ink"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11.5px] text-muted-foreground">Insertar dato:</span>
                {view.placeholders.map(placeholder => (
                  <button
                    key={placeholder.key}
                    type="button"
                    onClick={() => insertPlaceholder(placeholder.key)}
                    title={`Ejemplo: ${placeholder.example}`}
                    className="rounded-full border border-line-2 bg-secondary px-2 py-0.5 text-[11.5px] text-ink-3 hover:border-ember-ring hover:bg-ember-soft hover:text-ember-2"
                  >
                    {placeholder.label}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-muted-foreground">
                Cada dato entre llaves se completa con el del cliente. El mensaje no puede empezar ni terminar con un
                dato. Es un aviso de servicio: si suena a venta u oferta, Meta lo rechaza o lo pasa a marketing (más
                caro, y no les llega a quienes desactivaron las promociones).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => setConfirm('save')} disabled={!dirty || !!error || save.isPending}>
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Guardar y mandar a Meta
              </Button>
              {view.custom && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirm('reset')}
                  disabled={reset.isPending}
                  className="border-line-2"
                >
                  {reset.isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                  {ofNumber ? 'Volver al texto general' : 'Volver al texto original'}
                </Button>
              )}
              {error && dirty && <span className="text-[12.5px] text-destructive">{error}</span>}
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-line-2 bg-secondary/40 px-3 py-2.5 text-[12.5px] text-ink-3">
            {ofNumber
              ? 'Solo el Admin de este número o el SuperAdmin pueden cambiar este texto.'
              : 'El texto general lo cambia el SuperAdmin. Vos podés cambiar el de tu número: elegilo arriba.'}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="text-[11px] uppercase tracking-[0.12em] text-faint">Así lo ve el cliente</div>
          <MessagePreview text={preview} />
        </div>
        {view.custom && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] uppercase tracking-[0.12em] text-faint">Revisión de Meta</div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={askMeta}
                disabled={refresh.isPending || view.accounts.length === 0}
                className="h-8 border-line-2 text-[12px]"
              >
                {refresh.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                Consultar a Meta
              </Button>
            </div>
            <AccountReviewList accounts={view.accounts} />
          </div>
        )}
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={next => !next && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === 'reset'
                ? ofNumber
                  ? 'Volver al texto general'
                  : 'Volver al texto de la plataforma'
                : 'Mandar el texto nuevo a Meta'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'reset'
                ? ofNumber
                  ? 'Desde ahora este número manda el texto general de la organización y el suyo deja de usarse.'
                  : 'Desde ahora los avisos salen con el texto de la plataforma (salvo los números con texto propio) y el general deja de usarse.'
                : 'Meta revisa el texto en la cuenta de cada número (de minutos a un día). Mientras tanto, los avisos siguen saliendo con el texto anterior.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirm === 'reset' ? doReset : doSave}>
              {confirm === 'reset'
                ? ofNumber
                  ? 'Volver al general'
                  : 'Volver al original'
                : 'Guardar y mandar a Meta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/** Where Meta's review stands in each WhatsApp account, and what its numbers send meanwhile. */
function AccountReviewList({ accounts }: { accounts: NoticeTextAccount[] }) {
  if (!accounts.length) {
    return (
      <p className="text-[12.5px] text-muted-foreground">
        La organización todavía no tiene un número de WhatsApp conectado para mandar el texto a Meta.
      </p>
    )
  }
  return (
    <ul className="flex flex-col gap-2">
      {accounts.map(account => (
        <li key={account.id} className="rounded-lg border border-line-2 px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-ink">
                {account.wabaName ?? 'Cuenta de WhatsApp'}
              </div>
              <div className="text-[11.5px] text-muted-foreground">{account.numbers.join(', ') || 'Sin números'}</div>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_CLASSES[account.status]}`}
            >
              {STATUS_LABELS[account.status]}
            </span>
          </div>
          {account.reason && <p className="mt-1.5 text-[12px] text-destructive">{account.reason}</p>}
          {account.marketing && (
            <p className="mt-1.5 text-[12px] text-amber-700 dark:text-amber-400">
              Meta lo clasificó como marketing: cada aviso cuesta más y no les llega a quienes desactivaron las
              promociones. Sacale lo que suene a venta y volvé a guardarlo.
            </p>
          )}
          {account.sending && account.sending !== 'own' && (
            <p className="mt-1.5 text-[12px] text-muted-foreground">{SENDING_LABELS[account.sending]}</p>
          )}
        </li>
      ))}
    </ul>
  )
}
