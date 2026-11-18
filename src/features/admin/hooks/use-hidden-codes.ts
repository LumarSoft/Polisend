'use client'
import { useSyncExternalStore } from 'react'

/**
 * Whether the panel lists producer codes that are inactive or that Triunfo blocks (no new policies, renewals or
 * endorsements). Hidden by default; the Owner turns them on from Configuración › Cuenta. A per-browser preference.
 */
const STORAGE_KEY = 'panel.codes.showHidden'
const EVENT = 'panel-codes-show-hidden'

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(EVENT, onChange)
  }
}

function snapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function save(show: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(show))
  } catch {
    // Private window or blocked storage: the choice lasts until the page reloads.
  }
  window.dispatchEvent(new Event(EVENT))
}

/** The preference and its setter. */
export function useShowHiddenCodes(): [boolean, (show: boolean) => void] {
  const show = useSyncExternalStore(subscribe, snapshot, () => false)
  return [show, save]
}

/** A code the panel hides unless the preference is on. `isActive` absent = an active code (the filter's list). */
export function isHiddenCode(code: { isActive?: boolean; triunfoBlocked?: boolean }): boolean {
  return code.isActive === false || code.triunfoBlocked === true
}

/** The codes to list: all of them with the preference on, else the visible ones plus the one already chosen. */
export function visibleCodes<T extends { id: number; isActive?: boolean; triunfoBlocked?: boolean }>(
  codes: T[],
  showHidden: boolean,
  keepId: number | null = null,
): T[] {
  return showHidden ? codes : codes.filter(code => !isHiddenCode(code) || code.id === keepId)
}
