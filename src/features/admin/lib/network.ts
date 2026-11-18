import type { HierarchyPrincipal } from '@/types/api/hierarchy'

/**
 * The cascading filter Zona › Principal › Productor, as pure data over `GET /hierarchy/principals`.
 *
 * A zone is a real zone id, or NO_ZONE for the principals the caller sees without a zone: an Owner's own principal
 * outside its zones ("Mi principal"), a SuperAdmin's principal, or the Developer's principals in no zone ("Sin zona").
 */
export const NO_ZONE = 'none'

export type ZoneKey = number | typeof NO_ZONE

export interface NetworkZone {
  key: ZoneKey
  name: string
  principals: HierarchyPrincipal[]
}

/** What an Owner is working on (persisted per user and per tab). `principalId` null = none chosen in that zone. */
export interface NetworkSelection {
  zoneKey: ZoneKey | null
  principalId: number | null
  /**
   * A group of a principal shown as its groups (`groupsAsPrincipals`): the zone's organizer or independent productor
   * chosen at the level of a principal. Null = the principal itself. Absent in selections stored before 18/11/2026.
   */
  groupId?: number | null
  /** The productor (producer code) filter; null = "Todos". */
  producerCodeId: number | null
}

export const EMPTY_SELECTION: NetworkSelection = {
  zoneKey: null,
  principalId: null,
  groupId: null,
  producerCodeId: null,
}

export function zoneKeyOf(principal: HierarchyPrincipal): ZoneKey {
  return principal.zoneId ?? NO_ZONE
}

/** Label of the principals without a zone: the Developer's are "Sin zona", anyone else's is its own principal. */
export function noZoneLabel(isDeveloper: boolean): string {
  return isDeveloper ? 'Sin zona' : 'Mi principal'
}

/** The zones of a principal list, by name, with the no-zone group last. */
export function zonesOf(principals: HierarchyPrincipal[], noZoneName: string): NetworkZone[] {
  const byKey = new Map<ZoneKey, NetworkZone>()
  for (const principal of principals) {
    const key = zoneKeyOf(principal)
    const zone = byKey.get(key) ?? {
      key,
      name: key === NO_ZONE ? noZoneName : (principal.zoneName ?? ''),
      principals: [],
    }
    zone.principals.push(principal)
    byKey.set(key, zone)
  }
  return [...byKey.values()].sort((a, b) => {
    if (a.key === NO_ZONE) return 1
    if (b.key === NO_ZONE) return -1
    return a.name.localeCompare(b.name, 'es')
  })
}

/** The selection of one principal: its zone, itself, every productor. */
export function selectionOf(principal: HierarchyPrincipal, groupId: number | null = null): NetworkSelection {
  return { zoneKey: zoneKeyOf(principal), principalId: principal.id, groupId, producerCodeId: null }
}

/** The codes the productor level offers: a chosen group's, or the whole principal's. */
export function codesInScope(principal: HierarchyPrincipal | null, groupId: number | null | undefined) {
  const codes = principal?.codes ?? []
  return groupId ? codes.filter(code => code.groupId === groupId) : codes
}

/**
 * A stored or chosen selection checked against the principals the Owner reaches today: a principal it lost, or a
 * zone that no longer has principals, falls back to its own principal; a productor that is gone falls back to "Todos".
 */
export function resolveSelection(
  wanted: NetworkSelection | null,
  principals: HierarchyPrincipal[],
  homePrincipalId: number,
): NetworkSelection {
  const home = principals.find(p => p.id === homePrincipalId)
  const fallback = home ? selectionOf(home) : { ...EMPTY_SELECTION, principalId: homePrincipalId }
  if (!wanted) return fallback

  if (wanted.principalId !== null) {
    const principal = principals.find(p => p.id === wanted.principalId)
    if (!principal) return fallback
    const groupId =
      wanted.groupId && principal.groups?.some(group => group.id === wanted.groupId) ? wanted.groupId : null
    const keepsCode = codesInScope(principal, groupId).some(code => code.id === wanted.producerCodeId)
    return { ...selectionOf(principal, groupId), producerCodeId: keepsCode ? wanted.producerCodeId : null }
  }

  const zoneExists = principals.some(p => zoneKeyOf(p) === wanted.zoneKey)
  return zoneExists ? { zoneKey: wanted.zoneKey, principalId: null, groupId: null, producerCodeId: null } : fallback
}

export function sameSelection(a: NetworkSelection, b: NetworkSelection): boolean {
  return (
    a.zoneKey === b.zoneKey &&
    a.principalId === b.principalId &&
    (a.groupId ?? null) === (b.groupId ?? null) &&
    a.producerCodeId === b.producerCodeId
  )
}
