'use client'

import { createContext, useContext, useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { onActingPrincipalInvalid, onActingPrincipalMismatch, setActingPrincipal } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { hierarchyService } from '@/services/hierarchy.service'
import type { AdminUser } from '@/types/api/auth'
import type { HierarchyPrincipal, HierarchyPrincipalCode } from '@/types/api/hierarchy'
import { useProfile } from '../hooks/use-profile'
import { clearStoredSelection, readStoredSelection, writeStoredSelection } from '../lib/acting-principal-storage'
import {
  EMPTY_SELECTION,
  noZoneLabel,
  resolveSelection,
  selectionOf,
  zonesOf,
  type NetworkSelection,
  type NetworkZone,
  type ZoneKey,
} from '../lib/network'
import { isOwnerRole } from '../lib/roles'
import { useAuth } from './auth-context'

export const ACTING_PRINCIPAL_LOST_MESSAGE = 'Ya no tenés acceso a ese principal'

export interface ActingPrincipalContextValue {
  /** An Owner's session: the cascading filter applies and every request carries X-Acting-Principal. */
  isOwnerSession: boolean
  /** The Owner's principals (GET /hierarchy/principals); [] for every other role. */
  principals: HierarchyPrincipal[]
  /** Its zones, plus "Mi principal" when its own principal is in none of them. */
  zones: NetworkZone[]
  isLoading: boolean
  selection: NetworkSelection
  zone: NetworkZone | null
  /** A principal is chosen: work screens show its data. False after a zone change that left it unset. */
  hasPrincipal: boolean
  /** The active principal, or null. */
  principal: HierarchyPrincipal | null
  /** The productor filter of the active principal; null = "Todos". */
  producerCode: HierarchyPrincipalCode | null
  /** The principal requests act on: the active one, else the Owner's own. Null outside an Owner's session. */
  actingPrincipalId: number | null
  homePrincipalId: number | null
  /** Changes the zone; a principal of another zone becomes unset. */
  selectZone: (key: ZoneKey) => void
  /** Makes it the active principal: the panel content remounts on the same tab, without URL params. */
  selectPrincipal: (id: number) => void
  /** A filter of the active principal: nothing remounts. */
  selectProducerCode: (id: number | null) => void
  /** After creating, renaming or moving a principal or a code: the filter's list lives outside each principal's cache. */
  refreshPrincipals: () => Promise<void>
}

/** What the panel content needs to mount (src/app/admin/providers.tsx). */
export interface PanelScope {
  /** False while the session's role (and, for an Owner, its principals) is unknown: nothing tenant may load yet. */
  ready: boolean
  /** The content's key: a new session, user or principal remounts it with a new QueryClient. */
  key: string
  /** The profile the session already loaded, to seed the new client (not for an Owner: its own names its principal). */
  seedProfile: AdminUser | null
}

const ActingPrincipalContext = createContext<ActingPrincipalContextValue | null>(null)
const PanelScopeContext = createContext<PanelScope>({ ready: true, key: 'anon', seedProfile: null })

export function useActingPrincipal(): ActingPrincipalContextValue {
  const ctx = useContext(ActingPrincipalContext)
  if (!ctx) throw new Error('useActingPrincipal must be used within an ActingPrincipalProvider')
  return ctx
}

export function usePanelScope(): PanelScope {
  return useContext(PanelScopeContext)
}

const noop = () => undefined

/**
 * The Owner's Zona › Principal › Productor (plan §6.2). Lives above each principal's QueryClient, so the choice and
 * the list survive a change of principal. For every other role it is inert: no list, no header.
 */
export function ActingPrincipalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { token } = useAuth()
  const profileQuery = useProfile()
  const profile = token ? profileQuery.data : undefined
  const userId = profile?.id ?? null
  const isOwnerSession = !!token && isOwnerRole(profile?.role)
  const homePrincipalId = profile ? (profile.homeProducerId ?? profile.producerId) : null

  const principalsQuery = useQuery({
    queryKey: QUERY_KEYS.hierarchy.principals,
    queryFn: () => hierarchyService.principals(token as string),
    enabled: isOwnerSession,
  })
  const principalsSettled = principalsQuery.isSuccess || principalsQuery.isError
  const principals = isOwnerSession ? (principalsQuery.data ?? []) : []
  const zones = zonesOf(principals, noZoneLabel(false))

  const [chosen, setChosen] = useState<{ userId: number; selection: NetworkSelection } | null>(null)
  const ownerReady = isOwnerSession && userId !== null && homePrincipalId !== null && principalsSettled
  const selection =
    ownerReady && userId !== null && homePrincipalId !== null
      ? resolveSelection(
          chosen?.userId === userId ? chosen.selection : readStoredSelection(userId),
          principals,
          homePrincipalId,
        )
      : EMPTY_SELECTION
  const actingPrincipalId = ownerReady ? (selection.principalId ?? homePrincipalId) : null

  // Mirrored before anything below renders, so the requests of the content mounted for this principal (and only those
  // of this session's token) carry it. The value is captured by each request when it is created.
  setActingPrincipal(token && actingPrincipalId !== null ? { token, principalId: actingPrincipalId } : null)

  const change = (next: NetworkSelection) => {
    if (userId === null) return
    const remount = next.principalId !== selection.principalId
    setChosen({ userId, selection: next })
    writeStoredSelection(userId, next)
    // Same tab, without the previous principal's URL params (an open client, a conversation…). History only, no
    // navigation, and the content remounts by its key. Null state, so Next syncs useSearchParams (see setUrlParams).
    if (remount && window.location.search) window.history.replaceState(null, '', pathname)
  }

  const goHome = () => {
    const home = principals.find(p => p.id === homePrincipalId)
    change(home ? selectionOf(home) : { ...EMPTY_SELECTION, principalId: homePrincipalId })
  }

  const onInvalid = useEffectEvent((principalId: number) => {
    if (!ownerReady || principalId !== actingPrincipalId || principalId === homePrincipalId) return
    goHome()
    // Rebind now (the render that would do it comes later), so the refreshed list is asked for the own principal.
    if (token && homePrincipalId !== null) setActingPrincipal({ token, principalId: homePrincipalId })
    void principalsQuery.refetch()
    toast.error(ACTING_PRINCIPAL_LOST_MESSAGE, { id: 'acting-principal-lost' })
  })

  useEffect(() => onActingPrincipalInvalid(principalId => onInvalid(principalId)), [])

  // An answer dropped for not naming the principal it was sent for: the account may have stopped being an Owner, and
  // only its profile says so (the API echoes nothing to a SuperAdmin). One profile request at a time.
  const onMismatch = useEffectEvent((principalId: number) => {
    if (!isOwnerSession || principalId !== actingPrincipalId || profileQuery.isFetching) return
    void profileQuery.refetch({ cancelRefetch: false })
  })

  useEffect(() => onActingPrincipalMismatch(principalId => onMismatch(principalId)), [])

  // Logging out forgets the Owner's choice (this tab's and the last one).
  const ownerUserRef = useRef<number | null>(null)
  useEffect(() => {
    if (isOwnerSession && userId !== null) ownerUserRef.current = userId
  }, [isOwnerSession, userId])
  // So does an Owner that stopped being one in this session: the panel is back on its own principal.
  useEffect(() => {
    if (isOwnerSession || userId === null || ownerUserRef.current !== userId) return
    clearStoredSelection(userId)
    ownerUserRef.current = null
    setChosen(null)
    toast.info('Tu cuenta ya no es Owner', {
      id: 'owner-role-lost',
      description: 'El panel volvió a tu principal, con lo que tu rol ve ahora.',
    })
  }, [isOwnerSession, userId])
  useEffect(() => {
    if (token || ownerUserRef.current === null) return
    clearStoredSelection(ownerUserRef.current)
    ownerUserRef.current = null
    setChosen(null)
  }, [token])

  const zone = zones.find(z => z.key === selection.zoneKey) ?? null
  const principal = principals.find(p => p.id === selection.principalId) ?? null
  const producerCode = principal?.codes.find(c => c.id === selection.producerCodeId) ?? null

  const value: ActingPrincipalContextValue = {
    isOwnerSession,
    principals,
    zones,
    isLoading: isOwnerSession && !principalsSettled,
    selection,
    zone,
    hasPrincipal: ownerReady && selection.principalId !== null,
    principal,
    producerCode,
    actingPrincipalId,
    homePrincipalId: isOwnerSession ? homePrincipalId : null,
    selectZone: ownerReady
      ? key => {
          const keeps = principal !== null && zones.find(z => z.key === key)?.principals.includes(principal)
          change(keeps ? { ...selection, zoneKey: key } : { zoneKey: key, principalId: null, producerCodeId: null })
        }
      : noop,
    selectPrincipal: ownerReady
      ? id => {
          const next = principals.find(p => p.id === id)
          if (next) change(selectionOf(next))
        }
      : noop,
    selectProducerCode: ownerReady ? id => change({ ...selection, producerCodeId: id }) : noop,
    refreshPrincipals: async () => {
      if (isOwnerSession) await principalsQuery.refetch()
    },
  }

  const tokenTail = token?.slice(-16) ?? ''
  const scope: PanelScope = !token
    ? { ready: true, key: 'anon', seedProfile: null }
    : !profile
      ? // An unreadable profile still renders the panel: its 401 handling (or its errors) take over.
        { ready: profileQuery.isError, key: `session:${tokenTail}`, seedProfile: null }
      : !isOwnerSession
        ? { ready: true, key: `user:${profile.id}:${tokenTail}`, seedProfile: profile }
        : {
            ready: ownerReady,
            key: `user:${profile.id}:${tokenTail}:principal:${selection.principalId ?? 'none'}`,
            seedProfile: null,
          }

  return (
    <ActingPrincipalContext.Provider value={value}>
      <PanelScopeContext.Provider value={scope}>{children}</PanelScopeContext.Provider>
    </ActingPrincipalContext.Provider>
  )
}
