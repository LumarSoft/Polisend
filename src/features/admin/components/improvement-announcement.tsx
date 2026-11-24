'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Play, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import type { ImprovementGuide } from '@/types/api/improvements'
import { useImprovementGuides, useMarkImprovementSeen } from '../hooks/use-improvements'
import { useTour } from '../hooks/use-tour'
import { guideScreenLabel, guideScreenPath, playGuide } from '../lib/improvement-guides'

/** Lets the screen settle (data, its own animations) before the card slides in. */
const SHOW_AFTER_MS = 1100

interface AnnouncementCardProps {
  guide: Pick<ImprovementGuide, 'title' | 'summary' | 'screen' | 'steps'>
  /** More announcements waiting on this screen after this one. */
  more?: number
  onPlay?: () => void
  onDismiss?: () => void
  className?: string
}

/** The card itself: also the editor's preview. */
export function AnnouncementCard({ guide, more = 0, onPlay, onDismiss, className }: AnnouncementCardProps) {
  const reduced = useReducedMotion()
  const steps = guide.steps.length

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-line-2 bg-popover text-popover-foreground shadow-[0_22px_55px_-18px_rgb(0_0_0/0.45),0_2px_8px_-2px_rgb(0_0_0/0.08)]',
        className,
      )}
    >
      {/* A soft glow of the panel's colour behind the corner. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-14 size-48 rounded-full bg-ember/15 blur-3xl"
      />

      <div className="relative p-4">
        <div className="flex items-center gap-3">
          <motion.span
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-ember text-on-ember shadow-sm"
            animate={reduced ? undefined : { rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 1.1, delay: 0.35, repeat: 1, repeatDelay: 2.4, ease: 'easeInOut' }}
          >
            <Sparkles className="size-[18px]" />
          </motion.span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[10.5px] font-semibold tracking-[0.16em] text-ember-2 uppercase">Novedad</p>
            <p className="truncate text-[12.5px] text-faint">en {guideScreenLabel(guide.screen)}</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar y no volver a mostrar"
            title="No volver a mostrar"
            className="-mt-1 -mr-1.5 grid size-7 shrink-0 place-items-center self-start rounded-full text-faint transition-colors hover:bg-secondary hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <h3 className="mt-3 font-display text-[16px] leading-snug font-semibold tracking-tight text-pretty text-ink">
          {guide.title}
        </h3>
        <p className="mt-1 line-clamp-3 text-[13.5px] leading-relaxed text-pretty text-ink-3">{guide.summary}</p>

        <div className="mt-4 flex items-center gap-2">
          {steps > 0 ? (
            <>
              <Button size="sm" onClick={onPlay} className="group">
                <Play className="size-3.5 fill-current transition-transform group-hover:scale-110" />
                Mostrame cómo
              </Button>
              <span className="text-[12px] text-faint tabular-nums">{steps === 1 ? '1 paso' : `${steps} pasos`}</span>
              <Button variant="ghost" size="sm" onClick={onDismiss} className="ml-auto text-ink-3">
                Entendido
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onDismiss} className="ml-auto">
              Entendido
            </Button>
          )}
        </div>

        {more > 0 && (
          <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] text-faint">
            {more === 1 ? 'Hay 1 novedad más en esta sección.' : `Hay ${more} novedades más en esta sección.`}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * What's new, where it is new: an improvement with a screen shows its card once to each person, the first
 * times they open that screen, until they close it or start its guide. It never blocks the screen (no dim,
 * no focus trap) and waits while a guide runs. The guide stays in Mejoras to replay.
 */
export function ImprovementAnnouncement({ placement }: { placement: 'fab' | 'inbox' }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const { state, isMobile } = useSidebar()
  const { data: guides } = useImprovementGuides()
  const { tour } = useTour()
  const markSeen = useMarkImprovementSeen()

  const waiting = (guides ?? []).filter(guide => guide.announce && guideScreenPath(guide.screen) === pathname)
  const guide = waiting[0] ?? null
  const key = guide ? `${pathname}:${guide.id}` : null

  // Shown a moment after landing on the screen (and after the previous card left).
  const [readyKey, setReadyKey] = useState<string | null>(null)
  useEffect(() => {
    if (!key) return
    const timer = window.setTimeout(() => setReadyKey(key), SHOW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [key])

  const visible = !!guide && readyKey === key && !tour

  const close = (target: ImprovementGuide) => markSeen.mutate(target.id)
  const play = (target: ImprovementGuide) => {
    markSeen.mutate(target.id)
    playGuide(target, { fromAnnouncement: true })
  }

  // Above the assistant's button; in Whatsapp, where the box to write in sits on the right, next to the menu.
  // On a phone's Whatsapp, at the top: the chat and its box fill the bottom.
  const style: CSSProperties =
    placement === 'inbox'
      ? isMobile
        ? { left: 12, top: 64 }
        : { left: `calc(var(--sidebar-width${state === 'expanded' ? '' : '-icon'}) + 1.75rem)`, bottom: 20 }
      : { right: isMobile ? 12 : 20, bottom: 'calc(max(20px, env(safe-area-inset-bottom)) + 4.5rem)' }

  return (
    <AnimatePresence>
      {visible && guide && (
        <motion.aside
          key={guide.id}
          role="status"
          aria-live="polite"
          aria-label={`Novedad: ${guide.title}`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.18 } }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          style={style}
          className="fixed z-40 w-[min(360px,calc(100vw-24px))]"
        >
          <AnnouncementCard
            guide={guide}
            more={waiting.length - 1}
            onPlay={() => play(guide)}
            onDismiss={() => close(guide)}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
