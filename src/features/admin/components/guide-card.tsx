'use client'

import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Pointer, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GuideCardProps {
  /** What the guide is about ("Novedad en Whatsapp"). */
  heading: string
  title: string
  text?: string | null
  /** 0-based. */
  index: number
  total: number
  /** The step moves on when the person taps the ringed element: no "Siguiente" button. */
  waitsForTap?: boolean
  onBack?: () => void
  onNext?: () => void
  onClose?: () => void
  className?: string
  style?: CSSProperties
}

/**
 * One step of an improvement's guide: a thin bar that fills as the steps go by, the step's headline and
 * text, dots and the buttons to move. The overlay places it next to the ringed element; the editor shows
 * it as a preview.
 */
export function GuideCard({
  heading,
  title,
  text,
  index,
  total,
  waitsForTap = false,
  onBack,
  onNext,
  onClose,
  className,
  style,
}: GuideCardProps) {
  const reduced = useReducedMotion()
  const isLast = index === total - 1

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={heading}
      style={style}
      className={cn(
        'overflow-hidden rounded-2xl border border-line-2 bg-popover text-popover-foreground shadow-[0_24px_60px_-16px_rgb(0_0_0/0.45)]',
        className,
      )}
    >
      <div className="h-1 bg-paper-2">
        <motion.div
          className="h-full rounded-r-full bg-ember"
          initial={false}
          animate={{ width: `${((index + 1) / total) * 100}%` }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 24 }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-ember-2 uppercase">
            <Sparkles className="size-3.5 shrink-0" />
            <span className="truncate">{heading}</span>
          </span>
          <span className="ml-auto shrink-0 text-[12px] text-faint tabular-nums">
            {index + 1} de {total}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar el paso a paso"
              className="-my-1 -mr-1.5 grid size-7 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-secondary hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <motion.div
          key={index}
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="mt-2.5 font-display text-[16.5px] leading-snug font-semibold tracking-tight text-pretty text-ink">
            {title}
          </h3>
          {text && <p className="mt-1.5 text-[13.5px] leading-relaxed text-pretty text-ink-3">{text}</p>}
        </motion.div>

        <div className="mt-4 flex min-h-8 items-center gap-2">
          {total > 1 && (
            <div className="flex items-center gap-1" aria-hidden>
              {Array.from({ length: total }, (_, i) => (
                <motion.span
                  key={i}
                  initial={false}
                  animate={{ width: i === index ? 18 : 6 }}
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 26 }}
                  className={cn('h-1.5 rounded-full', i <= index ? 'bg-ember' : 'bg-line-strong')}
                />
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {index > 0 && onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="text-ink-3">
                <ArrowLeft className="size-3.5" /> Atrás
              </Button>
            )}
            {waitsForTap ? (
              <span className="flex items-center gap-1.5 pl-1 text-[12.5px] font-medium text-ember-2">
                <Pointer className="size-3.5 motion-safe:animate-bounce" />
                Tocá donde está marcado
              </span>
            ) : (
              onNext && (
                <Button size="sm" onClick={onNext}>
                  {isLast ? (
                    <>
                      <Check className="size-3.5" /> Listo
                    </>
                  ) : (
                    <>
                      Siguiente <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
