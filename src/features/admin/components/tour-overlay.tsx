'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { Pointer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTour } from '../hooks/use-tour'
import { tourStore } from '../lib/tour-store'
import { GuideCard } from './guide-card'

/** How long a step waits for its element (navigation, data loading, a sheet opening). */
const FIND_TIMEOUT_MS = 6000
/** An improvement's guide shows the step in the middle sooner: its text still says what to do. */
const IMPROVEMENT_FIND_TIMEOUT_MS = 3500
/**
 * Right after a navigation the screen is still filling in (data, animations): for this long a
 * step keeps looking for a better-placed element before scrolling to the one it has.
 */
const SETTLE_MS = 700
/** A step whose element vanishes for this long falls back to the previous one. */
const LOST_GRACE_MS = 500
/** Breathing room between the element and the highlight ring. */
const PAD = 6
const GAP = 10
const EDGE = 12
/** The bubble's width and the room it needs above or below the element (it is never taller). */
const ASSISTANT_BUBBLE = { width: 340, room: 150 }
const IMPROVEMENT_BUBBLE = { width: 370, room: 230 }

/**
 * Whether the person can actually see the element: inside the window and not covered or clipped
 * by a scrolling container. The dim layer ignores the pointer, so the hit test sees through it.
 */
function isShown(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect()
  // Probe the middle of the part that's inside the window (a long list only shows its top).
  const top = Math.max(rect.top, 0)
  const bottom = Math.min(rect.bottom, window.innerHeight)
  const left = Math.max(rect.left, 0)
  const right = Math.min(rect.right, window.innerWidth)
  if (bottom - top < 8 || right - left < 8) return false
  const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2)
  return !!hit && node.contains(hit)
}

/**
 * The element carrying the anchor that the person can see best: one on screen and not covered,
 * else the first with a size (it gets scrolled into view). Several share an anchor on purpose
 * (every row of a list is `asegurado-fila`).
 */
function findTarget(anchor: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-help~="${anchor}"]`)
  let fallback: HTMLElement | null = null
  for (const node of nodes) {
    const rect = node.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) continue
    if (isShown(node)) return node
    fallback ??= node
  }
  return fallback
}

function sameRect(a: DOMRect | null, b: DOMRect): boolean {
  return (
    !!a &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  )
}

/** The smallest box holding both (the highlighted element and the button the step waits for). */
function union(a: DOMRect, b: DOMRect | null): DOMRect {
  if (!b) return a
  const left = Math.min(a.left, b.left)
  const top = Math.min(a.top, b.top)
  return new DOMRect(left, top, Math.max(a.right, b.right) - left, Math.max(a.bottom, b.bottom) - top)
}

function bubblePosition(rect: DOMRect, bubble: { width: number; room: number }): CSSProperties {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(bubble.width, vw - EDGE * 2)
  const centered = rect.left + rect.width / 2 - width / 2
  const left = Math.min(Math.max(centered, EDGE), vw - width - EDGE)
  if (vh - rect.bottom >= bubble.room) return { top: rect.bottom + PAD + GAP, left, width }
  if (rect.top >= bubble.room) return { bottom: vh - rect.top + PAD + GAP, left, width }
  // A tall element (a dialog): beside it, level with its bottom, where the button to tap usually is.
  const bottom = Math.max(vh - rect.bottom, EDGE)
  const side = width + PAD + GAP
  if (vw - rect.right - EDGE >= side) return { bottom, left: rect.right + PAD + GAP, width }
  if (rect.left - EDGE >= side) return { bottom, left: rect.left - side, width }
  // No room anywhere (a whole list, a phone): the bubble sits at the bottom of the screen.
  return { bottom: EDGE + 4, left, width }
}

/**
 * Runs the guide that was started: the assistant's "Mostrame en pantalla" or an improvement's step by
 * step. It takes the person to the guide's screen, rings the real element (`data-help` anchor) under a
 * dimmed page and shows a bubble saying what to do there. The dim never blocks clicks: the person does
 * the real thing on the real screen, and a step with `waitFor` moves on when they tap it. An
 * improvement's step without an element (or whose element is not there) shows in the middle.
 *
 * Built in-house instead of driver.js and the like: those expect the element to exist when the
 * step starts, while here it shows up after a navigation, a fetch or a sheet opening; and their
 * overlay swallows the "outside" click that closes a Radix menu or dialog.
 */
export function TourOverlay() {
  const { tour, step, run } = useTour()
  const pathname = usePathname()
  const router = useRouter()

  const current = tour?.steps[step] ?? null
  const isImprovement = tour?.kind === 'improvement'
  const isLast = tour ? step === tour.steps.length - 1 : false
  const canGoBack = step > 0 && !!tour?.steps[step - 1]?.waitFor
  const onRoute = !tour?.route || pathname === tour.route
  const findTimeout = isImprovement ? IMPROVEMENT_FIND_TIMEOUT_MS : FIND_TIMEOUT_MS

  // What the current step found, tagged with the step it belongs to: a new step starts blank
  // without an effect having to reset anything.
  const stepKey = `${run}:${step}`
  const [found, setFound] = useState<{
    key: string
    rect: DOMRect | null
    /** Where the bubble must not go: the element plus the button the step waits for. */
    avoid: DOMRect | null
    missing: boolean
  }>({ key: '', rect: null, avoid: null, missing: false })
  const rect = found.key === stepKey ? found.rect : null
  const avoid = found.key === stepKey ? found.avoid : null
  const missing = found.key === stepKey && found.missing
  const arrivedRef = useRef(false)

  const finish = useCallback(() => tourStore.stop(), [])
  const complete = useCallback(() => tourStore.stop(true), [])

  // Go to the guide's screen; leaving it halfway ends the guide.
  useEffect(() => {
    arrivedRef.current = false
  }, [run])
  useEffect(() => {
    if (!tour?.route) return
    if (onRoute) {
      arrivedRef.current = true
    } else if (arrivedRef.current) {
      finish()
    } else {
      router.push(tour.href ?? tour.route)
    }
  }, [tour, onRoute, router, finish])

  // Find the step's element and follow it (scroll, sheets animating, dialogs resizing).
  useEffect(() => {
    const target = current?.target
    if (!current || !target || !onRoute) return

    let element: HTMLElement | null = null
    const settleUntil = performance.now() + SETTLE_MS
    let deadline = performance.now() + findTimeout
    let seen = false
    let lostSince: number | null = null
    let frame = 0

    const track = () => {
      const now = performance.now()
      const settling = !seen && now < settleUntil
      if (!element?.isConnected || (settling && !isShown(element))) {
        element = findTarget(target)
      }

      if (element) {
        if (!seen && !settling) {
          seen = true
          if (!isShown(element)) {
            const tall = element.getBoundingClientRect().height > window.innerHeight * 0.7
            element.scrollIntoView({ block: tall ? 'start' : 'center', inline: 'center', behavior: 'smooth' })
          }
        }
        lostSince = null
        deadline = now + findTimeout
        const box = element.getBoundingClientRect()
        // The button that ends the step may sit outside the highlight (a dialog's footer).
        const waitBox =
          current.waitFor && current.waitFor !== target
            ? (findTarget(current.waitFor)?.getBoundingClientRect() ?? null)
            : null
        const keep = union(box, waitBox)
        setFound(prev =>
          prev.key === stepKey && !prev.missing && sameRect(prev.rect, box) && sameRect(prev.avoid, keep)
            ? prev
            : { key: stepKey, rect: box, avoid: keep, missing: false },
        )
      } else if (seen && canGoBack) {
        // What this step pointed at went away (the person closed the menu): go back to the step
        // that opens it instead of pointing at nothing.
        lostSince ??= now
        if (now - lostSince > LOST_GRACE_MS) {
          tourStore.back()
          return
        }
      } else if (now > deadline) {
        setFound(prev =>
          prev.key === stepKey && prev.missing ? prev : { key: stepKey, rect: null, avoid: null, missing: true },
        )
        // An improvement's step shows in the middle meanwhile and still rings the element if it turns up.
        if (!isImprovement) return
      }
      frame = requestAnimationFrame(track)
    }

    frame = requestAnimationFrame(track)
    return () => cancelAnimationFrame(frame)
  }, [current, onRoute, canGoBack, stepKey, findTimeout, isImprovement])

  // A step with `waitFor` moves on when the person taps the real element. Capture phase, so it
  // hears the tap even if the panel stops it, without ever interfering with it. Pointer down as
  // well as click: a Radix menu opens on pointer down and turns the page's pointer events off,
  // so the click of that same tap never reaches its trigger. Keyboard taps only bring the click.
  useEffect(() => {
    const anchor = current?.waitFor
    if (!anchor) return
    let tapped = false
    const onTap = (event: Event) => {
      if (tapped || !(event.target instanceof Element)) return
      if (!event.target.closest(`[data-help~="${anchor}"]`)) return
      tapped = true
      if (isLast) complete()
      else tourStore.next()
    }
    document.addEventListener('pointerdown', onTap, true)
    document.addEventListener('click', onTap, true)
    return () => {
      document.removeEventListener('pointerdown', onTap, true)
      document.removeEventListener('click', onTap, true)
    }
  }, [current, isLast, complete])

  useEffect(() => {
    if (!tour) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tour, finish])

  if (!tour || !current || typeof document === 'undefined' || !onRoute) return null
  // A step without an element shows in the middle at once; one with an element waits until it is found.
  const centered = !current.target || (isImprovement && missing)
  if (!centered && !rect && !missing) return null

  const total = tour.steps.length

  if (isImprovement) {
    return createPortal(
      <div className="pointer-events-none fixed inset-0 z-[100]" data-tour-overlay>
        {centered ? (
          <div
            key={`dim-${run}`}
            aria-hidden
            className="absolute inset-0 animate-in bg-black/45 fade-in-0 duration-300"
          />
        ) : (
          rect && (
            <div
              key={`ring-${run}`}
              aria-hidden
              className="absolute animate-in rounded-xl shadow-[0_0_0_9999px_rgb(0_0_0/0.45)] ring-2 ring-ember transition-all duration-300 ease-out fade-in-0"
              style={{
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
              }}
            >
              <span className="absolute inset-0 rounded-xl motion-safe:animate-[guide-pulse_1.8s_ease-out_infinite]" />
            </div>
          )
        )}

        <div
          key={`${stepKey}-${centered}`}
          className="pointer-events-auto absolute animate-in fade-in-0 zoom-in-95 duration-200"
          style={
            centered || !rect
              ? {
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `min(${IMPROVEMENT_BUBBLE.width + 30}px, calc(100vw - ${EDGE * 2}px))`,
                }
              : bubblePosition(avoid ?? rect, IMPROVEMENT_BUBBLE)
          }
        >
          <GuideCard
            heading={tour.heading ?? 'Novedad'}
            title={current.title ?? current.text}
            text={current.title ? current.text : null}
            index={step}
            total={total}
            waitsForTap={!!current.waitFor && !centered}
            onBack={tourStore.back}
            onNext={isLast ? complete : tourStore.next}
            onClose={finish}
          />
        </div>
      </div>,
      document.body,
    )
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]" data-tour-overlay>
      {rect && (
        <div
          aria-hidden
          className="absolute rounded-xl shadow-[0_0_0_9999px_rgb(0_0_0/0.45)] ring-2 ring-ember transition-all duration-200 ease-out"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      <div
        key={`${stepKey}-${missing}`}
        role="dialog"
        aria-live="polite"
        aria-label="Guía en pantalla"
        className="pointer-events-auto absolute animate-in fade-in-0 zoom-in-95 rounded-xl border border-line-2 bg-popover p-3 text-[13.5px] text-popover-foreground shadow-lg"
        style={
          rect
            ? bubblePosition(avoid ?? rect, ASSISTANT_BUBBLE)
            : { bottom: 24, left: '50%', transform: 'translateX(-50%)', width: 'min(340px, calc(100vw - 24px))' }
        }
      >
        <div className="flex items-start gap-2">
          <p className="flex-1 leading-snug font-medium text-pretty text-ink">
            {missing ? (current.missing ?? 'No lo encuentro en esta pantalla.') : current.text}
          </p>
          <button
            type="button"
            onClick={finish}
            aria-label="Cerrar la guía"
            className="-m-1 rounded p-1 text-muted-foreground transition-colors hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="mt-2.5 flex min-h-7 items-center justify-between gap-2">
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {total > 1 && !missing ? `${step + 1} de ${total}` : ''}
          </span>
          {missing ? (
            <Button size="sm" variant="outline" onClick={finish}>
              Entendido
            </Button>
          ) : current.waitFor ? (
            <span className="flex items-center gap-1 text-[12px] font-medium text-ember-2">
              <Pointer className="size-3.5" />
              Tocá donde está marcado
            </span>
          ) : (
            <Button size="sm" onClick={isLast ? complete : tourStore.next}>
              {isLast ? 'Listo' : 'Siguiente'}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
