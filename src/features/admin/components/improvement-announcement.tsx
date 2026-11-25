'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Play, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ImprovementGuide } from '@/types/api/improvements'
import { useImprovementGuides } from '../hooks/use-improvements'
import { useTour } from '../hooks/use-tour'
import { guideScreenLabel, guideScreenPath, playGuide } from '../lib/improvement-guides'
import { markImprovementSeen, useImprovementSeen } from '../lib/improvement-seen'

/** Lets the screen settle (data, its own animations) before the notice opens. */
const SHOW_AFTER_MS = 1100
/** The guide starts once the notice and its blur are gone. */
const GUIDE_AFTER_CLOSE_MS = 280

interface AnnouncementCardProps {
  guide: Pick<ImprovementGuide, 'title' | 'summary' | 'screen' | 'steps'>
  /** More announcements waiting on this screen after this one. */
  more?: number
  onPlay?: () => void
  onDismiss?: () => void
  className?: string
}

/** The notice itself: also the editor's preview. */
export function AnnouncementCard({ guide, more = 0, onPlay, onDismiss, className }: AnnouncementCardProps) {
  const reduced = useReducedMotion()
  const steps = guide.steps.length

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-line-2 bg-popover text-center text-popover-foreground shadow-[0_30px_80px_-20px_rgb(0_0_0/0.5),0_2px_10px_-2px_rgb(0_0_0/0.1)]',
        className,
      )}
    >
      {/* A soft glow of the panel's colour behind the top. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[130%] -translate-x-1/2 rounded-full bg-ember/20 blur-3xl"
      />

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar y no volver a mostrar"
        title="No volver a mostrar"
        className="absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-full text-faint transition-colors hover:bg-secondary hover:text-ink"
      >
        <X className="size-4" />
      </button>

      <div className="relative px-6 pt-8 pb-6 sm:px-8">
        <motion.span
          className="mx-auto grid size-14 place-items-center rounded-2xl bg-ember text-on-ember shadow-[0_14px_34px_-12px_var(--color-ember)]"
          initial={reduced ? false : { scale: 0.6, rotate: -12, opacity: 0 }}
          animate={reduced ? undefined : { scale: [0.6, 1.08, 1], rotate: [-12, 6, 0], opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <Sparkles className="size-7" />
        </motion.span>

        <p className="mt-4 text-[11px] font-semibold tracking-[0.18em] text-ember-2 uppercase">
          Novedad en {guideScreenLabel(guide.screen)}
        </p>
        <h2 className="mt-2 font-display text-[20px] leading-snug font-semibold tracking-tight text-balance text-ink">
          {guide.title}
        </h2>
        <p className="mx-auto mt-2 max-w-[34ch] text-[14px] leading-relaxed text-pretty text-ink-3">{guide.summary}</p>

        <div className="mt-6 flex flex-col gap-2">
          {steps > 0 && (
            <Button data-announcement-primary onClick={onPlay} className="group h-11 w-full text-[14px]">
              <Play className="size-4 fill-current transition-transform group-hover:scale-110" />
              Mostrame cómo
              <span className="font-normal opacity-80">· {steps === 1 ? '1 paso' : `${steps} pasos`}</span>
            </Button>
          )}
          <Button
            data-announcement-primary={steps === 0 ? '' : undefined}
            variant={steps > 0 ? 'ghost' : 'default'}
            onClick={onDismiss}
            className={cn('h-10 w-full', steps > 0 && 'text-ink-3')}
          >
            Entendido
          </Button>
        </div>

        {more > 0 && (
          <p className="mt-4 text-[12px] text-faint">
            {more === 1 ? 'Hay 1 novedad más en esta sección.' : `Hay ${more} novedades más en esta sección.`}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * What's new, where it is new: an improvement with a screen opens its notice in the middle of that screen,
 * over a blur, once per browser (several people share an account, so the mark is in this browser's
 * localStorage). Closing it in any way, or starting its guide, is the one time. It waits while a guide
 * runs. The guide stays in Mejoras to replay.
 */
export function ImprovementAnnouncement() {
  const pathname = usePathname()
  const { data: guides } = useImprovementGuides()
  const isSeen = useImprovementSeen()
  const { tour } = useTour()

  const waiting = isSeen
    ? (guides ?? []).filter(guide => guide.announce && !isSeen(guide.id) && guideScreenPath(guide.screen) === pathname)
    : []
  const guide = waiting[0] ?? null
  const key = guide ? `${pathname}:${guide.id}` : null

  // Opened a moment after landing on the screen (and after the previous notice left).
  const [readyKey, setReadyKey] = useState<string | null>(null)
  useEffect(() => {
    if (!key) return
    const timer = window.setTimeout(() => setReadyKey(key), SHOW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [key])

  // What the notice shows while it closes, once its mark has already taken it off the list.
  const [closing, setClosing] = useState<ImprovementGuide | null>(null)
  const open = !!guide && readyKey === key && !tour
  const shown = open ? guide : closing

  const close = (target: ImprovementGuide) => {
    setClosing(target)
    markImprovementSeen(target.id)
  }
  const play = (target: ImprovementGuide) => {
    close(target)
    window.setTimeout(() => playGuide(target, { fromAnnouncement: true }), GUIDE_AFTER_CLOSE_MS)
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={next => {
        // Escape or a tap outside: it was seen too.
        if (!next && guide) close(guide)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[49] bg-black/25 backdrop-blur-md duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 dark:bg-black/45" />
        <DialogPrimitive.Content
          onOpenAutoFocus={event => {
            // The main button, not the ✕ at the top.
            event.preventDefault()
            ;(event.currentTarget as HTMLElement | null)
              ?.querySelector<HTMLElement>('[data-announcement-primary]')
              ?.focus()
          }}
          className="fixed top-1/2 left-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-90 data-open:slide-in-from-bottom-4 data-open:duration-500 data-open:ease-[cubic-bezier(0.34,1.4,0.64,1)] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:duration-200"
        >
          {shown && (
            <>
              <DialogPrimitive.Title className="sr-only">Novedad: {shown.title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">{shown.summary}</DialogPrimitive.Description>
              <AnnouncementCard
                guide={shown}
                more={open ? waiting.length - 1 : 0}
                onPlay={() => play(shown)}
                onDismiss={() => close(shown)}
              />
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
