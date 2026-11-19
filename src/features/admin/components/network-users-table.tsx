'use client'

import { Fragment } from 'react'

import { Ellipsis, Lock, Send, ShieldOff, SquarePen, Trash2, UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { NetworkUser, ReadOnlyNetworkUser } from '@/types/api/hierarchy'
import { formatJoinDate, shownRole, type UserHeading } from '../lib/network-users'
import { ROLES, roleLabel } from '../lib/roles'
import { TwoFactorBadge } from './account-access-dialog'

const HEAD = 'text-[11px] uppercase tracking-[0.12em] text-muted-foreground'
const SHOWN_CODES = 3

interface NetworkUsersTableProps {
  users: NetworkUser[] | undefined
  isLoading: boolean
  isError: boolean
  /** The signed-in account: "Vos", and no delete or 2FA reset on it. */
  selfId: number | null
  /** An Owner's read-only rows (Lumarsoft, the other Owners of its zones): after the others, with no actions. */
  readOnlyUsers?: ReadOnlyNetworkUser[]
  /** Principal and Zona columns: hidden for a SuperAdmin (every row is of its principal). */
  showPrincipal: boolean
  /** The heading a row goes under: its principal, or the groups of a zone's productores. */
  headingOf?: (user: NetworkUser) => UserHeading
  emptyText: string
  onEdit: (user: NetworkUser) => void
  onSendPasswordLink: (user: NetworkUser) => void
  onResetTwoFactor: (user: NetworkUser) => void
  onDelete: (user: NetworkUser) => void
}

function CodesCell({ user }: { user: NetworkUser }) {
  if (user.groups?.length) {
    return <span className="text-[12.5px] text-ink-3">Los de sus principales</span>
  }
  if (user.role === ROLES.superAdmin) {
    return <span className="text-[12.5px] text-ink-3">Todos los del principal</span>
  }
  if (user.codes.length === 0) return <span className="text-[12.5px] text-destructive">Sin códigos</span>
  const extra = user.codes.length - SHOWN_CODES
  return (
    <div className="flex flex-wrap gap-1">
      {user.codes.slice(0, SHOWN_CODES).map(code => (
        <span
          key={code.id}
          title={code.holderName ?? undefined}
          className="rounded-md border border-line-2 bg-secondary/60 px-1.5 py-0.5 text-[11.5px] font-medium text-ink-3"
        >
          {code.code}
        </span>
      ))}
      {extra > 0 && (
        <span
          title={user.codes
            .slice(SHOWN_CODES)
            .map(code => code.code)
            .join(', ')}
          className="px-1 py-0.5 text-[11.5px] text-muted-foreground"
        >
          +{extra}
        </span>
      )}
    </div>
  )
}

function UserCell({ user, isSelf = false }: { user: NetworkUser | ReadOnlyNetworkUser; isSelf?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback
          className={
            user.readOnly
              ? 'bg-secondary text-[12px] font-semibold text-muted-foreground'
              : 'bg-ember-soft text-[12px] font-semibold text-ember-2'
          }
        >
          {(user.name || user.email).slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[14px] font-medium text-ink">{user.name || user.email}</span>
          {isSelf && (
            <Badge variant="secondary" className="bg-ember-soft text-ember-2">
              Vos
            </Badge>
          )}
          {typeof user.twoFactorEnabled === 'boolean' && <TwoFactorBadge enabled={user.twoFactorEnabled} />}
        </div>
        {user.name && <div className="truncate text-[12px] text-muted-foreground">{user.email}</div>}
      </div>
    </div>
  )
}

/**
 * A row nobody may edit: the API's `label` as its role ("Lumarsoft · Developer", "Owner · <shared zones>"), "—" where a
 * managed account has a principal, a zone or codes, and no menu.
 */
function ReadOnlyRow({ user }: { user: ReadOnlyNetworkUser }) {
  const none = <span className="text-[13px] text-muted-foreground">—</span>
  return (
    <TableRow className="bg-secondary/25 hover:bg-secondary/25">
      <TableCell className="py-3 pl-5">
        <UserCell user={user} />
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="h-auto max-w-[240px] whitespace-normal rounded-md border-line-2 text-left font-normal text-ink-3"
        >
          {user.label || roleLabel(user.role)}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">{none}</TableCell>
      <TableCell className="hidden text-[13px] text-muted-foreground sm:table-cell">
        {user.createdAt ? formatJoinDate(user.createdAt) : '—'}
      </TableCell>
      <TableCell className="pr-5">
        <div className="flex justify-end" title="Solo lectura: nadie puede editar esta cuenta desde Usuarios">
          <Lock className="size-4 text-faint" />
          <span className="sr-only">Solo lectura</span>
        </div>
      </TableCell>
    </TableRow>
  )
}

function LoadingRows({ columns }: { columns: number }) {
  return Array.from({ length: 3 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell className="pl-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </TableCell>
      {Array.from({ length: columns - 1 }).map((__, j) => (
        <TableCell key={j}>
          <Skeleton className="h-4 w-20" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

/**
 * The SuperAdmins and Admins of every principal the caller reaches (plan §6.3); for an Owner, then, the read-only rows
 * of Lumarsoft and of the other Owners of its zones.
 */
export function NetworkUsersTable({
  users,
  isLoading,
  isError,
  selfId,
  readOnlyUsers = [],
  showPrincipal,
  headingOf = user => ({ key: `p${user.principal.id}`, name: user.principal.name }),
  emptyText,
  onEdit,
  onSendPasswordLink,
  onResetTwoFactor,
  onDelete,
}: NetworkUsersTableProps) {
  // Across principals the rows come grouped by principal (users-view sorts them): a heading per principal instead of
  // a Principal and a Zona column on every row.
  const columns = 5

  return (
    <Card className="overflow-hidden border-line-2 py-0 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={`h-11 pl-5 ${HEAD}`}>Usuario</TableHead>
              <TableHead className={HEAD}>Rol</TableHead>
              <TableHead className={`hidden md:table-cell ${HEAD}`}>Códigos</TableHead>
              <TableHead className={`hidden sm:table-cell ${HEAD}`}>Alta</TableHead>
              <TableHead className="w-12 pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !users && <LoadingRows columns={columns} />}

            {isError && !users && (
              <TableRow>
                <TableCell colSpan={columns} className="py-14 text-center text-[14px] text-destructive">
                  No se pudieron cargar los usuarios.
                </TableCell>
              </TableRow>
            )}

            {users && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <UserPlus className="size-5" />
                    </div>
                    <p className="text-[14px] text-muted-foreground">{emptyText}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {users?.map((user, index) => {
              const isSelf = user.id === selfId
              const heading = headingOf(user)
              const previous = users[index - 1]
              const firstOfPrincipal = showPrincipal && (!previous || headingOf(previous).key !== heading.key)
              const ofPrincipal = firstOfPrincipal ? users.filter(u => headingOf(u).key === heading.key).length : 0
              return (
                <Fragment key={user.id}>
                  {firstOfPrincipal && (
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={columns} className="py-2 pl-5">
                        <span className="text-[13px] font-semibold text-ink">{heading.name}</span>
                        <span className="ml-2 text-[12px] text-muted-foreground">
                          {user.zone?.name ?? 'Sin zona'} ·{' '}
                          {ofPrincipal === 1 ? '1 usuario' : `${ofPrincipal} usuarios`}
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="py-3 pl-5">
                      <UserCell user={user} isSelf={isSelf} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-ink-3">
                        {roleLabel(shownRole(user))}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <CodesCell user={user} />
                    </TableCell>
                    <TableCell className="hidden text-[13px] text-muted-foreground sm:table-cell">
                      {formatJoinDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                              <Ellipsis className="size-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-72">
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                              <SquarePen />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSendPasswordLink(user)}>
                              <Send />
                              Mandar enlace para elegir contraseña
                            </DropdownMenuItem>
                            {user.twoFactorEnabled && !isSelf && (
                              <DropdownMenuItem onClick={() => onResetTwoFactor(user)}>
                                <ShieldOff />
                                Reiniciar verificación en dos pasos
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" disabled={isSelf} onClick={() => onDelete(user)}>
                              <Trash2 />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                </Fragment>
              )
            })}

            {users && readOnlyUsers.length > 0 && (
              <>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns} className="pb-1.5 pl-5 pt-4">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-faint">Solo lectura</span>
                  </TableCell>
                </TableRow>
                {readOnlyUsers.map(user => (
                  <ReadOnlyRow key={`read-only-${user.id}`} user={user} />
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
