/**
 * The user an Owner is giving support to, kept for this browser tab only (sessionStorage): another tab stays in the
 * Owner's own panel, and a reload stays inside. Tied to the session that entered (the tail of its token), so a new
 * login in the tab never starts inside someone.
 */
const KEY = 'panel.support'

export interface StoredSupport {
  /** The end of the token of the Owner's session that entered. */
  tokenTail: string
  userId: number
}

export const tokenTailOf = (token: string): string => token.slice(-16)

export function readStoredSupport(): StoredSupport | null {
  try {
    const raw = typeof window === 'undefined' ? null : sessionStorage.getItem(KEY)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    const { tokenTail, userId } = data as Record<string, unknown>
    if (typeof tokenTail !== 'string' || typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
      return null
    }
    return { tokenTail, userId }
  } catch {
    return null
  }
}

export function writeStoredSupport(support: StoredSupport | null): void {
  try {
    if (support) sessionStorage.setItem(KEY, JSON.stringify(support))
    else sessionStorage.removeItem(KEY)
  } catch {
    // Storage blocked: support lasts until the tab reloads.
  }
}
