import type { PlatformBilling, PlatformBillingTotals, PlatformBillingZone } from '@/types/api/billing'

/**
 * The Developer's Tablero grouped Owner → Zona → Principal → Número (plan §5.5), from the zone grouping
 * `GET /platform/billing` adds (`zones`, each with its Owners and organization ids).
 *
 * A zone with several Owners shows under each of them (each Owner's totals are those of its zones); the page's totals
 * stay the API's, which count every organization once. Zones nobody has go under "Sin Owner", and the organizations
 * in no zone under "Sin zona", without a zone level.
 */
export interface BillingOwnerGroup {
  key: string
  /** The Owner's name, "Sin Owner" or "Sin zona". */
  name: string
  /** The Owner's e-mail (null for the two catch-all groups). */
  email: string | null
  /** "Sin zona": its organizations go right under it, with no zone row. */
  flat: boolean
  zones: PlatformBillingZone[]
  totals: PlatformBillingTotals & { organizations: number }
}

/** The numeric fields of a month's totals (the optional ones count as 0 when an older API leaves them out). */
type SummedKey = {
  [K in keyof PlatformBillingTotals]-?: NonNullable<PlatformBillingTotals[K]> extends number ? K : never
}[keyof PlatformBillingTotals]

/** The sum of several totals (zones of one Owner). */
export function sumBillingTotals(
  list: Array<PlatformBillingTotals & { organizations: number }>,
): PlatformBillingTotals & { organizations: number } {
  const sum = (key: SummedKey) => list.reduce((acc, totals) => acc + (totals[key] ?? 0), 0)
  return {
    organizations: list.reduce((acc, totals) => acc + totals.organizations, 0),
    messages: sum('messages'),
    sentMessages: sum('sentMessages'),
    templateMessages: sum('templateMessages'),
    botMessages: sum('botMessages'),
    campaignMessages: sum('campaignMessages'),
    metaBillableMessages: sum('metaBillableMessages'),
    billedUsd: sum('billedUsd'),
    messageCostUsd: sum('messageCostUsd'),
    marginUsd: sum('marginUsd'),
    metaCostUsd: sum('metaCostUsd'),
    openaiCostUsd: sum('openaiCostUsd'),
    profitUsd: sum('profitUsd'),
  }
}

/** The Owner groups of a month, or null for an API older than the zones (the Tablero then lists organizations). */
export function ownerGroupsOf(billing: PlatformBilling): BillingOwnerGroup[] | null {
  if (!billing.zones) return null

  const byOwner = new Map<number, { name: string; email: string; zones: PlatformBillingZone[] }>()
  const ownerless: PlatformBillingZone[] = []
  const unzoned: PlatformBillingZone[] = []
  for (const zone of billing.zones) {
    if (zone.id === null) {
      unzoned.push(zone)
      continue
    }
    if (zone.owners.length === 0) ownerless.push(zone)
    for (const owner of zone.owners) {
      const group = byOwner.get(owner.id) ?? { name: owner.name ?? owner.email, email: owner.email, zones: [] }
      group.zones.push(zone)
      byOwner.set(owner.id, group)
    }
  }

  const group = (key: string, name: string, email: string | null, zones: PlatformBillingZone[], flat = false) => ({
    key,
    name,
    email,
    flat,
    zones,
    totals: sumBillingTotals(zones.map(zone => zone.totals)),
  })

  const groups: BillingOwnerGroup[] = [...byOwner.entries()]
    .sort(([, a], [, b]) => a.name.localeCompare(b.name, 'es'))
    .map(([id, owner]) => group(`owner:${id}`, owner.name, owner.email, owner.zones))
  if (ownerless.length) groups.push(group('no-owner', 'Sin Owner', null, ownerless))
  if (unzoned.length) groups.push(group('no-zone', 'Sin zona', null, unzoned, true))
  return groups
}

/** Whether some zone has more than one Owner (it then shows under each). */
export function hasSharedZones(billing: PlatformBilling): boolean {
  return (billing.zones ?? []).some(zone => zone.owners.length > 1)
}
