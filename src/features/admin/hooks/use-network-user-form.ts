import { useState } from 'react'
import type {
  CreateNetworkUserRequest,
  NetworkUser,
  NetworkUserRole,
  NewPrincipalInput,
  RestoreNetworkUserResponse,
  UpdateNetworkUserRequest,
} from '@/types/api/hierarchy'
import { apiErrorMessage, isCodesOfAnotherPrincipal, restorableUserIdOf } from '../lib/api-error-message'
import { accessSummary, MIN_PASSWORD_LENGTH, type FormPrincipal } from '../lib/network-users'
import { isValidCode } from '../lib/producer-code'
import { ROLES, roleLabel } from '../lib/roles'
import { useNetworkUserActions, usePrincipalCodeActions } from './use-hierarchy'
import { useProfile } from './use-profile'
import { useRole } from './use-role'
import { useUserFormOptions } from './use-user-form-options'

/**
 * The one user form of plan §6.3 (create and edit, for the Developer, the Owner and the SuperAdmin): its state, what it
 * may offer each role, the summary before saving and the calls to `/hierarchy/users`. The component only renders.
 *
 * The Developer (decision of 17/11) manages the SuperAdmins and Admins of every principal: it creates and restores them
 * by invitation, changes their name, role, codes and principal, deletes them (the last one of a principal too), sends
 * password links and resets their two-step verification. It never chooses a password and never changes the e-mail of
 * an existing account: with either it could log in as the person and see the cartera.
 */

export type PrincipalMode = 'existing' | 'new'

export interface NewCodeRow {
  key: string
  code: string
  holderName: string
}

export interface NewPrincipalDraft {
  zoneId: number | null
  name: string
  masterCode: string
  codes: NewCodeRow[]
}

/** A code of the form's principal, as the Admin's checkboxes list it. */
export interface CodeOption {
  id: number
  code: string
  holderName: string | null
  isActive: boolean
  isMaster: boolean
}

export interface SavedResult {
  title: string
  description?: string
}

interface Options {
  /** Null = a new user. */
  user: NetworkUser | null
  /** The principal a new user starts in (the list's filter or `?principal=`). */
  defaultPrincipalId: number | null
  /** The role a new user starts with; Admin by default. */
  defaultRole?: NetworkUserRole
  onSaved: (result: SavedResult) => void
}

export function newCodeRow(): NewCodeRow {
  return { key: crypto.randomUUID(), code: '', holderName: '' }
}

const EMPTY_DRAFT: NewPrincipalDraft = { zoneId: null, name: '', masterCode: '', codes: [] }

function principalCodes(principal: FormPrincipal | null, created: Array<CodeOption & { principalId: number }>) {
  const codes: CodeOption[] = [...(principal?.codes ?? [])]
  for (const code of created) {
    if (code.principalId === principal?.id && !codes.some(c => c.id === code.id)) codes.push(code)
  }
  return codes
}

export function useNetworkUserForm({ user, defaultPrincipalId, defaultRole = ROLES.admin, onSaved }: Options) {
  const { isDeveloper, isOwner, isSuperAdmin } = useRole()
  const { data: profile } = useProfile()
  const options = useUserFormOptions()
  const actions = useNetworkUserActions()
  const codeActions = usePrincipalCodeActions()
  const isEdit = user !== null
  const isSelf = isEdit && user.id === profile?.id

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRoleState] = useState<NetworkUserRole>(user?.role ?? defaultRole)
  const [principalMode, setPrincipalMode] = useState<PrincipalMode>('existing')
  const [principalId, setPrincipalIdState] = useState<number | null>(user?.principal.id ?? defaultPrincipalId)
  const [draft, setDraft] = useState<NewPrincipalDraft>(EMPTY_DRAFT)
  const [codeIds, setCodeIds] = useState<number[]>(user?.codes.map(code => code.id) ?? [])
  const [createdCodes, setCreatedCodes] = useState<Array<CodeOption & { principalId: number }>>([])
  const [restoreUserId, setRestoreUserId] = useState<number | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  /** Every principal the caller reaches (all of them for the Developer). */
  const selectablePrincipals = options.principals
  /** The SuperAdmin never chooses (its own principal); only the Developer moves an existing user to another one. */
  const principalFixed = isSuperAdmin || (isEdit && !isDeveloper)
  const principal = isSuperAdmin
    ? (options.principals[0] ?? null)
    : isEdit && !isDeveloper
      ? (options.principals.find(p => p.id === user.principal.id) ?? null)
      : (selectablePrincipals.find(p => p.id === principalId) ?? null)
  /** The Developer moved an existing user to another principal. */
  const movedFrom = isEdit && principal !== null && principal.id !== user.principal.id ? user.principal : null

  /** Only the Owner (in its zones) and the Developer create a principal, with its first SuperAdmin. */
  const canCreatePrincipal = !isEdit && (isOwner || isDeveloper) && role === ROLES.superAdmin
  const usingNewPrincipal = canCreatePrincipal && principalMode === 'new'

  const codeOptions = principalCodes(principal, createdCodes).filter(code => code.isActive || codeIds.includes(code.id))
  const selectedCodes = codeOptions.filter(code => codeIds.includes(code.id))

  const setRole = (next: NetworkUserRole) => {
    setRoleState(next)
    if (next === ROLES.admin) setPrincipalMode('existing')
  }

  const setPrincipalId = (id: number) => {
    setPrincipalIdState(id)
    // Codes belong to one principal.
    if (id !== principalId) setCodeIds([])
  }

  const toggleCode = (id: number) =>
    setCodeIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))

  /** "+ Crear código": the single code endpoint, and the new code stays checked. Resolves to an error or null. */
  const createCode = async (code: string, holderName: string): Promise<string | null> => {
    if (!principal) return 'Elegí primero el principal.'
    try {
      const created = await codeActions.createCode.mutateAsync({
        principalId: principal.id,
        data: { code: code.trim(), ...(holderName.trim() ? { holderName: holderName.trim() } : {}) },
      })
      setCreatedCodes(prev => [...prev.filter(c => c.id !== created.id), { ...created, principalId: principal.id }])
      setCodeIds(prev => (prev.includes(created.id) ? prev : [...prev, created.id]))
      return null
    } catch (error) {
      return apiErrorMessage(error, 'No se pudo crear el código.')
    }
  }

  // ── what will happen ────────────────────────────────────

  const newPrincipalCodes = [draft.masterCode, ...draft.codes.map(row => row.code)]
    .map(code => code.trim())
    .filter((code, index, all) => code && all.indexOf(code) === index)
  const seenCodes =
    role === ROLES.admin
      ? selectedCodes.map(code => code.code)
      : usingNewPrincipal
        ? newPrincipalCodes
        : (principal?.codes ?? []).filter(code => code.isActive).map(code => code.code)
  const principalName = usingNewPrincipal ? draft.name.trim() : (principal?.name ?? '')
  const who = name.trim() || email.trim() || 'El usuario'
  const summary =
    principalName && (role === ROLES.superAdmin || seenCodes.length > 0)
      ? accessSummary({ who, role, principalName, codes: seenCodes, newPrincipal: usingNewPrincipal })
      : null

  // The Developer's "Datos" block already says every account of its is invited by mail: said once, there.
  const credentialsNote = isEdit
    ? password
      ? 'Va a entrar con la contraseña nueva: sus sesiones abiertas se cierran.'
      : null
    : isDeveloper
      ? null
      : password
        ? 'Va a entrar con la contraseña que le pases.'
        : `Le llega un correo${email.trim() ? ` a ${email.trim()}` : ''} con un enlace para elegir su contraseña (vence en 72 horas).`
  const moveNote = movedFrom
    ? `Pasa de ${movedFrom.name} a ${principal?.name}: deja de ver lo de ${movedFrom.name} y pierde los códigos que tenía ahí.`
    : null

  const problems: string[] = []
  if (!(isEdit && isDeveloper) && !email.trim()) problems.push('Falta el correo.')
  if (password && password.length < MIN_PASSWORD_LENGTH) {
    problems.push(`La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  }
  if (usingNewPrincipal) {
    if (isOwner && draft.zoneId === null) problems.push('Elegí la zona del principal nuevo.')
    if (draft.name.trim().length < 2) problems.push('Falta el nombre del principal nuevo.')
    if (!isValidCode(draft.masterCode)) problems.push('Falta el código master del principal nuevo.')
    if (draft.codes.some(row => row.code.trim() && !isValidCode(row.code))) {
      problems.push('Revisá los códigos: solo letras, números, "/" y "-".')
    }
  } else if (!principal) {
    problems.push(role === ROLES.admin ? 'Elegí de qué principal depende.' : 'Elegí el principal.')
  }
  if (role === ROLES.admin && codeIds.length === 0) problems.push('Marcá al menos un código que vea.')

  // ── saving ──────────────────────────────────────────────

  const codesBody = role === ROLES.admin ? { producerCodeIds: codeIds } : {}

  const newPrincipalBody = (): NewPrincipalInput => ({
    zoneId: draft.zoneId,
    name: draft.name.trim(),
    masterCode: draft.masterCode.trim(),
    codes: draft.codes
      .filter(row => row.code.trim())
      .map(row => ({ code: row.code.trim(), ...(row.holderName.trim() ? { holderName: row.holderName.trim() } : {}) })),
  })

  /** What the platform does to an account is mailed to the principal concerned (decision of 17/11). */
  const platformNotice = isDeveloper
    ? 'Los SuperAdmin y los Owners del principal reciben un aviso de que el equipo de Polisend tocó la cuenta.'
    : undefined

  const create = () => {
    const body: CreateNetworkUserRequest = {
      email: email.trim(),
      role,
      ...(name.trim() ? { name: name.trim() } : {}),
      // The platform never chooses a password: its accounts are always invited.
      ...(!isDeveloper && password ? { password } : {}),
      ...(usingNewPrincipal ? { newPrincipal: newPrincipalBody() } : { producerId: principal?.id }),
      ...codesBody,
    }
    actions.createUser.mutate(body, {
      onSuccess: created =>
        onSaved({
          title: usingNewPrincipal ? `Principal ${draft.name.trim()} creado con su SuperAdmin` : 'Usuario creado',
          description: created.invitationSent
            ? `Le mandamos a ${created.email} un enlace para elegir su contraseña.`
            : undefined,
        }),
      onError: error => {
        const restorable = restorableUserIdOf(error)
        if (restorable === null) {
          setErrorMessage(apiErrorMessage(error, 'No se pudo crear el usuario. Probá de nuevo.'))
        } else if (usingNewPrincipal) {
          // A restore brings the account back in its old principal, never in a new one.
          setErrorMessage(
            'Ese correo es de un usuario eliminado. Usá otro correo para el principal nuevo, o restaurá ese usuario eligiendo un principal existente.',
          )
        } else {
          setRestoreUserId(restorable)
        }
      },
    })
  }

  const update = (current: NetworkUser) => {
    // Never one's own role. The platform never re-addresses an account nor sets a password (it sends a link instead),
    // and is the only one that moves an account to another principal.
    const access = {
      ...(isSelf ? {} : { role }),
      ...(movedFrom && principal ? { producerId: principal.id } : {}),
      ...codesBody,
    }
    const data: UpdateNetworkUserRequest = isDeveloper
      ? { name: name.trim(), ...access }
      : { name: name.trim(), email: email.trim(), ...(password ? { password } : {}), ...access }
    actions.updateUser.mutate(
      { id: current.id, data },
      {
        onSuccess: () =>
          onSaved({
            title: 'Usuario actualizado',
            description: password
              ? 'Sus sesiones abiertas se cerraron: entra con la contraseña nueva.'
              : movedFrom
                ? `Ahora es de ${principal?.name}.`
                : undefined,
          }),
        onError: error => setErrorMessage(apiErrorMessage(error, 'No se pudo guardar. Probá de nuevo.')),
      },
    )
  }

  const submit = () => {
    setErrorMessage(null)
    if (problems.length > 0) {
      setErrorMessage(problems[0])
      return
    }
    if (user) update(user)
    else create()
  }

  /**
   * Brings back the deleted user the 409 offered, with the role and codes chosen now, in the principal the form shows
   * or not at all. The API restores an account in the principal it was deleted from, and its 409 does not say which,
   * so the API is made to check it: an Admin's codes must be of that principal (else a 400, and nothing changes). A
   * SuperAdmin has no codes to check: the Owner and the Developer, who reach several principals, restore it as an Admin
   * with one code of the form's principal and then make it SuperAdmin, so it never comes back as SuperAdmin of a
   * principal nobody chose. A SuperAdmin caller reaches only its own principal, where its deleted users were. Without a
   * password typed (always, for the Developer) the API mails the account a link to choose its own.
   */
  const restore = async () => {
    if (restoreUserId === null || !principal || restoring) return
    const id = restoreUserId
    const target = principal
    const chosen = isDeveloper ? '' : password
    const base = { ...(chosen ? { password: chosen } : {}), ...(name.trim() ? { name: name.trim() } : {}) }
    const anchor = target.codes.find(code => code.isMaster) ?? target.codes[0]
    const viaAdmin = role === ROLES.superAdmin && !isSuperAdmin

    setRestoring(true)
    setErrorMessage(null)
    try {
      let restored: RestoreNetworkUserResponse
      try {
        restored = await actions.restoreUser.mutateAsync({
          id,
          data: viaAdmin
            ? { ...base, role: ROLES.admin, producerCodeIds: anchor ? [anchor.id] : [] }
            : { ...base, role, ...codesBody },
        })
      } catch (error) {
        setRestoreUserId(null)
        setErrorMessage(
          isCodesOfAnotherPrincipal(error)
            ? `Ese usuario eliminado era de otro principal, no de ${target.name}: no lo restauramos. Elegí el principal donde estaba, o usá otro correo.`
            : apiErrorMessage(error, 'No se pudo restaurar el usuario.'),
        )
        return
      }
      if (viaAdmin) {
        try {
          const promoted = await actions.updateUser.mutateAsync({ id, data: { role: ROLES.superAdmin } })
          restored = { ...promoted, invitationSent: restored.invitationSent }
        } catch (error) {
          setRestoreUserId(null)
          setErrorMessage(
            `Volvió como Admin de ${target.name}, con el código ${anchor?.code ?? ''}, pero no pudimos hacerlo SuperAdmin (${apiErrorMessage(error, 'error de conexión')}). Editalo desde la lista para cambiarle el rol.`,
          )
          return
        }
      }
      const where = `Vuelve como ${roleLabel(role)} de ${restored.principal.name}`
      onSaved({
        title: 'Usuario restaurado',
        description: chosen
          ? `${where}, con la contraseña que elegiste.`
          : `${where}. Le mandamos a ${restored.email} un enlace para elegir su contraseña.`,
      })
    } finally {
      setRestoring(false)
    }
  }

  return {
    isEdit,
    isSelf,
    isDeveloper,
    isOwner,
    isSuperAdmin,
    optionsLoading: options.isLoading,
    optionsError: options.isError,
    zones: options.zones,
    allPrincipals: options.principals,
    selectablePrincipals,
    principalFixed,
    principal,
    canCreatePrincipal,
    usingNewPrincipal,
    fields: { name, email, password, role, principalMode, principalId, draft },
    setName,
    setEmail,
    setPassword,
    setRole,
    setPrincipalMode,
    setPrincipalId,
    setDraft,
    codeOptions,
    codeIds,
    toggleCode,
    createCode,
    creatingCode: codeActions.createCode.isPending,
    summary,
    credentialsNote,
    moveNote,
    movedFrom,
    platformNotice,
    newPrincipalCodes,
    problems,
    errorMessage,
    submit,
    saving: actions.createUser.isPending || actions.updateUser.isPending,
    restoreUserId,
    /** Where the restore lands: the form's principal, or nowhere (see `restore`). */
    restorePrincipalName: principal?.name ?? '',
    /** A SuperAdmin restores only in its own principal; the others may have picked one the account was not in. */
    restoreMayMiss: !isSuperAdmin,
    cancelRestore: () => setRestoreUserId(null),
    restore: () => void restore(),
    restoring,
  }
}

export type NetworkUserFormState = ReturnType<typeof useNetworkUserForm>
