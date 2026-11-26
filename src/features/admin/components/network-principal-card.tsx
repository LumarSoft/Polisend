'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronRight,
  LogIn,
  MessageSquare,
  Phone,
  PlugZap,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { NetworkTreeGroup, NetworkTreePrincipal } from '@/types/api/hierarchy'
import { useShowHiddenCodes, visibleCodes } from '../hooks/use-hidden-codes'
import { networkUsersHref } from '../lib/network-links'
import { PrincipalCodesBlock } from './principal-codes-block'

const int = (n: number) => n.toLocaleString('es-AR')
const day = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' })

function plural(n: number, one: string, many: string): string {
  return `${int(n)} ${n === 1 ? one : many}`
}

function Stat({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-[12.5px] text-ink-3 [&_svg]:size-3.5 [&_svg]:text-muted-foreground">
      {icon}
      {children}
    </span>
  )
}

interface NetworkPrincipalCardProps {
  principal: NetworkTreePrincipal
  /** The Productor filter: open the codes on that one only. */
  onlyCodeId: number | null
  /** It is the principal the Owner is working on now. */
  isActing: boolean
  /** False while the filter's list does not have it yet (just created). */
  canEnter: boolean
  onEnter: () => void
}

/** One principal of "Mi red": its counters (no amounts), its productores, and where to go from it. */
export function NetworkPrincipalCard({
  principal,
  onlyCodeId,
  isActing,
  canEnter,
  onEnter,
}: NetworkPrincipalCardProps) {
  const [codesOpen, setCodesOpen] = useState(false)
  const [showHidden] = useShowHiddenCodes()
  const visibleCount = visibleCodes(principal.codes, showHidden).length
  const showCodes = codesOpen || onlyCodeId !== null
  const Chevron = showCodes ? ChevronDown : ChevronRight
  const { users, numbers, triunfo } = principal

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-2 bg-paper p-4" data-help="principal-red">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-ink">{principal.name}</h3>
            {principal.isHome && (
              <Badge variant="secondary" className="text-[10.5px]">
                Tu principal
              </Badge>
            )}
            {isActing && (
              <Badge className="bg-ember-soft text-[10.5px] text-ember-2 hover:bg-ember-soft">Trabajando acá</Badge>
            )}
            {!principal.isActive && (
              <Badge variant="outline" className="border-line-2 text-[10.5px] text-muted-foreground">
                Inactivo
              </Badge>
            )}
          </div>
          <span className="text-[12px] text-muted-foreground">
            {principal.masterCode ? `master ${principal.masterCode} · ` : ''}
            {principal.plan ? `Plan ${principal.plan}` : 'Sin plan asignado'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8" asChild>
            <Link href={networkUsersHref(principal.id)}>
              <Users className="size-3.5" /> Ver usuarios
            </Link>
          </Button>
          <EnterButton name={principal.name} canEnter={canEnter} onEnter={onEnter} />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {users.superAdmins === 0 ? (
          <Link
            href={networkUsersHref(principal.id, { newSuperAdmin: true })}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            <UserPlus className="size-3.5" />
            Sin SuperAdmin · crear uno
            {users.admins > 0 && <span className="font-normal">({plural(users.admins, 'Admin', 'Admin')})</span>}
          </Link>
        ) : (
          <Stat icon={<Users />}>
            {plural(users.superAdmins, 'SuperAdmin', 'SuperAdmin')} · {plural(users.admins, 'Admin', 'Admin')}
          </Stat>
        )}
        <Stat icon={<Phone />}>
          {plural(numbers.total, 'número', 'números')}
          {numbers.failing > 0 && (
            <span className="text-destructive">
              · {numbers.failing === 1 ? '1 con falla' : `${int(numbers.failing)} con falla`}
            </span>
          )}
        </Stat>
        <Stat icon={<ShieldCheck />}>{plural(principal.clients, 'asegurado', 'asegurados')}</Stat>
        <Stat icon={<MessageSquare />}>{plural(principal.messagesThisMonth, 'token', 'tokens')} este mes</Stat>
        <Stat icon={<PlugZap />}>
          {!triunfo.configured ? (
            <span className="text-muted-foreground">Triunfo sin configurar</span>
          ) : triunfo.failingSince ? (
            <span className="text-destructive">Triunfo con falla desde el {day(triunfo.failingSince)}</span>
          ) : (
            'Triunfo conectado'
          )}
        </Stat>
      </div>

      <div className="border-t border-line-2 pt-2">
        <button
          type="button"
          onClick={() => setCodesOpen(!codesOpen)}
          disabled={onlyCodeId !== null}
          aria-expanded={showCodes}
          className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink disabled:cursor-default"
        >
          <Chevron className="size-4 text-muted-foreground" />
          Productores ({visibleCount})
        </button>
        {showCodes && (
          <div className="mt-3">
            <PrincipalCodesBlock
              principalId={principal.id}
              codes={principal.codes}
              groups={principal.groups}
              onlyCodeId={onlyCodeId}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/** Whether anyone uses the platform there as SuperAdmin or Admin: Mi red shows a card only for those. */
export function hasPlatformUsers(users: { superAdmins: number; admins: number } | undefined): boolean {
  return !!users && users.superAdmins + users.admins > 0
}

function EnterButton({ name, canEnter, onEnter }: { name: string; canEnter: boolean; onEnter: () => void }) {
  return (
    <Button
      size="sm"
      className="h-8"
      onClick={onEnter}
      disabled={!canEnter}
      title={canEnter ? `Trabajar en ${name}` : 'Actualizando tu red…'}
    >
      <LogIn className="size-3.5" /> Entrar
    </Button>
  )
}

interface NetworkGroupCardProps {
  /** The principal that holds the zone's productores (`groupsAsPrincipals`). */
  holder: NetworkTreePrincipal
  /** One of its groups, a principal of the zone with users. */
  group: NetworkTreeGroup
  onlyCodeId: number | null
  isActing: boolean
  canEnter: boolean
  onEnter: () => void
}

/**
 * A zone's principal that is a group of the principal holding the zone's productores, when people use the platform
 * there: the same card as a principal's, with what applies to a group (its users, productores and insured clients;
 * the numbers, tokens and Triunfo are the zone's).
 */
export function NetworkGroupCard({ holder, group, onlyCodeId, isActing, canEnter, onEnter }: NetworkGroupCardProps) {
  const [codesOpen, setCodesOpen] = useState(false)
  const [showHidden] = useShowHiddenCodes()
  const codes = holder.codes.filter(code => code.groupId === group.id)
  const visibleCount = visibleCodes(codes, showHidden).length
  const showCodes = codesOpen || onlyCodeId !== null
  const Chevron = showCodes ? ChevronDown : ChevronRight
  const users = group.users ?? { superAdmins: 0, admins: 0 }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-2 bg-paper p-4" data-help="principal-red">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-ink">{group.name}</h3>
            {isActing && (
              <Badge className="bg-ember-soft text-[10.5px] text-ember-2 hover:bg-ember-soft">Trabajando acá</Badge>
            )}
          </div>
          <span className="text-[12px] text-muted-foreground">
            {group.organizerCode ? `organizador ${group.organizerCode} · ` : ''}
            {codes.length === 1 ? 'Productor independiente' : `${int(codes.length)} productores`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8" asChild>
            <Link href={networkUsersHref(holder.id, { groupId: group.id })}>
              <Users className="size-3.5" /> Ver usuarios
            </Link>
          </Button>
          <EnterButton name={group.name} canEnter={canEnter} onEnter={onEnter} />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {users.superAdmins === 0 ? (
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-amber-700 dark:text-amber-400">
            <UserPlus className="size-3.5" />
            Sin SuperAdmin
            {users.admins > 0 && <span className="font-normal">({plural(users.admins, 'Admin', 'Admin')})</span>}
          </span>
        ) : (
          <Stat icon={<Users />}>
            {plural(users.superAdmins, 'SuperAdmin', 'SuperAdmin')} · {plural(users.admins, 'Admin', 'Admin')}
          </Stat>
        )}
        <Stat icon={<ShieldCheck />}>{plural(group.clients ?? 0, 'asegurado', 'asegurados')}</Stat>
      </div>

      <div className="border-t border-line-2 pt-2">
        <button
          type="button"
          onClick={() => setCodesOpen(!codesOpen)}
          disabled={onlyCodeId !== null}
          aria-expanded={showCodes}
          className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink disabled:cursor-default"
        >
          <Chevron className="size-4 text-muted-foreground" />
          Productores ({visibleCount})
        </button>
        {showCodes && (
          <div className="mt-3">
            <PrincipalCodesBlock
              principalId={holder.id}
              codes={holder.codes}
              groups={holder.groups}
              asPrincipals
              onlyGroupId={group.id}
              onlyCodeId={onlyCodeId}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * A principal nobody uses the platform in yet (no SuperAdmin nor Admin): one line in Mi red, with its productores a
 * click away, «crear SuperAdmin» and «Entrar».
 */
export function NetworkPrincipalRow({ principal, onlyCodeId, isActing, canEnter, onEnter }: NetworkPrincipalCardProps) {
  const [open, setOpen] = useState(false)
  const [showHidden] = useShowHiddenCodes()
  const visibleCount = visibleCodes(principal.codes, showHidden).length
  const expanded = open || onlyCodeId !== null
  const Chevron = expanded ? ChevronDown : ChevronRight

  return (
    <div className="rounded-lg border border-line-2 bg-paper" data-help="principal-red-sin-usuarios">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={onlyCodeId !== null}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left disabled:cursor-default"
        >
          <Chevron className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-[13.5px] font-medium text-ink">{principal.name}</span>
          <span className="shrink-0 text-[12px] text-muted-foreground">
            {principal.masterCode ? `master ${principal.masterCode} · ` : ''}
            {plural(visibleCount, 'productor', 'productores')}
          </span>
          {principal.isHome && (
            <Badge variant="secondary" className="text-[10.5px]">
              Tu principal
            </Badge>
          )}
          {isActing && (
            <Badge className="bg-ember-soft text-[10.5px] text-ember-2 hover:bg-ember-soft">Trabajando acá</Badge>
          )}
          {!principal.isActive && (
            <Badge variant="outline" className="border-line-2 text-[10.5px] text-muted-foreground">
              Inactivo
            </Badge>
          )}
        </button>
        <Link
          href={networkUsersHref(principal.id, { newSuperAdmin: true })}
          className="flex items-center gap-1 text-[12.5px] font-medium text-amber-700 hover:underline dark:text-amber-400"
        >
          <UserPlus className="size-3.5" /> Crear SuperAdmin
        </Link>
        <EnterButton name={principal.name} canEnter={canEnter} onEnter={onEnter} />
      </div>
      {expanded && (
        <div className="border-t border-line-2 px-3 py-3">
          <PrincipalCodesBlock
            principalId={principal.id}
            codes={principal.codes}
            groups={principal.groups}
            onlyCodeId={onlyCodeId}
          />
        </div>
      )}
    </div>
  )
}
