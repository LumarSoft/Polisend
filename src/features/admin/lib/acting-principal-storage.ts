import { NO_ZONE, type NetworkSelection, type ZoneKey } from './network'

/**
 * Where an Owner's Zona › Principal › Productor choice is kept: per user and per browser tab (sessionStorage), with
 * the user's last choice (localStorage) as the starting point of a new tab. Both are removed on logout.
 */
const tabKey = (userId: number) => `panel.acting.${userId}`
const lastKey = (userId: number) => `panel.acting.last.${userId}`

function parseId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

function parseZone(value: unknown): ZoneKey | null {
  return value === NO_ZONE ? NO_ZONE : parseId(value)
}

function parseSelection(raw: string | null): NetworkSelection | null {
  if (!raw) return null
  try {
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    const record = data as Record<string, unknown>
    return {
      zoneKey: parseZone(record.zoneKey),
      principalId: parseId(record.principalId),
      groupId: parseId(record.groupId),
      producerCodeId: parseId(record.producerCodeId),
    }
  } catch {
    return null
  }
}

/** This tab's choice, else the user's last one, else null. */
export function readStoredSelection(userId: number): NetworkSelection | null {
  try {
    return (
      parseSelection(sessionStorage.getItem(tabKey(userId))) ?? parseSelection(localStorage.getItem(lastKey(userId)))
    )
  } catch {
    // Private window or blocked storage: the panel starts on the Owner's own principal.
    return null
  }
}

export function writeStoredSelection(userId: number, selection: NetworkSelection): void {
  try {
    const raw = JSON.stringify(selection)
    sessionStorage.setItem(tabKey(userId), raw)
    localStorage.setItem(lastKey(userId), raw)
  } catch {
    // Blocked storage: the choice just does not survive a reload.
  }
}

export function clearStoredSelection(userId: number): void {
  try {
    sessionStorage.removeItem(tabKey(userId))
    localStorage.removeItem(lastKey(userId))
  } catch {
    // Nothing stored, nothing to clear.
  }
}
