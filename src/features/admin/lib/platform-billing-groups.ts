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
  totals: GroupTotals
}

type GroupTotals = PlatformBillingTotals & { organizations: number }

const round2 = (n: number): number => Math.round(n * 100) / 100

/**
 * The sum of several totals (zones of one Owner), with the API's rule (`sumFigures`): an amount the API could not
 * compute (null: no cost rate or no partner terms) makes the group's amount null as soon as one part has it null, so a
 * partial sum never passes for the whole; an empty group sums to 0. Amounts are rounded to cents like the API's.
 */
export function sumBillingTotals(list: GroupTotals[]): GroupTotals {
  const sum = (read: (totals: GroupTotals) => number | null | undefined) =>
    list.reduce((acc, totals) => acc + (read(totals) ?? 0), 0)
  const sumAll = (read: (totals: GroupTotals) => number | null) =>
    list.some(totals => (read(totals) ?? null) === null) ? null : round2(sum(read))
  return {
    organizations: sum(t => t.organizations),
    messages: sum(t => t.messages),
    sentMessages: sum(t => t.sentMessages),
    templateMessages: sum(t => t.templateMessages),
    botMessages: sum(t => t.botMessages),
    campaignMessages: sum(t => t.campaignMessages),
    settledTokens: sum(t => t.settledTokens),
    planTokens: sum(t => t.planTokens),
    billedUsd: round2(sum(t => t.billedUsd)),
    costUsd: sumAll(t => t.costUsd),
    marginUsd: sumAll(t => t.marginUsd),
    lumarsoftMarginUsd: sumAll(t => t.lumarsoftMarginUsd),
    nicoMarginUsd: sumAll(t => t.nicoMarginUsd),
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
