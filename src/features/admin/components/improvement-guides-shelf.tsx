'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImprovementGuide } from '@/types/api/improvements'
import { useImprovementGuides } from '../hooks/use-improvements'
import { guideScreenLabel, guideScreenPath, playGuide } from '../lib/improvement-guides'
import { AREA_ICON, improvementDate } from './improvement-card'

/** Tiles shown before "Ver todos". */
const FIRST_TILES = 4

function GuideTile({ guide, index }: { guide: ImprovementGuide; index: number }) {
  const reduced = useReducedMotion()
  const Icon = AREA_ICON[guide.area]
  const steps = guide.steps.length
  const date = improvementDate(guide)

  return (
    <motion.button
      type="button"
      onClick={() => playGuide(guide)}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-start gap-3 rounded-2xl border border-line-2 bg-card p-3.5 text-left shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-ember/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ember focus-visible:outline-none"
    >
      <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-ember-soft text-ember-2 transition-colors group-hover:bg-ember group-hover:text-on-ember">
        <Icon className="size-[18px] transition-opacity group-hover:opacity-0" />
        <Play className="absolute size-4 fill-current opacity-0 transition-[opacity,transform] group-hover:scale-110 group-hover:opacity-100" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11.5px] text-faint">
          {guideScreenLabel(guide.screen)} · {steps === 1 ? '1 paso' : `${steps} pasos`}
          {date && <span className="hidden sm:inline"> · {date}</span>}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[14px] leading-snug font-medium text-ink">{guide.title}</span>
      </span>
    </motion.button>
  )
}

/**
 * "Paso a paso" at the top of Mejoras: every improvement that has a guide, to watch it again on its
 * screen. The same guides each screen offered once with its announcement card.
 */
export function ImprovementGuidesShelf() {
  const { data } = useImprovementGuides()
  const [expanded, setExpanded] = useState(false)
  const guides = (data ?? []).filter(guide => guide.steps.length > 0 && !!guideScreenPath(guide.screen))
  if (guides.length === 0) return null

  const shown = expanded ? guides : guides.slice(0, FIRST_TILES)

  return (
    <section aria-labelledby="mejoras-paso-a-paso" className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2
          id="mejoras-paso-a-paso"
          className="flex items-center gap-1.5 font-display text-[15px] font-semibold tracking-tight text-ink"
        >
          <Play className="size-3.5 fill-ember-2 text-ember-2" />
          Paso a paso
        </h2>
        <p className="text-[12.5px] text-muted-foreground">Mirá de nuevo cómo se usa cada novedad, en su pantalla.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((guide, i) => (
          <GuideTile key={guide.id} guide={guide} index={i} />
        ))}
      </div>
      {guides.length > FIRST_TILES && (
        <button
          type="button"
          onClick={() => setExpanded(open => !open)}
          className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-ember-2 hover:underline"
        >
          {expanded ? 'Ver menos' : `Ver todos (${guides.length})`}
          <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
        </button>
      )}
    </section>
  )
}
