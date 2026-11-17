import { useState } from 'react'
import type {
  CreateNetworkUserRequest,
  NetworkUser,
  NetworkUserRole,
  NewPrincipalInput,
  UpdateNetworkUserRequest,
} from '@/types/api/hierarchy'
import { apiErrorMessage, restorableUserIdOf } from '../lib/api-error-message'
import { accessSummary, generatePassword, MIN_PASSWORD_LENGTH, type FormPrincipal } from '../lib/network-users'
import { isValidCode } from '../lib/producer-code'
import { ROLES } from '../lib/roles'
import { useNetworkUserActions, usePrincipalCodeActions } from './use-hierarchy'
import { useProfile } from './use-profile'
import { useRole } from './use-role'
import { useUserFormOptions } from './use-user-form-options'

/**
 * The one user form of plan §6.3 (create and edit, for the Developer, the Owner and the SuperAdmin): its state, what it
 * may offer each role, the summary before saving and the calls to `/hierarchy/users`. The component only renders.
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  /** Where a new account may go: the SuperAdmin's own principal; for the Developer, only principals with nobody. */
  const selectablePrincipals = isDeveloper ? options.principals.filter(options.platformMayAddTo) : options.principals
  /** The SuperAdmin never chooses (its own principal); nobody changes an existing user's principal. */
  const principalFixed = isEdit || isSuperAdmin
  const principal = isEdit
    ? (options.principals.find(p => p.id === user.principal.id) ?? null)
    : isSuperAdmin
      ? (options.principals[0] ?? null)
      : (selectablePrincipals.find(p => p.id === principalId) ?? null)

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

  const invitation = `Le llega un correo${email.trim() ? ` a ${email.trim()}` : ''} con un enlace para elegir su contraseña (vence en 72 horas).`
  const credentialsNote = isEdit
    ? password
      ? 'Va a entrar con la contraseña nueva: sus sesiones abiertas se cierran.'
      : null
    : isDeveloper || !password
      ? invitation
      : 'Va a entrar con la contraseña que le pases.'

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
        } else if (usingNewPrincipal || isDeveloper) {
          // A restore brings the account back in its old principal, never in a new one; the platform never restores.
          setErrorMessage(
            isDeveloper
              ? 'Ese correo es de un usuario eliminado. La plataforma no restaura cuentas: lo restaura el SuperAdmin o el Owner de su principal.'
              : 'Ese correo es de un usuario eliminado. Usá otro correo para el principal nuevo, o restaurá ese usuario eligiendo un principal existente.',
          )
        } else {
          setRestoreUserId(restorable)
        }
      },
    })
  }

  const update = (current: NetworkUser) => {
    // Never one's own role; the platform never renames, re-addresses or sets a password (it sends a link instead).
    const access = { ...(isSelf ? {} : { role }), ...codesBody }
    const data: UpdateNetworkUserRequest = isDeveloper
      ? access
      : { name: name.trim(), email: email.trim(), ...(password ? { password } : {}), ...access }
    actions.updateUser.mutate(
      { id: current.id, data },
      {
        onSuccess: () =>
          onSaved({
            title: 'Usuario actualizado',
            description: password ? 'Sus sesiones abiertas se cerraron: entra con la contraseña nueva.' : undefined,
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
   * Brings back the deleted user the 409 offered, with the role and codes chosen now. Without a password typed, it is
   * restored with one nobody knows and gets a link to choose its own (as a new account would be invited).
   */
  const restore = () => {
    if (restoreUserId === null) return
    const chosen = password
    actions.restoreUser.mutate(
      {
        id: restoreUserId,
        data: {
          password: chosen || generatePassword(24),
          role,
          ...(name.trim() ? { name: name.trim() } : {}),
          ...codesBody,
        },
      },
      {
        onSuccess: restored => {
          const where = `Vuelve en ${restored.principal.name}`
          if (chosen) {
            onSaved({ title: 'Usuario restaurado', description: `${where}, con la contraseña que elegiste.` })
            return
          }
          actions.sendPasswordSetup.mutate(restored.id, {
            onSuccess: () =>
              onSaved({
                title: 'Usuario restaurado',
                description: `${where}. Le mandamos a ${restored.email} un enlace para elegir su contraseña.`,
              }),
            onError: () =>
              onSaved({
                title: 'Usuario restaurado',
                description: `${where}, pero no se pudo mandar el enlace: mandáselo desde la lista.`,
              }),
          })
        },
        onError: error => {
          setRestoreUserId(null)
          setErrorMessage(apiErrorMessage(error, 'No se pudo restaurar el usuario.'))
        },
      },
    )
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
    newPrincipalCodes,
    problems,
    errorMessage,
    submit,
    saving: actions.createUser.isPending || actions.updateUser.isPending,
    restoreUserId,
    cancelRestore: () => setRestoreUserId(null),
    restore,
    restoring: actions.restoreUser.isPending || actions.sendPasswordSetup.isPending,
  }
}

export type NetworkUserFormState = ReturnType<typeof useNetworkUserForm>
