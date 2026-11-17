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
import type { NetworkTreePrincipal } from '@/types/api/hierarchy'
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
          <Button
            size="sm"
            className="h-8"
            onClick={onEnter}
            disabled={!canEnter}
            title={canEnter ? `Trabajar en ${principal.name}` : 'Actualizando tu red…'}
          >
            <LogIn className="size-3.5" /> Entrar
          </Button>
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
          Productores ({principal.codes.length})
        </button>
        {showCodes && (
          <div className="mt-3">
            <PrincipalCodesBlock principalId={principal.id} codes={principal.codes} onlyCodeId={onlyCodeId} />
          </div>
        )}
      </div>
    </div>
  )
}
