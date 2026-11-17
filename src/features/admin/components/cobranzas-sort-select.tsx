import type { CobranzaSort } from '@/types/api/cobranzas'

/** What both cobranzas worklists open with: what fell due last on top. */
export const DEFAULT_COBRANZA_SORT: CobranzaSort = 'recent'

const SORTS: { value: CobranzaSort; label: string }[] = [
  { value: 'recent', label: 'Vencidas hace poco' },
  { value: 'oldest', label: 'Más tiempo vencidas' },
]

/** The order of a cobranzas worklist (Cuotas and Pólizas vencidas share it). */
export function CobranzasSortSelect({
  value,
  onChange,
}: {
  value: CobranzaSort
  onChange: (value: CobranzaSort) => void
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as CobranzaSort)}
      className="h-9 rounded-md border border-line-2 bg-background px-2.5 text-[12.5px] text-ink-3"
      aria-label="Ordenar"
    >
      {SORTS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
