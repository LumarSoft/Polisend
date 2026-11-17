'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Network, Plus, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { HierarchyPrincipal, NetworkUser, NetworkUserRole, NetworkUsersQuery } from '@/types/api/hierarchy'
import type { AccountAccessAction } from '../hooks/use-account-access'
import { useGuidedOnboarding, type GuidedPrincipal } from '../hooks/use-guided-onboarding'
import { useHierarchyPrincipals, useNetworkTree, useNetworkUsers } from '../hooks/use-hierarchy'
import { setUrlParams, useLinkedId, useUrlTab } from '../hooks/use-panel-link'
import { useProfile } from '../hooks/use-profile'
import { useRole } from '../hooks/use-role'
import { NO_ZONE, zoneKeyOf } from '../lib/network'
import { USERS_NEW_PARAM, USERS_NEW_SUPERADMIN, USERS_PRINCIPAL_PARAM } from '../lib/network-links'
import { isManagedUser, isReadOnlyUser, matchesSearch } from '../lib/network-users'
import { ROLES, roleLabel } from '../lib/roles'
import { AccountAccessDialog } from './account-access-dialog'
import { BranchOnboardingDialog } from './branch-onboarding-dialog'
import { EMPTY_NETWORK_FILTER, NetworkFilter, type NetworkListFilterValue } from './network-filter'
import { NetworkUsersTable } from './network-users-table'
import { PrincipalCodesBlock } from './principal-codes-block'
import { DeleteUserDialog } from './user-account-dialogs'
import { UserFormDialog } from './user-form-dialog'

const ALL = 'all'
const TABS = ['usuarios', 'productores'] as const

const ROLE_OPTIONS: ComboboxOption[] = [
  { value: ALL, label: 'Todos los roles' },
  { value: ROLES.superAdmin, label: roleLabel(ROLES.superAdmin) },
  { value: ROLES.admin, label: roleLabel(ROLES.admin) },
]

/** An Admin manages nobody: the API refuses /hierarchy/users to it. */
function Restricted() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-16 text-center md:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <h1 className="font-display text-[22px] text-ink">Acceso restringido</h1>
        <p className="text-[14px] text-muted-foreground">
          Los usuarios y sus códigos los gestionan el SuperAdmin de tu principal o su Owner.
        </p>
      </div>
    </div>
  )
}

/** The Owner picks where "Alta guiada de productor" works when no principal is filtered. */
function GuidedPrincipalPicker({
  open,
  onOpenChange,
  principals,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  principals: HierarchyPrincipal[]
  onPick: (principal: GuidedPrincipal) => void
}) {
  const [chosen, setChosen] = useState<number | null>(null)
  const principal = principals.find(p => p.id === chosen) ?? null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px]">Alta guiada de productor</DialogTitle>
          <DialogDescription>
            ¿En qué principal? Pasa a ser tu principal activo, porque el alta conecta su número de WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <Combobox
          label="Principal"
          placeholder="Elegí un principal"
          searchPlaceholder="Buscar principal…"
          value={chosen === null ? null : String(chosen)}
          options={principals.map(p => ({ value: String(p.id), label: p.name, hint: p.zoneName ?? undefined }))}
          onChange={raw => setChosen(Number(raw))}
          className="w-full"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!principal}
            onClick={() => {
              if (!principal) return
              onOpenChange(false)
              onPick({ id: principal.id, name: principal.name })
            }}
          >
            Empezar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Client-side narrowing the API does not do: "Mi principal"/"Sin zona", and who sees one productor. */
function narrowUsers(
  users: NetworkUser[] | undefined,
  filter: NetworkListFilterValue,
  principals: HierarchyPrincipal[],
): NetworkUser[] | undefined {
  if (!users) return users
  let rows = users
  if (filter.zoneKey === NO_ZONE && filter.principalId === null) {
    const ids = new Set(principals.filter(p => zoneKeyOf(p) === NO_ZONE).map(p => p.id))
    rows = rows.filter(user => ids.has(user.principal.id))
  }
  const codeId = filter.producerCodeId
  if (codeId !== null) {
    rows = rows.filter(user => user.role === ROLES.superAdmin || user.codes.some(code => code.id === codeId))
  }
  return rows
}

function UsersScreen() {
  const { isDeveloper, isOwner, isSuperAdmin } = useRole()
  const { data: profile } = useProfile()
  const guided = useGuidedOnboarding()
  const [tab, setTab] = useUrlTab(TABS, 'usuarios')

  const [filter, setFilter] = useState<NetworkListFilterValue>(EMPTY_NETWORK_FILTER)
  const [role, setRole] = useState<NetworkUserRole | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput.trim(), 300)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<NetworkUser | null>(null)
  /** The role "Nuevo usuario" starts with when a link asked for one (`&nuevo=superadmin`). */
  const [linkedRole, setLinkedRole] = useState<NetworkUserRole | undefined>(undefined)
  const params = useSearchParams()
  // `?principal=<id>` (Mi red's "Ver usuarios", an organization's detail) preselects the principal; with
  // `&nuevo=superadmin` (Mi red's «Sin SuperAdmin · crear uno») it also opens "Nuevo usuario" as its SuperAdmin.
  const clearPrincipalLink = useLinkedId(USERS_PRINCIPAL_PARAM, id => {
    setFilter({ zoneKey: null, principalId: id, producerCodeId: null })
    if (params.get(USERS_NEW_PARAM) === USERS_NEW_SUPERADMIN) {
      setEditing(null)
      setLinkedRole(ROLES.superAdmin)
      setFormOpen(true)
    }
  })
  const changeFilter = (next: NetworkListFilterValue) => {
    setFilter(next)
    clearPrincipalLink()
  }

  const { data: principals = [] } = useHierarchyPrincipals()
  const query: NetworkUsersQuery = {
    ...(typeof filter.zoneKey === 'number' && filter.principalId === null ? { zoneId: filter.zoneKey } : {}),
    ...(filter.principalId !== null ? { producerId: filter.principalId } : {}),
    ...(role ? { role } : {}),
    ...(search ? { q: search } : {}),
  }
  const usersQuery = useNetworkUsers(query)
  const users = narrowUsers(usersQuery.data?.filter(isManagedUser), filter, principals)
  // The SuperAdmin's own principal: its name, its codes (filter and "Productores").
  const tree = useNetworkTree(isSuperAdmin)
  const ownPrincipal = isSuperAdmin ? (principals.find(p => p.isHome) ?? principals[0] ?? null) : null

  const [deleteTarget, setDeleteTarget] = useState<NetworkUser | null>(null)
  const [access, setAccess] = useState<{ action: AccountAccessAction; user: NetworkUser } | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const filtered = filter.zoneKey !== null || filter.principalId !== null || filter.producerCodeId !== null
  const emptyText = filtered || role || search ? 'Ningún usuario coincide con los filtros.' : 'Todavía no hay usuarios.'
  // An Owner's read-only rows (Lumarsoft, the other Owners of its zones) have no principal, zone, codes or managed
  // role: they show only with no filter but the search.
  const readOnlyUsers =
    isOwner && !filtered && !role
      ? (usersQuery.data ?? []).filter(isReadOnlyUser).filter(user => matchesSearch(user, search))
      : []

  const openCreate = () => {
    setEditing(null)
    setLinkedRole(undefined)
    setFormOpen(true)
  }

  const changeFormOpen = (open: boolean) => {
    setFormOpen(open)
    if (!open && linkedRole) {
      setLinkedRole(undefined)
      setUrlParams({ [USERS_NEW_PARAM]: null })
    }
  }

  const startGuided = () => {
    if (ownPrincipal) {
      guided.start({ id: ownPrincipal.id, name: ownPrincipal.name })
      return
    }
    const filteredPrincipal = principals.find(p => p.id === filter.principalId)
    if (filteredPrincipal) guided.start({ id: filteredPrincipal.id, name: filteredPrincipal.name })
    else setPickerOpen(true)
  }

  const subtitle = isDeveloper
    ? 'Los SuperAdmin y Admin de todos los principales. Polisend los invita por correo y nunca elige ni ve sus contraseñas; cada cambio le llega como aviso a su principal.'
    : isOwner
      ? 'Los SuperAdmin y Admin de los principales de tu red. Al final, de solo lectura, las cuentas de Lumarsoft y de los otros Owner de tus zonas.'
      : `Los SuperAdmin y Admin de ${ownPrincipal?.name ?? 'tu principal'}.`

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.3em] text-ember-2">
            {isSuperAdmin ? 'Gestión' : 'Red'}
          </div>
          <h1 className="mt-2 font-display text-[clamp(26px,3.5vw,36px)] tracking-[-0.035em] text-ink">Usuarios</h1>
          <p className="mt-1.5 max-w-2xl text-[14px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDeveloper && (
            <Button asChild variant="outline" className="h-10 border-line-2">
              <Link href="/admin/owners">
                <Network className="size-4" />
                Owners y zonas
              </Link>
            </Button>
          )}
          {(isOwner || isSuperAdmin) && (
            <Button variant="outline" className="h-10 border-line-2" onClick={startGuided}>
              <Sparkles className="size-4" />
              Alta guiada de productor
            </Button>
          )}
          <Button onClick={openCreate} className="h-10">
            <Plus className="size-4" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      {isSuperAdmin && (
        <Tabs value={tab} onValueChange={value => setTab(value as (typeof TABS)[number])} className="mb-5">
          <TabsList>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="productores">Productores</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {isSuperAdmin && tab === 'productores' ? (
        <div className="flex flex-col gap-4">
          <p className="max-w-xl text-[13.5px] text-muted-foreground">
            Los códigos de Triunfo de {ownPrincipal?.name ?? 'tu principal'}. Los SuperAdmin ven todos; cada Admin ve
            los que le marques en Usuarios.
          </p>
          {tree.data?.home ? (
            <PrincipalCodesBlock principalId={tree.data.home.id} codes={tree.data.home.codes} />
          ) : tree.isLoading ? (
            <Skeleton className="h-40 w-full rounded-lg" />
          ) : (
            <p className="text-[13px] text-muted-foreground">No se pudieron cargar los códigos.</p>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {isSuperAdmin ? (
              <Combobox
                label="Productor"
                placeholder="Todos los productores"
                value={filter.producerCodeId === null ? ALL : String(filter.producerCodeId)}
                options={[
                  { value: ALL, label: 'Todos los productores' },
                  ...(ownPrincipal?.codes ?? []).map(code => ({
                    value: String(code.id),
                    label: code.code,
                    hint: code.holderName ?? undefined,
                  })),
                ]}
                onChange={raw => changeFilter({ ...filter, producerCodeId: raw === ALL ? null : Number(raw) })}
                className="w-64"
              />
            ) : (
              <NetworkFilter mode="network" value={filter} onChange={changeFilter} />
            )}
            <Combobox
              label="Rol"
              placeholder="Todos los roles"
              value={role ?? ALL}
              options={ROLE_OPTIONS}
              onChange={raw => setRole(raw === ALL ? null : (raw as NetworkUserRole))}
              className="w-44"
            />
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nombre o correo…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="h-10 border-line-2 pl-9 text-[13px]"
              />
            </div>
          </div>

          <NetworkUsersTable
            users={users}
            isLoading={usersQuery.isLoading}
            isError={usersQuery.isError}
            selfId={profile?.id ?? null}
            readOnlyUsers={readOnlyUsers}
            showPrincipal={!isSuperAdmin}
            emptyText={emptyText}
            onEdit={user => {
              setEditing(user)
              setFormOpen(true)
            }}
            onSendPasswordLink={user => setAccess({ action: 'password-setup', user })}
            onResetTwoFactor={user => setAccess({ action: 'reset-two-factor', user })}
            onDelete={setDeleteTarget}
          />
        </>
      )}

      <UserFormDialog
        user={editing}
        open={formOpen}
        onOpenChange={changeFormOpen}
        defaultPrincipalId={filter.principalId}
        defaultRole={linkedRole}
        onEditCodes={isSuperAdmin ? () => setTab('productores') : undefined}
      />
      <DeleteUserDialog user={deleteTarget} onClose={() => setDeleteTarget(null)} />
      <AccountAccessDialog
        scope="network"
        action={access?.action ?? 'password-setup'}
        account={access?.user ?? null}
        onClose={() => setAccess(null)}
      />
      {isOwner && (
        <GuidedPrincipalPicker
          key={pickerOpen ? 'open' : 'closed'}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          principals={principals}
          onPick={guided.start}
        />
      )}
      <BranchOnboardingDialog
        principal={guided.target}
        open={guided.open}
        onOpenChange={open => !open && guided.close()}
      />
    </div>
  )
}

/**
 * Usuarios (plan §6.3): one screen for the Developer, the Owner and the SuperAdmin against `/hierarchy/users`, with
 * every principal the caller reaches (not only the active one). Owners are never listed or created here.
 */
export function UsersView() {
  const { isDeveloper, isOwner, isSuperAdmin, isLoading } = useRole()
  if (isLoading) return null
  if (!isDeveloper && !isOwner && !isSuperAdmin) return <Restricted />
  return <UsersScreen />
}
