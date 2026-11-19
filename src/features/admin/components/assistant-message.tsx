'use client'

import { Fragment, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  CornerDownRight,
  Loader2,
  Pointer,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type {
  AssistantAction,
  AssistantAttachment,
  AssistantFeedback,
  AssistantStep,
  AssistantVisual,
} from '@/types/api/assistant'
import {
  clientHref,
  isSuggestionLine,
  parseReply,
  plainReply,
  replyScreenHref,
  type ReplyAlign,
  type ReplyInline,
} from '../lib/assistant-format'
import { tourStore } from '../lib/tour-store'
import { AssistantActionCard } from './assistant-action-card'
import { AssistantMark, type AssistantMood } from './assistant-mark'
import { MessageAttachments } from './assistant-attachments'
import { AssistantVisualCard } from './assistant-visual'

/** A link to a screen or a guide: it takes the person somewhere in the panel. */
const PILL =
  'my-0.5 inline-flex items-center gap-1.5 rounded-full border border-iris-ring bg-iris-soft px-3 py-1 align-middle text-[12.5px] font-medium text-iris-ink transition-colors hover:bg-iris hover:text-on-iris'

/** A suggested next step: quieter than a link to a screen, since it keeps the person in the chat. */
const SUGGESTION =
  'inline-flex items-center gap-1.5 rounded-full border border-line-2 bg-card px-3 py-1.5 text-left align-middle text-[12.5px] font-medium text-ink-2 shadow-xs transition-all hover:-translate-y-px hover:border-iris-ring hover:bg-iris-soft hover:text-iris-ink disabled:pointer-events-none disabled:opacity-60'

interface InlineProps {
  pieces: ReplyInline[]
  onNavigate: () => void
  /** Asks a suggested next step. Unset while an answer is being written: one question at a time. */
  onAsk?: (question: string) => void
}

function Inline({ pieces, onNavigate, onAsk }: InlineProps) {
  return (
    <>
      {pieces.map((piece, i) => {
        if (piece.ask) {
          return (
            <button key={i} type="button" disabled={!onAsk} onClick={() => onAsk?.(piece.text)} className={SUGGESTION}>
              <CornerDownRight className="size-3.5 shrink-0 text-iris-ink" />
              {piece.text}
            </button>
          )
        }
        const text = piece.code ? (
          <code className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] text-ink">{piece.text}</code>
        ) : piece.bold ? (
          <strong className="font-semibold text-ink">{piece.text}</strong>
        ) : (
          piece.text
        )
        const { tourId, screenId, clientId } = piece
        if (tourId) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                onNavigate()
                tourStore.start(tourId)
              }}
              className={PILL}
            >
              <Pointer className="size-3.5" />
              {piece.text}
            </button>
          )
        }
        if (screenId) {
          return (
            <Link key={i} href={replyScreenHref(piece)} onClick={onNavigate} className={PILL}>
              {piece.text}
              <ArrowRight className="size-3.5" />
            </Link>
          )
        }
        return clientId ? (
          <Link
            key={i}
            href={clientHref(clientId)}
            onClick={onNavigate}
            className="font-medium text-iris-ink underline decoration-iris-ring underline-offset-2 hover:decoration-iris"
          >
            {text}
          </Link>
        ) : (
          <Fragment key={i}>{text}</Fragment>
        )
      })}
    </>
  )
}

const ALIGN: Record<ReplyAlign, string> = { left: 'text-left', right: 'text-right tabular-nums', center: 'text-center' }

/** A table the answer wrote: a real table, figures to the right, scrolling sideways when it is wide. */
function ReplyTable({
  header,
  rows,
  align,
  ...inline
}: {
  header: ReplyInline[][]
  rows: ReplyInline[][][]
  align: ReplyAlign[]
} & Omit<InlineProps, 'pieces'>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line-2 bg-card">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="bg-secondary/50">
            {header.map((cell, i) => (
              <th
                key={i}
                scope="col"
                className={cn('px-3 py-2 text-[11.5px] font-medium whitespace-nowrap text-faint', ALIGN[align[i]])}
              >
                <Inline pieces={cell.map(piece => ({ ...piece, bold: false }))} {...inline} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t border-line transition-colors hover:bg-iris-soft">
              {row.map((cell, c) => (
                <td
                  key={c}
                  className={cn('px-3 py-1.5 text-ink-2', ALIGN[align[c]], align[c] === 'right' && 'whitespace-nowrap')}
                >
                  <Inline pieces={cell} {...inline} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The assistant's reply, rendered from its light markdown with the panel's own elements (never as HTML). */
export function AssistantReply({
  content,
  onNavigate,
  onAsk,
  caret = false,
}: Omit<InlineProps, 'pieces'> & { content: string; caret?: boolean }) {
  const blocks = parseReply(content)
  const inline = { onNavigate, onAsk }
  return (
    <div className="flex flex-col gap-2.5">
      {blocks.map((block, i) => {
        const last = i === blocks.length - 1
        const end = caret && last ? <Caret /> : null
        switch (block.kind) {
          case 'table':
            return <ReplyTable key={i} header={block.header} rows={block.rows} align={block.align} {...inline} />
          case 'heading':
            return (
              <p
                key={i}
                className={cn(
                  'font-display font-medium tracking-[-0.01em] text-ink',
                  block.level === 1 ? 'text-[15.5px]' : 'text-[14px]',
                  i > 0 && 'pt-1',
                )}
              >
                <Inline pieces={block.lines[0]} {...inline} />
                {end}
              </p>
            )
          case 'list':
          case 'ordered': {
            const List = block.kind === 'list' ? 'ul' : 'ol'
            return (
              <List
                key={i}
                className={cn(
                  'flex flex-col gap-1 pl-4.5',
                  block.kind === 'list'
                    ? 'list-disc marker:text-iris-ring'
                    : 'list-decimal marker:text-[12px] marker:font-medium marker:text-iris-ink',
                )}
              >
                {block.lines.map((line, j) => (
                  <li key={j} className="pl-0.5">
                    <Inline pieces={line} {...inline} />
                    {last && j === block.lines.length - 1 && end}
                  </li>
                ))}
              </List>
            )
          }
          default:
            return block.lines.every(isSuggestionLine) ? (
              <div key={i} className="flex flex-wrap gap-1.5 pt-1">
                {block.lines.map((line, j) => (
                  <Inline key={j} pieces={line.filter(piece => piece.ask)} {...inline} />
                ))}
              </div>
            ) : (
              <p key={i}>
                {block.lines.map((line, j) => (
                  <Fragment key={j}>
                    {j > 0 && <br />}
                    <Inline pieces={line} {...inline} />
                  </Fragment>
                ))}
                {end}
              </p>
            )
        }
      })}
    </div>
  )
}

/**
 * The reply without its closing row of suggested next steps, and that row:
 * the suggestions go last, under the charts and cards they lead on from.
 */
function splitSuggestions(content: string): { body: string; next: string } {
  const paragraphs = content.trimEnd().split(/\n\s*\n/)
  const last = paragraphs.at(-1) ?? ''
  const lines = last.split('\n').filter(line => line.trim())
  const onlySuggestions =
    paragraphs.length > 1 &&
    lines.length > 0 &&
    parseReply(last).every(block => block.kind === 'paragraph' && block.lines.every(isSuggestionLine))
  return onlySuggestions ? { body: paragraphs.slice(0, -1).join('\n\n'), next: last } : { body: content, next: '' }
}

/** The blinking bar at the end of an answer still being written. */
function Caret() {
  const reduced = useReducedMotion()
  return (
    <motion.span
      aria-hidden
      className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] rounded-full bg-iris align-baseline"
      animate={reduced ? undefined : { opacity: [1, 0.15, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    />
  )
}

/** Fades a message in as it arrives. */
function Appear({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function UserBubble({
  content,
  faded = false,
  attachments = [],
}: {
  content: string
  faded?: boolean
  attachments?: AssistantAttachment[]
}) {
  return (
    <Appear className="flex flex-col items-end gap-1.5 pl-10">
      <MessageAttachments files={attachments} />
      {content && (
        <div
          className={cn(
            'max-w-full rounded-[18px] rounded-br-md border border-line bg-secondary px-3.5 py-2 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words text-ink',
            faded && 'opacity-70',
          )}
        >
          {content}
        </div>
      )}
    </Appear>
  )
}

/**
 * What the assistant checked to answer. While it works, each step as it
 * happens; once saved, one quiet line that opens the list.
 */
function Trace({ steps, live }: { steps: AssistantStep[]; live: boolean }) {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  if (!steps.length) return null
  const running = steps.filter(step => step.state === 'running')
  if (!live || !running.length) {
    const done = steps.length
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="flex w-fit items-center gap-1.5 rounded-full py-0.5 pr-2 pl-1 text-[12px] text-faint transition-colors hover:bg-secondary hover:text-ink-3"
        >
          <span className="grid size-4 place-items-center rounded-full bg-iris-soft text-iris-ink">
            <Check className="size-2.5" strokeWidth={3} />
          </span>
          {done === 1 ? steps[0].label : `Revisó ${done} cosas`}
          {done > 1 && <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />}
        </button>
        <AnimatePresence initial={false}>
          {open && done > 1 && (
            <motion.ul
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ml-2 flex flex-col gap-1 overflow-hidden border-l border-line-2 pl-3"
            >
              {steps.map(step => (
                <li key={step.id} className="text-[12px] text-faint">
                  {step.label}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    )
  }
  return (
    <ul className="flex flex-col gap-1" aria-live="polite">
      {steps.map(step => (
        <motion.li
          key={step.id}
          initial={reduced ? false : { opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-[12px]"
        >
          {step.state === 'running' ? (
            <Loader2 className="size-3.5 animate-spin text-iris-ink" />
          ) : (
            <span className="grid size-3.5 place-items-center rounded-full bg-iris-soft text-iris-ink">
              <Check className="size-2.5" strokeWidth={3} />
            </span>
          )}
          {step.state === 'running' ? (
            <Shimmer>{`${step.label}…`}</Shimmer>
          ) : (
            <span className="text-faint">{step.label}</span>
          )}
        </motion.li>
      ))}
    </ul>
  )
}

/** Text with a light sweeping across it: something is happening. */
function Shimmer({ children }: { children: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.span
      className="bg-[linear-gradient(90deg,var(--color-faint)_0%,var(--color-iris-ink)_50%,var(--color-faint)_100%)] bg-[length:200%_100%] bg-clip-text text-transparent"
      animate={reduced ? undefined : { backgroundPosition: ['100% 0%', '-100% 0%'] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.span>
  )
}

/** What it says before the first step or word: a few words that change while it waits. */
const WAITING = ['Pensando', 'Entendiendo tu pregunta', 'Buscando por dónde empezar']

function Thinking() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setIndex(i => Math.min(i + 1, WAITING.length - 1)), 2200)
    return () => clearInterval(timer)
  }, [])
  return (
    <span className="text-[13px]">
      <Shimmer>{`${WAITING[index]}…`}</Shimmer>
    </span>
  )
}

const DOWN_REASONS = ['Datos incorrectos', 'No entendió la pregunta', 'Le faltó información', 'Muy largo']

/** Copy, 👍, 👎 (with why) and ask again: under a saved answer. */
function AnswerTools({
  content,
  feedback,
  onRate,
  onRegenerate,
  visible,
}: {
  content: string
  feedback: AssistantFeedback | null
  onRate?: (rating: AssistantFeedback, comment?: string) => void
  onRegenerate?: () => void
  visible: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainReply(content))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('No se pudo copiar.')
    }
  }

  const sendDown = () => {
    onRate?.('down', [reason, comment.trim()].filter(Boolean).join(' · ') || undefined)
    setAsking(false)
    toast('Gracias: con esto mejoramos el asistente.')
  }

  const button =
    'grid size-7 place-items-center rounded-lg text-faint transition-colors hover:bg-secondary hover:text-ink-2 focus-visible:opacity-100'
  return (
    <div
      className={cn(
        'flex items-center gap-0.5 transition-opacity duration-150',
        visible || asking
          ? 'opacity-100'
          : 'opacity-0 group-focus-within/turn:opacity-100 group-hover/turn:opacity-100',
      )}
    >
      {content && (
        <button type="button" onClick={() => void copy()} className={button} title="Copiar la respuesta">
          {copied ? <Check className="size-3.5 text-iris-ink" /> : <Copy className="size-3.5" />}
          <span className="sr-only">{copied ? 'Copiada' : 'Copiar la respuesta'}</span>
        </button>
      )}
      {onRate && (
        <>
          <button
            type="button"
            onClick={() => {
              onRate('up')
              if (feedback !== 'up') toast('Gracias por avisar.')
            }}
            aria-pressed={feedback === 'up'}
            className={cn(
              button,
              feedback === 'up' && 'bg-iris-soft text-iris-ink hover:bg-iris-soft hover:text-iris-ink',
            )}
            title="Buena respuesta"
          >
            <ThumbsUp className={cn('size-3.5', feedback === 'up' && 'fill-current')} />
            <span className="sr-only">Buena respuesta</span>
          </button>
          <Popover open={asking} onOpenChange={setAsking}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-pressed={feedback === 'down'}
                className={cn(button, feedback === 'down' && 'bg-secondary text-ink-2')}
                title="Mala respuesta"
              >
                <ThumbsDown className={cn('size-3.5', feedback === 'down' && 'fill-current')} />
                <span className="sr-only">Mala respuesta</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-3">
              <p className="text-[13px] font-medium text-ink">¿Qué estuvo mal?</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DOWN_REASONS.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setReason(r => (r === option ? null : option))}
                    aria-pressed={reason === option}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[12px] transition-colors',
                      reason === option
                        ? 'border-iris bg-iris text-on-iris'
                        : 'border-line-2 text-ink-3 hover:border-iris-ring hover:bg-iris-soft',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={event => setComment(event.target.value.slice(0, 400))}
                rows={2}
                placeholder="Contanos qué esperabas (opcional)"
                className="mt-2 w-full resize-none rounded-lg border border-line-2 bg-background px-2.5 py-1.5 text-[12.5px] text-ink placeholder:text-faint focus-visible:border-iris focus-visible:outline-none"
              />
              <div className="mt-2 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setAsking(false)}
                  className="rounded-lg px-2.5 py-1 text-[12.5px] text-faint hover:text-ink-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={sendDown}
                  className="rounded-lg bg-iris px-3 py-1 text-[12.5px] font-medium text-on-iris transition-opacity hover:opacity-90"
                >
                  Enviar
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
      {onRegenerate && (
        <button type="button" onClick={onRegenerate} className={button} title="Preguntar de nuevo">
          <RotateCcw className="size-3.5" />
          <span className="sr-only">Preguntar de nuevo</span>
        </button>
      )}
    </div>
  )
}

interface AssistantTurnProps {
  content: string
  steps: AssistantStep[]
  actions: AssistantAction[]
  visuals?: AssistantVisual[]
  /** Still being written. */
  live?: boolean
  /** It ended with an error: the face shows it. */
  failed?: boolean
  /** The newest answer: its tools always show and its face is awake. */
  latest?: boolean
  feedback?: AssistantFeedback | null
  onRate?: (rating: AssistantFeedback, comment?: string) => void
  onRegenerate?: () => void
  busyActions: number[]
  onConfirm: (id: number) => void
  onCancel: (id: number) => void
  /** Unset while an answer is being written: one question at a time. */
  onUndo?: (id: number) => void
  onNavigate: () => void
  /** Asks a suggested next step. Unset while an answer is being written. */
  onAsk?: (question: string) => void
  footer?: ReactNode
}

/** One answer of the assistant: its face, the steps it took, its reply, the data it drew and the changes it prepared. */
export function AssistantTurn({
  content,
  steps,
  actions,
  visuals = [],
  live = false,
  failed = false,
  latest = false,
  feedback = null,
  onRate,
  onRegenerate,
  busyActions,
  onConfirm,
  onCancel,
  onUndo,
  onNavigate,
  onAsk,
  footer,
}: AssistantTurnProps) {
  const working = live && !content && !steps.some(s => s.state === 'running')
  const [justDone, setJustDone] = useState(false)
  const [wasLive, setWasLive] = useState(live)
  if (wasLive !== live) {
    setWasLive(live)
    if (wasLive && !failed) setJustDone(true)
  }
  useEffect(() => {
    if (!justDone) return
    const timer = setTimeout(() => setJustDone(false), 2200)
    return () => clearTimeout(timer)
  }, [justDone])

  const mood: AssistantMood = failed
    ? 'worried'
    : live
      ? content
        ? 'writing'
        : 'thinking'
      : justDone
        ? 'happy'
        : 'idle'
  const settled = !live && !failed && (!!content || visuals.length > 0)
  const { body, next } = live ? { body: content, next: '' } : splitSuggestions(content)

  return (
    <Appear className="group/turn flex gap-3">
      <div className="sticky top-3 h-fit pt-0.5">
        <AssistantMark size={26} mood={mood} still={!latest} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 text-[13.5px] leading-[1.6] text-ink-2">
        <Trace steps={steps} live={live} />
        {working && <Thinking />}
        {body && (
          <AssistantReply content={body} onNavigate={onNavigate} onAsk={live ? undefined : onAsk} caret={live} />
        )}
        {visuals.map(visual => (
          <AssistantVisualCard key={visual.id} visual={visual} />
        ))}
        {actions.map(action => (
          <AssistantActionCard
            key={action.id}
            action={action}
            busy={busyActions.includes(action.id)}
            onConfirm={() => onConfirm(action.id)}
            onCancel={() => onCancel(action.id)}
            onUndo={onUndo && (() => onUndo(action.id))}
            onNavigate={onNavigate}
          />
        ))}
        {next && <AssistantReply content={next} onNavigate={onNavigate} onAsk={onAsk} />}
        {footer}
        {settled && (
          <div className="-mt-1 -ml-1.5">
            <AnswerTools
              content={content}
              feedback={feedback}
              onRate={onRate}
              onRegenerate={onRegenerate}
              visible={latest}
            />
          </div>
        )}
      </div>
    </Appear>
  )
}
