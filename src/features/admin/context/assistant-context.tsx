'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { assistantService } from '@/services/assistant.service'
import type { AssistantOpenRecord } from '@/types/api/assistant'
import { useAuth } from './auth-context'
import { useAssistant } from '../hooks/use-assistant'
import { usePlanFeature } from '../hooks/use-billing'
import { AssistantPanel } from '../components/assistant-panel'

interface AssistantPanelContext {
  open: boolean
  setOpen: (open: boolean) => void
  /** False when no plan has the assistant, for the Developer, and for an Owner without a principal: no button at all. */
  available: boolean
  /** An answer is being written. */
  busy: boolean
  /** An answer finished while the panel was closed, and nobody opened it since. */
  unread: boolean
  /** Opens the panel and asks this question (a section's "ask the assistant" button). */
  ask: (question: string) => void
  /** A sheet with a record is open over the screen: the round button goes above it, the record is its subject. */
  overSheet: boolean
}

const Context = createContext<AssistantPanelContext>({
  open: false,
  setOpen: () => undefined,
  available: false,
  busy: false,
  unread: false,
  ask: () => undefined,
  overSheet: false,
})

/** A sheet tells the assistant it is open; the returned function takes it back. */
type OpenRecordRegistry = (record: AssistantOpenRecord, overlay: boolean) => () => void

const RecordRegistry = createContext<OpenRecordRegistry>(() => () => undefined)

/**
 * The record a sheet shows (a client's file, a claim, a request, a number, a
 * chat), for the assistant to know what "este cliente" or "esto" is. Called
 * inside the sheet, so every screen that opens it tells it; the last one opened
 * counts, and closing it gives the place back to the one under it. `overlay`
 * says it covers the screen (a sheet or a dialog), so the round button rises
 * above it; the chat picked in Whatsapp is a record but no overlay.
 */
export function useAssistantRecord(record: AssistantOpenRecord | null, { overlay = true } = {}): void {
  const register = useContext(RecordRegistry)
  const kind = record?.kind
  const id = record?.id
  useEffect(() => {
    if (!kind || !id) return
    return register({ kind, id }, overlay)
  }, [register, kind, id, overlay])
}

/** The API keeps the model ready for 5 minutes: opening again sooner asks for nothing. */
const WARM_EVERY_MS = 4 * 60_000

interface AssistantProviderProps {
  /** Off for the Developer (no cartera) and for an Owner without an active principal. */
  enabled: boolean
  /** The screen the person is on: sent with each question. */
  route: string
  screen: string
  children: ReactNode
}

/**
 * The AI assistant for the whole panel: one conversation that carries on
 * across sections (Whatsapp included), its side panel, and ⌘K / Ctrl+K to
 * open or close it from anywhere.
 */
export function AssistantProvider({ enabled, route, screen, children }: AssistantProviderProps) {
  const [open, setOpen] = useState(false)
  const plan = usePlanFeature('ai_assistant', enabled)
  const available = enabled && !plan.nowhere
  // Sheets open one over another: the top one is what the person is looking at.
  const [records, setRecords] = useState<Array<{ key: symbol; record: AssistantOpenRecord; overlay: boolean }>>([])
  const register = useCallback<OpenRecordRegistry>((record, overlay) => {
    const key = Symbol(record.kind)
    setRecords(current => [...current, { key, record, overlay }])
    return () => setRecords(current => current.filter(entry => entry.key !== key))
  }, [])
  const record = records.at(-1)?.record
  const overSheet = records.some(entry => entry.overlay)
  const page = useMemo(() => ({ route, screen, ...(record ? { record } : {}) }), [route, screen, record])
  const assistant = useAssistant(page, available)

  useEffect(() => {
    if (!available) return
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(current => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [available])

  // An answer that ends with the panel closed leaves a dot on the buttons and says so once.
  // Worked out while rendering (React's way to follow a value), the toast after.
  const [unread, setUnread] = useState(false)
  const [wasStreaming, setWasStreaming] = useState(assistant.streaming)
  if (wasStreaming !== assistant.streaming) {
    setWasStreaming(assistant.streaming)
    if (wasStreaming && !open) setUnread(true)
  }
  if (open && unread) setUnread(false)
  useEffect(() => {
    if (unread) toast('El asistente terminó de responder', { action: { label: 'Ver', onClick: () => setOpen(true) } })
  }, [unread])

  // Opening the panel gets the model ready while the person writes.
  const { token } = useAuth()
  const warmedAt = useRef(0)
  useEffect(() => {
    if (!open || !available || !token || Date.now() - warmedAt.current < WARM_EVERY_MS) return
    warmedAt.current = Date.now()
    assistantService.warm(token, page).catch(() => {
      // Only a head start: the question works the same without it.
      warmedAt.current = 0
    })
  }, [open, available, token, page])

  const { streaming, send } = assistant
  const ask = useCallback(
    (question: string) => {
      // The question itself gets the model ready: no separate warm-up.
      warmedAt.current = Date.now()
      setOpen(true)
      if (!streaming) void send(question)
    },
    [streaming, send],
  )

  const value = useMemo(
    () => ({ open, setOpen, available, busy: streaming, unread, ask, overSheet }),
    [open, available, streaming, unread, ask, overSheet],
  )

  return (
    <Context.Provider value={value}>
      <RecordRegistry.Provider value={register}>{children}</RecordRegistry.Provider>
      {available && (
        <AssistantPanel
          open={open}
          onOpenChange={setOpen}
          assistant={assistant}
          plan={plan}
          route={route}
          screen={screen}
          record={record}
        />
      )}
    </Context.Provider>
  )
}

export function useAssistantPanel(): AssistantPanelContext {
  return useContext(Context)
}
