import { useEffect, useRef, useState } from 'react'
import { assistantService } from '@/services/assistant.service'
import type { AssistantAttachment } from '@/types/api/assistant'
import { useAuth } from '../context/auth-context'
import { assistantErrorText } from './use-assistant'

/** Files one question may carry (the API's limit too). */
export const MAX_ATTACHMENTS = 4
/** Largest file the API takes. */
const MAX_SIZE = 10 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'application/pdf']
/** What the file picker offers. */
export const ATTACHMENT_ACCEPT = ACCEPTED.join(',')

/** A file waiting to go with the next question: uploading, ready, or refused. */
export interface PendingAttachment {
  key: string
  name: string
  kind: 'image' | 'pdf'
  /** A local preview of a photo, until it is sent. */
  preview: string | null
  status: 'uploading' | 'ready' | 'error'
  error: string | null
  attachment: AssistantAttachment | null
}

const newKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

/** Why the API would refuse a file, said before uploading it; null when it is fine. */
function problemOf(file: File): string | null {
  if (!ACCEPTED.includes(file.type)) return 'Solo fotos (JPG, PNG, WebP, HEIC) o PDF.'
  if (file.size > MAX_SIZE) return 'Pesa más de 10 MB.'
  return null
}

/**
 * The photos and PDFs attached to the question being written. Each uploads as
 * soon as it is added (the API reads it then), so sending does not wait for
 * it; a refused one shows why and stays out of the question.
 */
export function useAssistantAttachments() {
  const { token } = useAuth()
  const [pending, setPending] = useState<PendingAttachment[]>([])
  const count = useRef(0)
  const previews = useRef(new Set<string>())

  useEffect(() => {
    count.current = pending.length
  }, [pending])

  // The local previews go away with the panel.
  useEffect(() => {
    const urls = previews.current
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [])

  const update = (key: string, change: Partial<PendingAttachment>) =>
    setPending(current => current.map(item => (item.key === key ? { ...item, ...change } : item)))

  const forget = (preview: string | null) => {
    if (!preview) return
    URL.revokeObjectURL(preview)
    previews.current.delete(preview)
  }

  const add = (files: File[]) => {
    if (!token || !files.length) return
    const room = Math.max(MAX_ATTACHMENTS - count.current, 0)
    const taken = files.slice(0, room)
    const items = taken.map(file => {
      const kind: PendingAttachment['kind'] = file.type === 'application/pdf' ? 'pdf' : 'image'
      const problem = problemOf(file)
      const preview = kind === 'image' && !problem ? URL.createObjectURL(file) : null
      if (preview) previews.current.add(preview)
      return {
        file,
        item: {
          key: newKey(),
          name: file.name || (kind === 'pdf' ? 'documento.pdf' : 'imagen'),
          kind,
          preview,
          status: problem ? 'error' : 'uploading',
          error: problem,
          attachment: null,
        } satisfies PendingAttachment,
      }
    })
    const skipped = files.length - taken.length
    const overLimit: PendingAttachment[] = skipped
      ? [
          {
            key: newKey(),
            name: `${skipped} archivo${skipped === 1 ? '' : 's'} de más`,
            kind: 'image',
            preview: null,
            status: 'error',
            error: `Hasta ${MAX_ATTACHMENTS} por pregunta.`,
            attachment: null,
          },
        ]
      : []
    count.current += items.length
    setPending(current => [...current, ...items.map(({ item }) => item), ...overLimit])

    for (const { file, item } of items) {
      if (item.status !== 'uploading') continue
      assistantService
        .upload(token, file)
        .then(attachment => update(item.key, { status: 'ready', attachment }))
        .catch((error: unknown) => update(item.key, { status: 'error', error: assistantErrorText(error) }))
    }
  }

  const remove = (key: string) => {
    forget(pending.find(item => item.key === key)?.preview ?? null)
    setPending(current => current.filter(item => item.key !== key))
  }

  /** Empties the box after sending: the files are the question's now, shown from the API. */
  const clear = () => {
    pending.forEach(item => forget(item.preview))
    count.current = 0
    setPending([])
  }

  return {
    pending,
    ready: pending.flatMap(item => (item.status === 'ready' && item.attachment ? [item.attachment] : [])),
    uploading: pending.some(item => item.status === 'uploading'),
    add,
    remove,
    clear,
  }
}
