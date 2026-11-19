'use client'

import { useId } from 'react'
import { AnimatePresence, motion, useReducedMotion, type TargetAndTransition, type Transition } from 'framer-motion'
import { cn } from '@/lib/utils'

/** What the assistant is doing, as its face shows it. */
export type AssistantMood = 'idle' | 'thinking' | 'writing' | 'happy' | 'worried'

/** Where its eyes look: toward the box while the person writes, for instance. */
export type AssistantGaze = 'left' | 'right' | 'down' | null

/** The body: a soft, slightly uneven round, like something alive rather than a badge. */
const BODY = 'M12 2.6c4.9 0 8.6 2.9 8.9 8.1.3 5.6-3.4 10.6-8.9 10.7S2.9 17.1 3.1 11.2C3.3 5.8 7.1 2.6 12 2.6z'
/** Happy eyes: two small arcs. */
const HAPPY_LEFT = 'M8.05 12.35c.38-1.25 2.12-1.25 2.5 0'
const HAPPY_RIGHT = 'M13.45 12.35c.38-1.25 2.12-1.25 2.5 0'

const GAZE: Record<NonNullable<AssistantGaze>, { x: number; y: number }> = {
  left: { x: -1.2, y: 0.3 },
  right: { x: 1.2, y: 0.3 },
  down: { x: 0, y: 1 },
}

interface AssistantMarkProps {
  /** Side in pixels. */
  size?: number
  mood?: AssistantMood
  gaze?: AssistantGaze
  /** A soft iris glow behind it (the empty conversation, the round button). */
  halo?: boolean
  /** No idle blinking or breathing: an older message, a list. Moods still show. */
  still?: boolean
  className?: string
}

/**
 * The assistant's mark, "Compañero": a small character in the assistant's own
 * iris, the same in every palette, whose face says what it is doing. It blinks
 * now and then, looks around while it thinks, reads while it writes, smiles
 * when it finishes and worries when something failed. With reduced motion it
 * keeps each face still. Usable anywhere in the panel, from 16 px up.
 */
export function AssistantMark({
  size = 24,
  mood = 'idle',
  gaze = null,
  halo = false,
  still = false,
  className,
}: AssistantMarkProps) {
  const id = useId().replace(/:/g, '')
  const reduced = (useReducedMotion() ?? false) || (still && mood === 'idle')
  const small = size < 20
  const fill = `assistant-body-${id}`
  const shine = `assistant-shine-${id}`
  const look = gaze ? GAZE[gaze] : { x: 0, y: 0 }

  const body = bodyMotion(mood, reduced)
  const eyes = eyesMotion(mood, reduced, look)

  return (
    <span
      aria-hidden
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
    >
      {(halo || mood === 'thinking' || mood === 'writing') && (
        <motion.span
          className="absolute inset-[-12%] rounded-full bg-iris-glow blur-md"
          initial={false}
          animate={
            !reduced && (mood === 'thinking' || mood === 'writing')
              ? { opacity: [0.45, 0.95, 0.45], scale: [0.92, 1.08, 0.92] }
              : { opacity: halo ? 0.7 : 0, scale: 1 }
          }
          transition={
            !reduced && (mood === 'thinking' || mood === 'writing')
              ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
        />
      )}
      <svg viewBox="0 0 24 24" width={size} height={size} className="relative overflow-visible">
        <defs>
          <linearGradient id={fill} x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--color-iris-3)" />
            <stop offset="0.55" stopColor="var(--color-iris)" />
            <stop offset="1" stopColor="var(--color-iris-2)" />
          </linearGradient>
          <radialGradient id={shine} cx="8" cy="6" r="9" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="white" stopOpacity="0.42" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <motion.g
          style={{ transformOrigin: '12px 13px', transformBox: 'view-box' }}
          initial={false}
          animate={body.animate}
          transition={body.transition}
        >
          <path d={BODY} fill={`url(#${fill})`} />
          {!small && <path d={BODY} fill={`url(#${shine})`} />}
          <motion.g initial={false} animate={eyes.animate} transition={eyes.transition}>
            <AnimatePresence initial={false} mode="wait">
              {mood === 'happy' ? (
                <motion.g
                  key="happy"
                  initial={reduced ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ transformOrigin: '12px 12px', transformBox: 'view-box' }}
                >
                  <path d={HAPPY_LEFT} fill="none" stroke="white" strokeWidth={small ? 2 : 1.6} strokeLinecap="round" />
                  <path
                    d={HAPPY_RIGHT}
                    fill="none"
                    stroke="white"
                    strokeWidth={small ? 2 : 1.6}
                    strokeLinecap="round"
                  />
                </motion.g>
              ) : (
                <motion.g
                  key="open"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                >
                  <Eye x={small ? 8 : 8.3} mood={mood} small={small} reduced={reduced} side="left" />
                  <Eye x={small ? 13.6 : 13.7} mood={mood} small={small} reduced={reduced} side="right" />
                </motion.g>
              )}
            </AnimatePresence>
          </motion.g>
        </motion.g>
      </svg>
    </span>
  )
}

/** One eye: a soft vertical pill that blinks, squints while it reads, and tilts when worried. */
function Eye({
  x,
  mood,
  small,
  reduced,
  side,
}: {
  x: number
  mood: AssistantMood
  small: boolean
  reduced: boolean
  side: 'left' | 'right'
}) {
  const width = small ? 2.4 : 2
  const worried = mood === 'worried'
  const height = worried ? 2.8 : small ? 4.2 : 3.8
  const y = worried ? 10.5 : small ? 9.3 : 9.6
  const blink: TargetAndTransition =
    mood === 'idle' && !reduced
      ? { scaleY: [1, 1, 0.12, 1], rotate: 0 }
      : { scaleY: mood === 'writing' ? 0.72 : 1, rotate: worried ? (side === 'left' ? 14 : -14) : 0 }
  const transition: Transition =
    mood === 'idle' && !reduced
      ? { duration: 4.6, times: [0, 0.93, 0.96, 1], repeat: Infinity, delay: side === 'left' ? 0 : 0.02 }
      : { duration: 0.2 }
  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={width / 2}
      fill="white"
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      initial={false}
      animate={blink}
      transition={transition}
    />
  )
}

function bodyMotion(mood: AssistantMood, reduced: boolean): { animate: TargetAndTransition; transition: Transition } {
  if (reduced) return { animate: { scale: 1, y: 0, rotate: 0 }, transition: { duration: 0.2 } }
  switch (mood) {
    case 'thinking':
      return {
        animate: { scaleX: [1, 1.045, 0.97, 1], scaleY: [1, 0.955, 1.03, 1], y: 0, rotate: 0 },
        transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
      }
    case 'writing':
      return { animate: { y: [0, -0.5, 0], rotate: 0, scale: 1 }, transition: { duration: 0.9, repeat: Infinity } }
    case 'happy':
      return {
        animate: { y: [0, -1.6, 0], rotate: [0, -4, 0], scale: 1 },
        transition: { duration: 0.5, ease: 'easeOut' },
      }
    case 'worried':
      return { animate: { rotate: [0, -3, 3, 0], y: 0, scale: 1 }, transition: { duration: 0.5 } }
    default:
      return {
        animate: { scale: [1, 1.018, 1], y: 0, rotate: 0 },
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
      }
  }
}

function eyesMotion(
  mood: AssistantMood,
  reduced: boolean,
  look: { x: number; y: number },
): { animate: TargetAndTransition; transition: Transition } {
  if (mood === 'thinking' && !reduced) {
    return {
      animate: { x: [0, -1.3, -1.3, 1.3, 1.3, 0], y: [0, -0.3, -0.3, -0.3, -0.3, 0] },
      transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
    }
  }
  if (mood === 'writing' && !reduced) {
    return {
      animate: { x: [-0.6, 0.6, -0.6], y: 0.7 },
      transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
    }
  }
  return { animate: { x: look.x, y: look.y }, transition: { type: 'spring', stiffness: 260, damping: 22 } }
}
