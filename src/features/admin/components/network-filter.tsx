'use client'

import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { cn } from '@/lib/utils'
import type { HierarchyPrincipal } from '@/types/api/hierarchy'
import { useActingPrincipal } from '../context/acting-principal-context'
import { useHierarchyPrincipals } from '../hooks/use-hierarchy'
import { useRole } from '../hooks/use-role'
import { useShowHiddenCodes, visibleCodes } from '../hooks/use-hidden-codes'
import { NO_ZONE, noZoneLabel, zoneKeyOf, zonesOf, type NetworkZone, type ZoneKey } from '../lib/network'

const ALL = 'all'

/** The three levels as plain list filters (network mode): null = every zone, principal or productor. */
export interface NetworkListFilterValue {
  zoneKey: ZoneKey | null
  principalId: number | null
  producerCodeId: number | null
}

export const EMPTY_NETWORK_FILTER: NetworkListFilterValue = { zoneKey: null, principalId: null, producerCodeId: null }

interface WorkModeProps {
  /** Work screens (default): Zona and Principal choose the Owner's acting principal; Productor filters its data. */
  mode?: 'work'
  /**
   * The productor, when the screen keeps it with its own scope (SectionScopeFilter does): otherwise the shared choice
   * of the acting principal, which follows the Owner from tab to tab.
   */
  producerCodeId?: number | null
  onProducerCodeChange?: (id: number | null) => void
  /** Hide the Productor level where the screen's data is not by code. */
  showProducer?: boolean
  className?: string
}

interface NetworkModeProps {
  /** "Mi red", "Usuarios", "Consumo de la red": the three levels filter a list of the whole network. */
  mode: 'network'
  value: NetworkListFilterValue
  onChange: (value: NetworkListFilterValue) => void
  showProducer?: boolean
  className?: string
}

export type NetworkFilterProps = WorkModeProps | NetworkModeProps

/**
 * The Owner's cascading filter Zona › Principal › Productor (plan §6.2): each level lists only what the one before
 * allows. In work mode it renders only for an Owner (SuperAdmin and Admin keep ScopeFilter); in network mode it works
 * for whoever reaches /hierarchy/principals (Developer, Owner, SuperAdmin).
 */
export function NetworkFilter(props: NetworkFilterProps) {
  return props.mode === 'network' ? <NetworkListFilter {...props} /> : <WorkNetworkFilter {...props} />
}

function zoneOptions(zones: NetworkZone[]): ComboboxOption[] {
  return zones.map(zone => ({
    value: String(zone.key),
    label: zone.name,
    hint: zone.principals.length === 1 ? '1 principal' : `${zone.principals.length} principales`,
  }))
}

function principalOptions(principals: HierarchyPrincipal[]): ComboboxOption[] {
  return principals.map(principal => ({
    value: String(principal.id),
    label: principal.name,
    hint: [principal.isHome ? 'Tu principal' : null, principal.isActive ? null : 'Inactivo']
      .filter(Boolean)
      .join(' · '),
  }))
}

/** The principal's codes; blocked ones only with the preference on (or when already chosen). */
function producerOptions(
  principal: HierarchyPrincipal | null,
  showHidden: boolean,
  chosen: number | null,
): ComboboxOption[] {
  return [
    { value: ALL, label: 'Todos' },
    ...visibleCodes(principal?.codes ?? [], showHidden, chosen).map(code => ({
      value: String(code.id),
      label: code.code,
      hint:
        [code.holderName, code.triunfoBlocked ? 'Bloqueado en Triunfo' : null].filter(Boolean).join(' · ') || undefined,
    })),
  ]
}

function parseZoneKey(raw: string): ZoneKey | null {
  if (raw === ALL) return null
  return raw === NO_ZONE ? NO_ZONE : Number(raw)
}

function parseId(raw: string): number | null {
  return raw === ALL ? null : Number(raw)
}

function WorkNetworkFilter({
  producerCodeId,
  onProducerCodeChange,
  showProducer = true,
  className,
}: Omit<WorkModeProps, 'mode'>) {
  const acting = useActingPrincipal()
  const [showHidden] = useShowHiddenCodes()
  if (!acting.isOwnerSession) return null

  const producer = producerCodeId !== undefined ? producerCodeId : acting.selection.producerCodeId
  const setProducer = onProducerCodeChange ?? acting.selectProducerCode

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} data-help="filtro-red">
      <Combobox
        label="Zona"
        placeholder="Elegí una zona"
        value={acting.selection.zoneKey === null ? null : String(acting.selection.zoneKey)}
        options={zoneOptions(acting.zones)}
        onChange={raw => {
          const key = parseZoneKey(raw)
          if (key !== null) acting.selectZone(key)
        }}
        disabled={acting.isLoading}
        className="w-48"
      />
      <Combobox
        label="Principal"
        placeholder="Elegí un principal"
        value={acting.selection.principalId === null ? null : String(acting.selection.principalId)}
        options={principalOptions(acting.zone?.principals ?? [])}
        onChange={raw => acting.selectPrincipal(Number(raw))}
        disabled={acting.isLoading || !acting.zone}
        className="w-56"
      />
      {showProducer && (
        <Combobox
          label="Productor"
          placeholder="Todos"
          value={producer === null ? ALL : String(producer)}
          options={producerOptions(acting.principal, showHidden, producer)}
          onChange={raw => setProducer(parseId(raw))}
          disabled={!acting.principal}
          className="w-52"
        />
      )}
    </div>
  )
}

function NetworkListFilter({ value, onChange, showProducer = true, className }: Omit<NetworkModeProps, 'mode'>) {
  const { isDeveloper, isOwner, isSuperAdmin } = useRole()
  const { data: principals = [], isLoading } = useHierarchyPrincipals(isDeveloper || isOwner || isSuperAdmin)
  const [showHidden] = useShowHiddenCodes()
  const zones = zonesOf(principals, noZoneLabel(isDeveloper))
  const zone = zones.find(z => z.key === value.zoneKey) ?? null
  const inZone = zone ? zone.principals : principals
  const principal = inZone.find(p => p.id === value.principalId) ?? null

  const changeZone = (key: ZoneKey | null) => {
    const keeps = principal !== null && (key === null || zoneKeyOf(principal) === key)
    onChange(keeps ? { ...value, zoneKey: key } : { zoneKey: key, principalId: null, producerCodeId: null })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} data-help="filtro-red">
      <Combobox
        label="Zona"
        placeholder="Todas"
        value={value.zoneKey === null ? ALL : String(value.zoneKey)}
        options={[{ value: ALL, label: 'Todas' }, ...zoneOptions(zones)]}
        onChange={raw => changeZone(parseZoneKey(raw))}
        disabled={isLoading}
        className="w-48"
      />
      <Combobox
        label="Principal"
        placeholder="Todos"
        value={value.principalId === null ? ALL : String(value.principalId)}
        options={[{ value: ALL, label: 'Todos' }, ...principalOptions(inZone)]}
        onChange={raw => onChange({ ...value, principalId: parseId(raw), producerCodeId: null })}
        disabled={isLoading}
        className="w-56"
      />
      {showProducer && (
        <Combobox
          label="Productor"
          placeholder="Todos"
          value={value.producerCodeId === null ? ALL : String(value.producerCodeId)}
          options={producerOptions(principal, showHidden, value.producerCodeId)}
          onChange={raw => onChange({ ...value, producerCodeId: parseId(raw) })}
          disabled={!principal}
          className="w-52"
        />
      )}
    </div>
  )
}
