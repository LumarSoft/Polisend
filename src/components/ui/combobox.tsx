'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export interface ComboboxOption {
  value: string
  label: string
  /** A second, quieter line (a code's holder, a principal's zone). Also searched. */
  hint?: string
}

interface ComboboxProps {
  value: string | null
  options: ComboboxOption[]
  onChange: (value: string) => void
  /** What the button says when nothing is chosen. */
  placeholder: string
  /** Names the control for screen readers ("Zona", "Principal"). */
  label: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** A select with a search box: type to narrow, arrows to move, Enter to choose, Esc to close. */
export function Combobox({
  value,
  options,
  onChange,
  placeholder,
  label,
  searchPlaceholder = 'Buscar…',
  emptyText = 'Sin resultados',
  disabled = false,
  className,
}: ComboboxProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)

  const selected = options.find(option => option.value === value) ?? null
  const needle = normalize(query.trim())
  const visible = needle
    ? options.filter(option => normalize(`${option.label} ${option.hint ?? ''}`).includes(needle))
    : options

  const choose = (option: ComboboxOption) => {
    onChange(option.value)
    setOpen(false)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setQuery('')
      setHighlighted(
        Math.max(
          0,
          options.findIndex(option => option.value === value),
        ),
      )
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted(index => Math.min(index + 1, visible.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted(index => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = visible[highlighted]
      if (option) choose(option)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={selected ? `${label}: ${selected.label}` : label}
          className={cn(
            'flex h-10 min-w-0 items-center gap-2 rounded-md border border-line-2 bg-background px-3 text-left text-[13px] text-ink-3 transition-colors hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className="text-[11px] text-faint">{label}</span>
          <span className={cn('min-w-0 flex-1 truncate', selected ? 'font-medium text-ink' : 'text-faint')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDownIcon className="size-3.5 shrink-0 text-faint" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-60 p-0">
        <div className="flex items-center gap-2 border-b border-line-2 px-2.5">
          <SearchIcon className="size-3.5 shrink-0 text-faint" />
          <input
            autoFocus
            value={query}
            onChange={event => {
              setQuery(event.target.value)
              setHighlighted(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            aria-label={`Buscar ${label.toLowerCase()}`}
            aria-controls={listId}
            className="h-9 w-full bg-transparent text-[13px] text-ink outline-hidden placeholder:text-faint"
          />
        </div>
        <ul id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto p-1">
          {visible.length === 0 && <li className="px-2 py-2 text-[12.5px] text-faint">{emptyText}</li>}
          {visible.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => choose(option)}
              className={cn(
                'flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-[13px] text-ink-3',
                index === highlighted && 'bg-accent text-accent-foreground',
              )}
            >
              <CheckIcon
                className={cn('mt-0.5 size-3.5 shrink-0 text-ember-2', option.value === value ? '' : 'invisible')}
              />
              <span className="min-w-0">
                <span className="block truncate">{option.label}</span>
                {option.hint && <span className="block truncate text-[11.5px] text-faint">{option.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
