import type {
  CodeGroup,
  NetworkTree,
  NetworkTreeCode,
  NetworkTreePrincipal,
  NetworkUser,
  NetworkUserRole,
  NetworkUserRow,
  ReadOnlyNetworkUser,
  Zone,
} from '@/types/api/hierarchy'
import { NO_ZONE, type ZoneKey } from './network'
import { ROLES, roleLabel } from './roles'

/**
 * Pure helpers of the Usuarios screen (plan §6.3): the caller's principals and zones as the user form needs them,
 * generated passwords and the summary shown before saving.
 */

/** A principal of the caller's network, from `GET /hierarchy/tree`: its zone, how many accounts it has, every code. */
export interface FormPrincipal {
  id: number
  name: string
  zoneId: number | null
  zoneName: string | null
  isActive: boolean
  isHome: boolean
  /** Live SuperAdmins plus Admins. */
  accounts: number
  /** Every live code, active or not. */
  codes: NetworkTreeCode[]
  /**
   * It holds a zone's productores (`groupsAsPrincipals`): the form offers each of its groups as a principal, worked
   * through an Admin with the codes chosen; nobody is made SuperAdmin of the whole zone.
   */
  groupsAsPrincipals: boolean
  /** The groups its codes are ordered in, by name. */
  groups: CodeGroup[]
}

function toFormPrincipal(principal: NetworkTreePrincipal, zone: { id: number; name: string } | null): FormPrincipal {
  return {
    id: principal.id,
    name: principal.name,
    zoneId: zone?.id ?? null,
    zoneName: zone?.name ?? null,
    isActive: principal.isActive,
    isHome: principal.isHome,
    accounts: principal.users.superAdmins + principal.users.admins,
    codes: principal.codes,
    groupsAsPrincipals: principal.groupsAsPrincipals === true,
    groups: principal.groups ?? [],
  }
}

export function formZoneKey(principal: FormPrincipal): ZoneKey {
  return principal.zoneId ?? NO_ZONE
}

/** A zone of the user form's "Zona" select: the principals the caller reaches in it. */
export interface FormZone {
  key: ZoneKey
  name: string
  /** Principals at the level the form offers them: a zone's productores count one per group. */
  principals: number
}

/** The zones of the caller's principals, by name, with the principals in no zone last (`noZoneName`). */
export function formZonesOf(principals: FormPrincipal[], noZoneName: string): FormZone[] {
  const byKey = new Map<ZoneKey, FormZone>()
  for (const principal of principals) {
    const key = formZoneKey(principal)
    const zone = byKey.get(key) ?? {
      key,
      name: key === NO_ZONE ? noZoneName : (principal.zoneName ?? ''),
      principals: 0,
    }
    zone.principals += principal.groupsAsPrincipals ? Math.max(1, groupChoices(principal).length) : 1
    byKey.set(key, zone)
  }
  return [...byKey.values()].sort((a, b) =>
    a.key === NO_ZONE ? 1 : b.key === NO_ZONE ? -1 : a.name.localeCompare(b.name, 'es'),
  )
}

/** `principalId` or `principalId:groupId`: a principal-level choice of the user form. */
export function choiceValue(principalId: number, groupId: number | null = null): string {
  return groupId === null ? String(principalId) : `${principalId}:${groupId}`
}

export function parseChoice(value: string): { principalId: number; groupId: number | null } {
  const [principalId, groupId] = value.split(':').map(Number)
  return { principalId, groupId: Number.isFinite(groupId) ? groupId : null }
}

export const UNGROUPED_LABEL = 'Sin clasificar'

/** A group of a zone's productores as a principal of the form; `groupId` null = the codes still without a group. */
export interface GroupChoice {
  groupId: number | null
  name: string
  /** Its live codes. */
  codes: number
}

/** The groups of a principal that holds a zone's productores, by name, and its codes without a group last. */
export function groupChoices(principal: FormPrincipal): GroupChoice[] {
  const groups = principal.groups
    .map(group => ({
      groupId: group.id,
      name: group.name,
      codes: principal.codes.filter(code => code.groupId === group.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const loose = principal.codes.filter(code => !code.groupId).length
  if (loose === 0 && groups.length > 0) return groups
  return [...groups, { groupId: null, name: groups.length ? UNGROUPED_LABEL : principal.name, codes: loose }]
}

/** The name of a code's group in a principal that holds a zone's productores. */
export function groupNameOf(principal: FormPrincipal, groupId: number | null | undefined): string {
  return principal.groups.find(group => group.id === groupId)?.name ?? UNGROUPED_LABEL
}

/** "FERLINI", "FERLINI y SOSA", "FERLINI, SOSA y 2 más". */
export function nameList(names: string[], shown = 2): string {
  if (names.length <= 1) return names.join('')
  if (names.length <= shown + 1) return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
  return `${names.slice(0, shown).join(', ')} y ${names.length - shown} más`
}

/** Every principal of the tree once (zones, the Developer's unzoned ones, the caller's own), by name. */
export function principalsOfTree(tree: NetworkTree | undefined): FormPrincipal[] {
  if (!tree) return []
  const byId = new Map<number, FormPrincipal>()
  for (const zone of tree.zones) {
    for (const principal of zone.principals) byId.set(principal.id, toFormPrincipal(principal, zone))
  }
  for (const principal of [...(tree.unzoned ?? []), ...(tree.home ? [tree.home] : [])]) {
    if (!byId.has(principal.id)) byId.set(principal.id, toFormPrincipal(principal, null))
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

/** The zones a new principal can go to (the Owner's own; every live zone for the Developer), empty ones included. */
export function zonesOfTree(tree: NetworkTree | undefined): Zone[] {
  return (tree?.zones ?? []).map(({ id, name, code }) => ({ id, name, code }))
}

const PASSWORD_ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** A random password without look-alike characters (no l/1, O/0), for the manager to copy and hand over. */
export function generatePassword(length = 12): string {
  const values = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(values, value => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join('')
}

export const MIN_PASSWORD_LENGTH = 6

export function codeCountLabel(count: number): string {
  return count === 1 ? '1 código' : `${count} códigos`
}

/** "14831, 14832 y 3 más": the first few codes of a list. */
export function codeList(codes: string[], shown = 5): string {
  if (codes.length <= shown) return codes.join(', ')
  return `${codes.slice(0, shown).join(', ')} y ${codes.length - shown} más`
}

interface AccessSummaryInput {
  /** The person's name, else its e-mail. */
  who: string
  role: NetworkUserRole
  principalName: string
  /** The codes it will see. */
  codes: string[]
  newPrincipal?: boolean
}

/**
 * The sentence shown before saving: "Funes (Admin) va a ver 1 código de John: 14831", "Rosario (SuperAdmin) va a
 * administrar John y ver sus 27 códigos".
 */
export function accessSummary({ who, role, principalName, codes, newPrincipal = false }: AccessSummaryInput): string {
  const person = `${who} (${roleLabel(role)})`
  if (role === ROLES.admin) {
    return `${person} va a ver ${codeCountLabel(codes.length)} de ${principalName}: ${codeList(codes)}`
  }
  const principal = newPrincipal ? `el principal nuevo ${principalName}` : principalName
  if (codes.length === 0) return `${person} va a administrar ${principal}`
  const seen = codes.length === 1 ? `su código: ${codes[0]}` : `sus ${codes.length} códigos: ${codeList(codes)}`
  return `${person} va a administrar ${principal} y ver ${seen}`
}

/**
 * The role the panel shows: the SuperAdmin of a zone's groups is an Admin with groups for the API (so nothing of the
 * whole zone reaches it), and a SuperAdmin here.
 */
export function shownRole(user: NetworkUser): NetworkUserRole {
  return user.groups?.length ? ROLES.superAdmin : user.role
}

/** The heading a row of Usuarios goes under: its principal, or for a zone's productores the group(s) it works. */
export interface UserHeading {
  key: string
  name: string
}

/**
 * Where a user is listed. A principal that holds a zone's productores is never a heading of its own: its SuperAdmin of
 * groups goes under those groups, its Admin under the group of its codes («Sin clasificar» for the codes without one).
 */
export function userHeading(
  user: NetworkUser,
  principal:
    | {
        groupsAsPrincipals?: boolean
        groups?: Array<{ id: number; name: string }>
        codes: Array<{ id: number; groupId?: number | null }>
      }
    | undefined,
): UserHeading {
  const own = { key: `p${user.principal.id}`, name: user.principal.name }
  if (!principal?.groupsAsPrincipals) return own
  const nameOf = (groupId: number | null | undefined) =>
    principal.groups?.find(group => group.id === groupId)?.name ?? UNGROUPED_LABEL
  if (user.groups?.length) {
    return { key: `${own.key}:${user.groups.map(g => g.id).join(',')}`, name: nameList(user.groups.map(g => g.name)) }
  }
  // An old SuperAdmin of the whole principal (from before 19/11) has neither: it stays under the principal.
  if (!user.codes.length) return own
  const groupIds = [...new Set(user.codes.map(code => principal.codes.find(c => c.id === code.id)?.groupId ?? null))]
  return { key: `${own.key}:${groupIds.join(',')}`, name: nameList(groupIds.map(nameOf)) }
}

/** An account the caller manages (every row but the Owner's read-only ones). */
export function isManagedUser(row: NetworkUserRow): row is NetworkUser {
  return row.readOnly !== true
}

/** A row only an Owner gets, that nobody may edit: Lumarsoft's accounts and the other Owners of its zones. */
export function isReadOnlyUser(row: NetworkUserRow): row is ReadOnlyNetworkUser {
  return row.readOnly === true
}

/** Whether a read-only row matches the search box (the managed ones are searched by the API). */
export function matchesSearch(user: ReadOnlyNetworkUser, search: string): boolean {
  const needle = search.trim().toLocaleLowerCase('es')
  if (!needle) return true
  return [user.name ?? '', user.email].some(text => text.toLocaleLowerCase('es').includes(needle))
}

export function formatJoinDate(value: string): string {
  return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}
