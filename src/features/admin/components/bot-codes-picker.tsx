'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { AdminPhoneNumber } from '@/types/api/phone-numbers'
import type { ProducerCodeOption } from '@/types/api/users'

/** From this many codes the list gets a search box. */
const SEARCH_FROM = 8

/**
 * The codes a number's bot answers for (Lucas, 19/11/2026: "es distinto ver la información en el panel que responder
 * por todos"). A client of a code left out who writes to this number is not found in its cartera; what the panel shows
 * does not depend on it. The responsible code is always answered: it comes checked and fixed.
 */
export function BotCodesPicker({
  codes,
  value,
  onChange,
  responsibleId,
}: {
  codes: ProducerCodeOption[]
  /** The checked codes (the responsible one may or may not be among them). */
  value: number[]
  onChange: (ids: number[]) => void
  responsibleId?: number
}) {
  const [query, setQuery] = useState('')
  // Inactive codes only while still checked, so they can be unchecked.
  const options = useMemo(() => codes.filter(c => c.isActive || value.includes(c.id)), [codes, value])
  const term = query.trim().toLowerCase()
  const shown = term
    ? options.filter(c => c.code.toLowerCase().includes(term) || (c.holderName ?? '').toLowerCase().includes(term))
    : options
  const checked = new Set(value)
  if (responsibleId != null) checked.add(responsibleId)
  const answered = options.filter(c => checked.has(c.id)).length

  const toggle = (id: number) => onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id])
  const setShown = (on: boolean) => {
    const ids = new Set(shown.map(c => c.id))
    onChange(on ? [...new Set([...value, ...ids])] : value.filter(id => !ids.has(id)))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12.5px] text-muted-foreground">
          {answered === options.length && options.length > 0
            ? `Todos los códigos (${options.length})`
            : `${answered} de ${options.length} códigos`}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setShown(true)}
            className="rounded-md px-2 py-1 text-[12.5px] font-medium text-ember-2 hover:bg-ember-soft"
          >
            {term ? 'Marcar los que se ven' : 'Marcar todos'}
          </button>
          <button
            type="button"
            onClick={() => setShown(false)}
            className="rounded-md px-2 py-1 text-[12.5px] font-medium text-ink-3 hover:bg-secondary"
          >
            {term ? 'Desmarcar los que se ven' : 'Ninguno'}
          </button>
        </div>
      </div>
      {options.length >= SEARCH_FROM && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por código o productor"
            aria-label="Buscar código"
            className="h-9 pl-8 text-[13px]"
          />
        </div>
      )}
      <div className="max-h-56 overflow-y-auto rounded-md border border-line-2 p-2">
        {shown.length === 0 && (
          <p className="px-1.5 py-1.5 text-[13px] text-muted-foreground">Ningún código coincide.</p>
        )}
        {shown.map(c => {
          const fixed = c.id === responsibleId
          return (
            <label
              key={c.id}
              className={`flex items-center gap-2 rounded px-1.5 py-1.5 ${fixed ? '' : 'cursor-pointer hover:bg-secondary'}`}
            >
              <input
                type="checkbox"
                className="size-4 accent-ember-2"
                checked={checked.has(c.id)}
                disabled={fixed}
                onChange={() => toggle(c.id)}
              />
              <span className="text-[13px] text-ink">
                <span className="font-medium">{c.code}</span>
                {c.holderName ? <span className="text-muted-foreground"> · {c.holderName}</span> : null}
                {fixed && <span className="text-muted-foreground"> · responsable</span>}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Which codes a number's bot answers for, as the API resolves it: its responsible code plus the ones it also serves;
 * with neither, every code. `null` = every code.
 */
export function botCodeIds(number: Pick<AdminPhoneNumber, 'responsibleCode' | 'servedCodes'>): number[] | null {
  const ids = new Set(number.servedCodes.map(c => c.id))
  if (number.responsibleCode) ids.add(number.responsibleCode.id)
  return ids.size ? [...ids] : null
}

/** "Todos los códigos" or "N códigos" for a number's bot; every active code counts as all. */
export function botCodesLabel(ids: number[] | null, codes: ProducerCodeOption[] | undefined): string {
  if (ids === null) return 'todos los códigos'
  const active = codes?.filter(c => c.isActive) ?? []
  if (active.length > 0 && active.every(c => ids.includes(c.id))) return 'todos los códigos'
  return ids.length === 1 ? '1 código' : `${ids.length} códigos`
}
