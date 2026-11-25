import { useSyncExternalStore } from 'react'

/**
 * The improvement announcements this browser already closed (or whose guide it started), in localStorage.
 * Per browser and not per account on purpose: several people share one account, and each should see a
 * notice once on their own computer. The guide stays in Mejoras to replay.
 */
const SEEN_KEY = 'panel-improvements-seen'
/** Ids kept, newest last: far more than the 30 days a notice lasts ever hold. */
const MAX_IDS = 200
/** No storage (blocked, private mode): as if everything was seen, so a notice never shows on every visit. */
const UNAVAILABLE = '*'

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // Closing it in one tab hides it in the others.
  const onStorage = (event: StorageEvent) => {
    if (event.key === SEEN_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** The raw stored value: a string, so the snapshot stays the same between reads. */
function snapshot(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? '[]'
  } catch {
    return UNAVAILABLE
  }
}

function parse(raw: string): number[] {
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : []
  } catch {
    return []
  }
}

/** Whether this browser already closed the notice. Null while it can't be known (server render): show nothing. */
export function useImprovementSeen(): ((id: number) => boolean) | null {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null)
  if (raw === null) return null
  const seen = raw === UNAVAILABLE ? null : new Set(parse(raw))
  return (id: number) => !seen || seen.has(id)
}

export function markImprovementSeen(id: number): void {
  try {
    const ids = parse(localStorage.getItem(SEEN_KEY) ?? '[]').filter(seen => seen !== id)
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids, id].slice(-MAX_IDS)))
  } catch {
    // Without storage nothing can be kept; snapshot() already treats it as seen.
  }
  notify()
}
