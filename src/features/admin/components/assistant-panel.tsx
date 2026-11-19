'use client'

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  Eye,
  History,
  Lock,
  Maximize2,
  Minimize2,
  Paperclip,
  Square,
  SquarePen,
} from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { AssistantMessage, AssistantOpenRecord, AssistantStep } from '@/types/api/assistant'
import type { AssistantState } from '../hooks/use-assistant'
import { useProfile } from '../hooks/use-profile'
import { MAX_QUESTION } from '../lib/assistant-format'
import { RECORD_LABELS, suggestionsFor, type AssistantSuggestion } from '../lib/assistant-suggestions'
import { AssistantHistory } from './assistant-history'
import { AssistantMark } from './assistant-mark'
import { AssistantTurn, UserBubble } from './assistant-message'
import { PendingAttachments } from './assistant-attachments'
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS, useAssistantAttachments } from '../hooks/use-assistant-attachments'

interface AssistantPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assistant: AssistantState
  plan: { included: boolean; availableIn: string | null; byRole?: boolean }
  route?: string
  /** The screen the person is on and the sheet open on it: what the assistant sees with each question. */
  screen?: string
  record?: AssistantOpenRecord
}

const savedSteps = (message: AssistantMessage): AssistantStep[] =>
  message.steps.map((label, i) => ({ id: `${message.id}-${i}`, label, state: 'done' }))

const EXPANDED_KEY = 'assistant_panel_expanded'

/** Whether the person left the panel wide; without storage, narrow. */
function readExpanded(): boolean {
  try {
    return localStorage.getItem(EXPANDED_KEY) === '1'
  } catch {
    return false
  }
}

function writeExpanded(expanded: boolean) {
  try {
    localStorage.setItem(EXPANDED_KEY, expanded ? '1' : '0')
  } catch {
    // Without storage the panel opens narrow next time.
  }
}

/** How far from the bottom still counts as reading the latest: new text keeps it in view. */
const PINNED_PX = 96

/**
 * The assistant's side panel, in its own iris identity whatever the palette:
 * the conversation (with the steps it takes, the data it draws and the changes
 * it prepares), the history, and the box to ask. It widens for tables and
 * charts, says what it is looking at, and follows the answer as it is written
 * unless the person scrolled up to read.
 */
export function AssistantPanel({ open, onOpenChange, assistant, plan, route, screen, record }: AssistantPanelProps) {
  const { data: profile } = useProfile()
  const reduced = useReducedMotion()
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [draft, setDraft] = useState('')
  // The width the person chose last time (the panel only renders in the browser, once opened).
  const [expanded, setExpanded] = useState(readExpanded)
  const [pinned, setPinned] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const files = useAssistantAttachments()
  const [dragging, setDragging] = useState(false)
  const { messages, live, streaming } = assistant
  const empty = messages.length === 0 && !live && !assistant.loading

  const toggleExpanded = () => {
    setExpanded(current => {
      writeExpanded(!current)
      return !current
    })
  }

  const scrollToEnd = (smooth = false) => {
    const box = scrollRef.current
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: smooth && !reduced ? 'smooth' : 'auto' })
  }

  // The newest content in view while the answer is written, unless the person scrolled up to read.
  const liveSize =
    (live?.text.length ?? 0) + (live?.steps.length ?? 0) + (live?.actions.length ?? 0) + (live?.visuals.length ?? 0)
  useEffect(() => {
    if (!open || view !== 'chat' || !pinned) return
    scrollToEnd()
    // Opening, the panel mounts as it slides in and the cards settle after: once more when they have.
    const frame = requestAnimationFrame(() => scrollToEnd())
    const later = setTimeout(() => scrollToEnd(), 350)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(later)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- follows the content, not the pin
  }, [open, view, messages.length, liveSize, assistant.loading, expanded])

  // A new question always brings the end into view (worked out while rendering, React's way to follow a value).
  const asking = live?.streaming ? live.question : null
  const [followed, setFollowed] = useState<string | null>(asking)
  if (asking !== followed) {
    setFollowed(asking)
    if (asking !== null) setPinned(true)
  }

  const onScroll = () => {
    const box = scrollRef.current
    if (!box) return
    setPinned(box.scrollHeight - box.scrollTop - box.clientHeight < PINNED_PX)
  }

  // Ready to type as soon as it opens.
  useEffect(() => {
    if (open && view === 'chat') requestAnimationFrame(() => inputRef.current?.focus())
  }, [open, view, assistant.conversationId])

  // The box grows with the question, up to a limit.
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 168)}px`
  }, [draft])

  const close = () => onOpenChange(false)

  // A question with files may go without words; never while a file is still being read.
  const canSend = (!!draft.trim() || files.ready.length > 0) && !files.uploading
  const submit = () => {
    if (!canSend || streaming) return
    void assistant.send(draft, files.ready)
    setDraft('')
    files.clear()
  }

  // A photo copied to the clipboard (a screenshot, an image from WhatsApp Web) goes in with ⌘V.
  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = Array.from(event.clipboardData.files)
    if (!pasted.length) return
    event.preventDefault()
    files.add(pasted)
  }

  const onDrop = (event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    setDragging(false)
    if (plan.included && view === 'chat') files.add(Array.from(event.dataTransfer.files))
  }
  const onDragOver = (event: DragEvent<HTMLElement>) => {
    if (!event.dataTransfer.types.includes('Files') || !plan.included || view !== 'chat') return
    event.preventDefault()
    if (!dragging) setDragging(true)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  const suggest = (suggestion: AssistantSuggestion) => {
    if (!suggestion.fill) {
      void assistant.send(suggestion.label)
      return
    }
    setDraft(suggestion.fill)
    requestAnimationFrame(() => {
      const input = inputRef.current
      input?.focus()
      input?.setSelectionRange(input.value.length, input.value.length)
    })
  }

  const startNew = () => {
    assistant.open(null)
    setView('chat')
    setDraft('')
  }

  const firstName = profile?.name?.trim().split(/\s+/)[0]
  const lastAnswerId = [...messages].reverse().find(m => m.role === 'assistant')?.id
  const turnProps = {
    busyActions: assistant.busyActions,
    onConfirm: assistant.confirm,
    onCancel: assistant.cancel,
    onUndo: streaming ? undefined : (id: number) => void assistant.send(`Deshacé el cambio de la propuesta #${id}`),
    onNavigate: close,
    onAsk: streaming ? undefined : (question: string) => void assistant.send(question),
  }
  const mood = streaming ? (live?.text ? 'writing' : 'thinking') : live?.error ? 'worried' : 'idle'
  const seeing = record ? RECORD_LABELS[record.kind] : screen

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'gap-0 overflow-hidden border-l border-line-2 bg-background p-0 transition-[max-width] duration-300 ease-out data-[side=right]:w-full',
          expanded ? 'data-[side=right]:sm:max-w-[min(860px,94vw)]' : 'data-[side=right]:sm:max-w-[468px]',
        )}
        onOpenAutoFocus={event => event.preventDefault()}
        onDragOver={onDragOver}
        onDragLeave={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={onDrop}
      >
        {/* The assistant's light: a soft iris glow behind the top of the panel. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(120%_100%_at_15%_0%,var(--color-iris-soft-2)_0%,transparent_60%),radial-gradient(90%_80%_at_95%_0%,var(--color-iris-glow)_0%,transparent_55%)] opacity-70"
        />
        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-2xl border-2 border-dashed border-iris bg-iris-soft/90 text-center backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-2 px-6">
                <AssistantMark size={44} mood="happy" />
                <p className="text-[14px] font-medium text-ink">Soltá acá las fotos o PDF</p>
                <p className="text-[12px] text-ink-3">Hasta {MAX_ATTACHMENTS} por pregunta, de 10 MB cada uno.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SheetHeader className="relative flex-row items-center gap-2.5 space-y-0 px-4 pt-3.5 pb-3 pr-12">
          {view === 'history' ? (
            <HeaderButton onClick={() => setView('chat')} label="Volver a la conversación" className="-ml-1.5">
              <ChevronLeft className="size-4" />
            </HeaderButton>
          ) : (
            <AssistantMark size={30} mood={mood} />
          )}
          <div className="min-w-0 flex-1">
            <SheetTitle className="flex items-center gap-1.5 truncate font-display text-[15px] tracking-[-0.01em] text-ink">
              {view === 'history' ? 'Conversaciones' : 'Asistente'}
              {view === 'chat' && streaming && (
                <span className="rounded-full bg-iris-soft px-1.5 py-px text-[10.5px] font-medium tracking-normal text-iris-ink">
                  {live?.text ? 'escribiendo' : 'pensando'}
                </span>
              )}
            </SheetTitle>
            <SheetDescription className="truncate text-[12px]">
              {view === 'history'
                ? 'Retomá una conversación anterior.'
                : (assistant.title ?? 'Con los datos de tu cartera, al día.')}
            </SheetDescription>
          </div>
          {plan.included && view === 'chat' && (
            <div className="flex items-center gap-0.5">
              <HeaderButton onClick={() => setView('history')} disabled={streaming} label="Conversaciones anteriores">
                <History className="size-4" />
              </HeaderButton>
              <HeaderButton onClick={startNew} disabled={streaming || empty} label="Nueva conversación">
                <SquarePen className="size-4" />
              </HeaderButton>
              <HeaderButton
                onClick={toggleExpanded}
                label={expanded ? 'Achicar el panel' : 'Ampliar el panel'}
                className="hidden sm:grid"
              >
                {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </HeaderButton>
            </div>
          )}
        </SheetHeader>

        {!plan.included ? (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="relative">
              <AssistantMark size={56} still />
              <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full border border-line-2 bg-card">
                <Lock className="size-3 text-faint" />
              </span>
            </div>
            <p className="text-[14px] font-medium text-ink">
              {plan.byRole ? 'Tu usuario no tiene habilitado el asistente' : 'Tu plan no incluye el asistente con IA'}
            </p>
            <p className="max-w-[300px] text-[13px] text-muted-foreground">
              {plan.byRole
                ? 'Lo define el soporte de la plataforma.'
                : plan.availableIn
                  ? `Está desde el plan ${plan.availableIn}. El plan de cada número se elige en Facturación.`
                  : 'El plan de cada número se elige en Facturación.'}
            </p>
          </div>
        ) : view === 'history' ? (
          <AssistantHistory
            currentId={assistant.conversationId}
            onOpen={id => {
              assistant.open(id)
              setView('chat')
            }}
            onRemove={assistant.remove}
          />
        ) : (
          <>
            {seeing && !empty && (
              <div className="relative flex items-center gap-1.5 border-b border-line px-4 pb-2 text-[11.5px] text-faint">
                <Eye className="size-3.5 shrink-0 text-iris-ink" />
                <span className="truncate">
                  Ve {record ? seeing : `la pantalla ${seeing}`}: preguntá por «esto» y sabe de qué hablás.
                </span>
              </div>
            )}
            <div className="relative min-h-0 flex-1">
              <div
                ref={scrollRef}
                onScroll={onScroll}
                className="absolute inset-0 flex flex-col overflow-y-auto overscroll-contain"
              >
                {assistant.loading ? (
                  <ConversationSkeleton />
                ) : empty ? (
                  <EmptyState
                    firstName={firstName}
                    route={route}
                    record={record}
                    seeing={seeing}
                    typing={!!draft.trim()}
                    onSuggest={suggest}
                    wide={expanded}
                  />
                ) : (
                  <div
                    className={cn(
                      'mx-auto flex w-full flex-col gap-6 px-4 py-5',
                      expanded ? 'max-w-[760px]' : 'max-w-full',
                    )}
                  >
                    {messages.map(message =>
                      message.role === 'user' ? (
                        <UserBubble key={message.id} content={message.content} attachments={message.attachments} />
                      ) : (
                        <AssistantTurn
                          key={message.id}
                          content={message.content}
                          steps={savedSteps(message)}
                          actions={message.actions}
                          visuals={message.visuals}
                          feedback={message.feedback ?? null}
                          latest={!live && message.id === lastAnswerId}
                          onRate={
                            message.id > 0
                              ? (rating, comment) => assistant.rate(message.id, rating, comment)
                              : undefined
                          }
                          onRegenerate={
                            !streaming && message.id === lastAnswerId
                              ? () => assistant.regenerate(message.id)
                              : undefined
                          }
                          {...turnProps}
                        />
                      ),
                    )}
                    {live && (
                      <>
                        <UserBubble content={live.question} attachments={live.attachments} />
                        <AssistantTurn
                          content={live.text}
                          steps={live.steps}
                          actions={live.actions}
                          visuals={live.visuals}
                          live={live.streaming}
                          failed={!!live.error}
                          latest
                          {...turnProps}
                          footer={
                            live.error ? (
                              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                <div className="flex flex-1 flex-col gap-1.5">
                                  <span>{live.error}</span>
                                  <button
                                    type="button"
                                    onClick={assistant.retry}
                                    className="self-start font-medium underline underline-offset-2"
                                  >
                                    Reintentar
                                  </button>
                                </div>
                              </div>
                            ) : live.stopped ? (
                              <p className="text-[12px] text-faint">
                                Respuesta detenida.{' '}
                                <button
                                  type="button"
                                  onClick={assistant.retry}
                                  className="underline underline-offset-2"
                                >
                                  Preguntar de nuevo
                                </button>
                              </p>
                            ) : null
                          }
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
              <AnimatePresence>
                {!pinned && !empty && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    onClick={() => {
                      setPinned(true)
                      scrollToEnd(true)
                    }}
                    className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line-2 bg-card/95 px-3 py-1.5 text-[12px] font-medium text-ink-2 shadow-lg backdrop-blur transition-colors hover:border-iris-ring hover:text-iris-ink"
                  >
                    <ArrowDown className="size-3.5" />
                    {streaming ? 'Seguir la respuesta' : 'Ir al final'}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <form
              className={cn('relative mx-auto w-full px-3 pt-2 pb-3', expanded && 'max-w-[792px]')}
              onSubmit={event => {
                event.preventDefault()
                submit()
              }}
            >
              <PendingAttachments files={files.pending} onRemove={files.remove} />
              <div className="rounded-[20px] border border-line-2 bg-card p-1.5 shadow-sm transition-[border-color,box-shadow] focus-within:border-iris-ring focus-within:shadow-[0_0_0_4px_var(--color-iris-soft),0_8px_24px_-12px_var(--color-iris-glow)]">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={event => setDraft(event.target.value.slice(0, MAX_QUESTION))}
                  onKeyDown={onKeyDown}
                  onPaste={onPaste}
                  rows={1}
                  maxLength={MAX_QUESTION}
                  placeholder={record ? 'Preguntá sobre esto o lo que necesites…' : 'Preguntá o pedí un cambio…'}
                  aria-label="Mensaje para el asistente"
                  className="max-h-[168px] min-h-[44px] w-full resize-none bg-transparent px-2.5 pt-2 pb-1 text-[13.5px] leading-relaxed text-ink placeholder:text-faint focus-visible:outline-none"
                />
                <div className="flex items-center gap-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ATTACHMENT_ACCEPT}
                    multiple
                    hidden
                    onChange={event => {
                      files.add(Array.from(event.target.files ?? []))
                      event.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={files.pending.length >= MAX_ATTACHMENTS}
                    title="Adjuntar fotos o PDF"
                    className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] text-faint transition-colors hover:bg-secondary hover:text-ink-2 disabled:opacity-50"
                  >
                    <Paperclip className="size-3.5" />
                    <span className="hidden sm:inline">Adjuntar</span>
                  </button>
                  <span className="ml-auto pr-1 text-[11px] text-faint tabular-nums">
                    {draft.length > MAX_QUESTION * 0.75 ? `${draft.length}/${MAX_QUESTION}` : ''}
                  </span>
                  <AnimatePresence mode="wait" initial={false}>
                    {streaming ? (
                      <motion.button
                        key="stop"
                        type="button"
                        onClick={assistant.stop}
                        initial={reduced ? false : { scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-background transition-opacity hover:opacity-85"
                        title="Detener la respuesta"
                      >
                        <Square className="size-3 fill-current" />
                        <span className="sr-only">Detener la respuesta</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        key="send"
                        type="submit"
                        disabled={!canSend}
                        initial={reduced ? false : { scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        whileTap={reduced ? undefined : { scale: 0.92 }}
                        className="grid size-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-iris-3),var(--color-iris)_55%,var(--color-iris-2))] text-on-iris shadow-[0_4px_12px_-4px_var(--color-iris-glow)] transition-[opacity,filter] hover:brightness-110 disabled:bg-none disabled:bg-secondary disabled:text-faint disabled:shadow-none"
                        title="Enviar (Enter)"
                      >
                        <ArrowUp className="size-4" />
                        <span className="sr-only">Enviar</span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="mt-1.5 px-2 text-center text-[11px] leading-snug text-faint">
                Antes de cambiar algo te muestra una tarjeta para confirmar. Puede equivocarse: revisá los datos.
              </p>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function HeaderButton({
  onClick,
  label,
  disabled,
  className,
  children,
}: {
  onClick: () => void
  label: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-secondary hover:text-ink-2 disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  )
}

/** A conversation loading: the shape of messages, not a spinner. */
function ConversationSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6" aria-busy>
      {[0, 1].map(i => (
        <div key={i} className="flex flex-col gap-4">
          <div className="ml-auto h-9 w-2/3 animate-pulse rounded-[18px] rounded-br-md bg-secondary" />
          <div className="flex gap-3">
            <div className="size-[26px] shrink-0 animate-pulse rounded-full bg-iris-soft-2" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className="h-3 w-11/12 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const CAN_DO = ['Consulta tu cartera', 'Calcula y compara', 'Prepara cambios', 'Lee fotos y PDF']

function EmptyState({
  firstName,
  route,
  record,
  seeing,
  typing,
  onSuggest,
  wide,
}: {
  firstName?: string
  route?: string
  record?: AssistantOpenRecord
  seeing?: string
  typing: boolean
  onSuggest: (suggestion: AssistantSuggestion) => void
  wide: boolean
}) {
  const reduced = useReducedMotion()
  const suggestions = suggestionsFor(route, record)
  return (
    <div
      className={cn('relative mx-auto flex w-full flex-1 flex-col justify-center px-5 py-8', wide && 'max-w-[680px]')}
    >
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={reduced ? false : { scale: 0.6, opacity: 0, y: 6 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <AssistantMark size={64} halo gaze={typing ? 'down' : null} />
        </motion.div>
        <h3 className="mt-5 font-display text-[21px] tracking-[-0.02em] text-ink">
          {firstName ? `Hola, ${firstName}` : 'Hola'}
        </h3>
        <p className="mt-1.5 max-w-[330px] text-[13px] leading-relaxed text-muted-foreground">
          Preguntame por tu cartera, tus números o cómo hacer algo en el panel. Si hace falta un cambio, te lo dejo
          listo para confirmar.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {CAN_DO.map(item => (
            <span key={item} className="rounded-full bg-iris-soft px-2.5 py-1 text-[11.5px] font-medium text-iris-ink">
              {item}
            </span>
          ))}
        </div>
      </div>
      {seeing && (
        <p className="mt-7 flex items-center justify-center gap-1.5 text-[11.5px] text-faint">
          <Eye className="size-3.5 text-iris-ink" />
          Estoy viendo {record ? seeing : `la pantalla ${seeing}`}
        </p>
      )}
      <div className={cn('mt-3 grid gap-2', wide ? 'grid-cols-2' : 'grid-cols-1')}>
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={suggestion.label}
            type="button"
            onClick={() => onSuggest(suggestion)}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + 0.05 * i, duration: 0.22 }}
            className={cn(
              'group flex items-center gap-3 rounded-2xl border border-line-2 bg-card px-3 py-2.5 text-left text-[13px] text-ink-2 shadow-xs',
              'transition-all hover:-translate-y-px hover:border-iris-ring hover:bg-iris-soft hover:text-ink hover:shadow-sm',
              i === 0 && record && 'border-iris-ring bg-iris-soft/60',
            )}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-iris-soft text-iris-ink transition-colors group-hover:bg-iris group-hover:text-on-iris">
              <suggestion.icon className="size-4" />
            </span>
            <span className="flex-1 leading-snug">{suggestion.label}</span>
            <ArrowRight className="size-3.5 shrink-0 text-faint opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
