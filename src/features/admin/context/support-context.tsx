'use client'

import { createContext, useContext, useEffect, useEffectEvent, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { onSupportUserInvalid, setSupportUser } from '@/lib/api-client'
import { readStoredSupport, tokenTailOf, writeStoredSupport, type StoredSupport } from '../lib/support-storage'
import { useAuth } from './auth-context'

export interface SupportContextValue {
  /** The Owner is inside another user's panel: every request is answered as that user. */
  active: boolean
  /** Goes inside a SuperAdmin's or Admin's panel to help it, from the Owner's Usuarios. */
  enter: (user: { id: number; name: string | null; email: string }) => void
  /** Back to the Owner's own panel. */
  exit: () => void
}

const SupportContext = createContext<SupportContextValue>({
  active: false,
  enter: () => undefined,
  exit: () => undefined,
})

export function useSupport(): SupportContextValue {
  return useContext(SupportContext)
}

/**
 * Support (Lucas, 19/11/2026): an Owner helps a SuperAdmin or Admin of its network with exactly that person's panel.
 * The API answers every request carrying X-Support-User as that user, so the profile (and from it the role, the menu,
 * the organization and its configuration) becomes the user's; leaving brings the Owner's own panel back. Lives above
 * the acting principal: inside a user, the Owner's Zona › Principal › Productor does not apply.
 */
export function SupportProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { token, hydrated } = useAuth()
  const [stored, setStored] = useState<StoredSupport | null>(readStoredSupport)
  const active = token && stored && stored.tokenTail === tokenTailOf(token) ? stored : null

  // Mirrored before anything below renders, so the profile and the content are asked as the user from the start.
  setSupportUser(token && active ? { token, userId: active.userId } : null)

  const switchTo = (next: StoredSupport | null) => {
    writeStoredSupport(next)
    setStored(next)
    // Bind now: the session's queries (the profile above all) are asked again right away, as the user or as the Owner.
    setSupportUser(token && next ? { token, userId: next.userId } : null)
    void queryClient.resetQueries()
  }

  const enter: SupportContextValue['enter'] = user => {
    if (!token) return
    switchTo({ tokenTail: tokenTailOf(token), userId: user.id })
    toast.success(`Entraste al panel de ${user.name || user.email}`, {
      id: 'support',
      description: 'Ves y hacés lo mismo que esa persona. Para volver a tu panel, «Salir del soporte» arriba.',
    })
    router.push('/admin')
  }

  const exit = () => {
    switchTo(null)
    router.push('/admin/usuarios')
  }

  // A session that is not the one that entered (logout, another login in this tab) is never inside (`active` above);
  // the tab forgets it too.
  // Only once the token was read: before that (a reload) there is none yet, and nothing ended.
  useEffect(() => {
    if (hydrated && stored && (!token || stored.tokenTail !== tokenTailOf(token))) writeStoredSupport(null)
  }, [hydrated, token, stored])

  // The user can no longer be helped (deleted, moved out of the network): back to the Owner's panel.
  const leaveRefused = useEffectEvent(() => {
    if (!active) return
    switchTo(null)
    toast.error('Ya no podés dar soporte a esa cuenta', { id: 'support-refused' })
    router.push('/admin/usuarios')
  })
  useEffect(() => onSupportUserInvalid(() => leaveRefused()), [])

  return <SupportContext.Provider value={{ active: active !== null, enter, exit }}>{children}</SupportContext.Provider>
}
