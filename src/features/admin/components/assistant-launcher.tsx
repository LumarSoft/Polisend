'use client'

import { useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ASSISTANT_LAUNCHER_ATTRIBUTE } from '@/lib/assistant-launcher'
import { useAssistantPanel } from '../context/assistant-context'
import { AssistantMark, type AssistantMood } from './assistant-mark'

/** The face the buttons show: thinking while it works, happy with an answer waiting. */
function useLauncherMood(): AssistantMood {
  const { busy, unread } = useAssistantPanel()
  return busy ? 'thinking' : unread ? 'happy' : 'idle'
}

function useMac() {
  const [mac] = useState(() => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform))
  return mac
}

/**
 * Opens the AI assistant. The pill in the panel's top bar, or the mark alone
 * (`compact`) where a section has its own header, like Whatsapp.
 */
export function AssistantLauncher({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { available, setOpen, busy, unread } = useAssistantPanel()
  const mood = useLauncherMood()
  const mac = useMac()
  if (!available) return null

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Asistente (${mac ? '⌘' : 'Ctrl+'}K)`}
        className={cn(
          'relative grid size-9 shrink-0 place-items-center rounded-full transition-transform hover:scale-105',
          className,
        )}
      >
        <AssistantMark size={28} mood={mood} />
        {unread && <span className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-iris ring-2 ring-background" />}
        <span className="sr-only">Abrir el asistente</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'group relative ml-auto flex h-9 items-center gap-2 rounded-full border border-line-2 bg-background py-1 pr-2 pl-1 text-[12.5px] text-ink-3 shadow-xs transition-all',
        'hover:border-iris-ring hover:bg-iris-soft hover:text-iris-ink hover:shadow-[0_6px_18px_-10px_var(--color-iris-glow)]',
        className,
      )}
    >
      <AssistantMark size={26} mood={mood} />
      <span className="hidden font-medium sm:inline">
        {busy ? 'Pensando…' : unread ? 'Tu respuesta está lista' : 'Preguntale al asistente'}
      </span>
      <kbd className="hidden rounded-md border border-line-2 bg-secondary px-1.5 py-px font-sans text-[10.5px] text-faint group-hover:border-iris-ring md:inline">
        {mac ? '⌘K' : 'Ctrl K'}
      </kbd>
      {unread && <span className="absolute top-1 left-7 size-2 rounded-full bg-iris ring-2 ring-background" />}
      <span className="sr-only sm:hidden">Abrir el asistente</span>
    </button>
  )
}

const HINT_KEY = 'assistant_fab_hint_seen'
const hintListeners = new Set<() => void>()

function subscribeHint(listener: () => void) {
  hintListeners.add(listener)
  return () => {
    hintListeners.delete(listener)
  }
}

/** Whether this browser already saw the note. Without storage, as if it had: the note never nags. */
function hintSeen(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return true
  }
}

function markHintSeen() {
  try {
    localStorage.setItem(HINT_KEY, '1')
  } catch {
    // Without storage it may show again next time.
  }
  hintListeners.forEach(listener => listener())
}

/**
 * The assistant at the bottom right of every screen, for whoever misses the
 * one in the top bar: its face thinks while an answer is written and smiles
 * when one is waiting. The first time, a note says what it is for. Not in
 * Whatsapp, where it would cover the box to write in (that screen has its own
 * button), nor while the panel is open. Over an open sheet (a client's file, a
 * claim…) it rises above the sheet and stays usable, since that record is what
 * the assistant would be asked about; the sheet stays open when it is touched
 * (ASSISTANT_LAUNCHER_ATTRIBUTE).
 */
export function AssistantFab({ hidden = false }: { hidden?: boolean }) {
  const { available, open, setOpen, unread, overSheet } = useAssistantPanel()
  const mood = useLauncherMood()
  const reduced = useReducedMotion()
  const seenBefore = useSyncExternalStore(subscribeHint, hintSeen, () => true)
  const hint = !seenBefore
  const seen = markHintSeen
  if (!available || (hidden && !overSheet) || open) return null

  return (
    <div
      {...{ [ASSISTANT_LAUNCHER_ATTRIBUTE]: '' }}
      className={cn(
        'pointer-events-none fixed right-5 bottom-[max(20px,env(safe-area-inset-bottom))] flex items-end gap-2.5',
        overSheet ? 'z-[60]' : 'z-40',
      )}
    >
      <AnimatePresence>
        {(hint || unread) && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            className="pointer-events-auto relative max-w-[250px] rounded-2xl rounded-br-md border border-line-2 bg-card px-3.5 py-2.5 pr-8 text-[12.5px] leading-snug text-ink-2 shadow-lg"
          >
            {unread ? (
              <button type="button" onClick={() => setOpen(true)} className="text-left">
                <span className="font-medium text-iris-ink">Tu respuesta está lista.</span> Tocá para verla.
              </button>
            ) : (
              <>
                Preguntame por tu cartera, tus números o cómo hacer algo en el panel.{' '}
                <button type="button" onClick={seen} className="font-medium text-iris-ink hover:underline">
                  Entendido
                </button>
              </>
            )}
            {hint && !unread && (
              <button
                type="button"
                onClick={seen}
                className="absolute top-2 right-2 grid size-5 place-items-center rounded-full text-faint hover:bg-secondary"
              >
                <X className="size-3" />
                <span className="sr-only">Cerrar</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={() => {
          seen()
          setOpen(true)
        }}
        whileHover={reduced ? undefined : { scale: 1.06, y: -1 }}
        whileTap={reduced ? undefined : { scale: 0.94 }}
        title={unread ? 'Tu respuesta está lista' : 'Asistente'}
        className="pointer-events-auto relative grid size-14 shrink-0 place-items-center rounded-full border border-iris-ring bg-card shadow-[0_10px_30px_-10px_var(--color-iris-glow),0_2px_8px_-2px_rgb(0_0_0/0.12)] focus-visible:ring-2 focus-visible:ring-iris-ring focus-visible:outline-none"
      >
        <AssistantMark size={38} mood={mood} />
        {unread && (
          <span className="absolute top-0.5 right-0.5 size-3.5 rounded-full bg-iris ring-2 ring-background">
            {!reduced && <span className="absolute inset-0 animate-ping rounded-full bg-iris opacity-60" />}
          </span>
        )}
        <span className="sr-only">{unread ? 'Abrir el asistente: tu respuesta está lista' : 'Abrir el asistente'}</span>
      </motion.button>
    </div>
  )
}

/**
 * A screen's own way into the assistant: asks it a question about what is on
 * screen. `chip` (the default) for a header or a card's corner, `icon` for a
 * tight spot (the mark alone, the question as its title), `link` inside text.
 */
export function AskAssistantButton({
  question,
  label,
  variant = 'chip',
  className,
}: {
  question: string
  label: string
  variant?: 'chip' | 'icon' | 'link'
  className?: string
}) {
  const { available, ask, busy } = useAssistantPanel()
  if (!available) return null
  const onClick = () => ask(question)

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        title={label}
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-full transition-transform hover:scale-110 disabled:opacity-60',
          className,
        )}
      >
        <AssistantMark size={22} still />
        <span className="sr-only">{label}</span>
      </button>
    )
  }

  if (variant === 'link') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={cn(
          'inline-flex items-center gap-1 text-[12.5px] font-medium text-iris-ink underline decoration-iris-ring underline-offset-2 hover:decoration-iris disabled:opacity-60',
          className,
        )}
      >
        <AssistantMark size={16} still />
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border border-iris-ring bg-iris-soft py-1 pr-3 pl-1 text-[12.5px] font-medium text-iris-ink transition-all',
        'hover:-translate-y-px hover:bg-iris hover:text-on-iris hover:shadow-[0_6px_16px_-8px_var(--color-iris-glow)] disabled:pointer-events-none disabled:opacity-60',
        className,
      )}
    >
      <AssistantMark size={22} still />
      {label}
    </button>
  )
}
