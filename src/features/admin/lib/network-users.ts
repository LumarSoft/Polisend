import type {
  NetworkTree,
  NetworkTreeCode,
  NetworkTreePrincipal,
  NetworkUser,
  NetworkUserRole,
  NetworkUserRow,
  ReadOnlyNetworkUser,
  Zone,
} from '@/types/api/hierarchy'
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
  }
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
